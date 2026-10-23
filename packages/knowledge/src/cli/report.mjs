import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { parseRelations } from "../parse/relations.mjs";

const root = process.cwd();
const json = process.argv.includes("--json");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (relative === "wiki/logs") continue;
      files.push(...await walk(absolute));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolute);
    }
  }
  return files;
}

function parseDocument(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`missing frontmatter: ${file}`);
  const data = YAML.parse(match[1]);
  if (!data || typeof data !== "object") throw new Error(`invalid frontmatter: ${file}`);
  return { data, body: match[2] };
}

const registry = YAML.parse(await readFile(path.join(root, "catalog", "nodes.yml"), "utf8"));
const aliasRegistry = YAML.parse(await readFile(path.join(root, "catalog", "aliases.yml"), "utf8")).aliases;
const nodes = registry.nodes;
const nodeByPage = new Map(nodes.map((node) => [node.page_id, node]));
const nodeByKey = new Map(nodes.map((node) => [node.key, node]));

const files = await walk(path.join(root, "wiki"));
const pages = [];
const pageByTitle = new Map();

for (const file of files.sort()) {
  const text = await readFile(file, "utf8");
  const { data, body } = parseDocument(text, file);
  const id = data.id;
  if (!id) throw new Error(`missing id: ${file}`);
  const node = nodeByPage.get(id);
  if (!node) throw new Error(`page has no registry node: ${id}`);
  const page = {
    id,
    kind: data.kind,
    title: data.title || id,
    filename: path.basename(file, ".md"),
    key: node.key,
    aliases: Array.isArray(data.aliases) ? data.aliases : [],
    body,
    relations: []
  };
  pages.push(page);
  for (const name of [page.title, ...page.aliases, page.id, page.filename]) {
    if (!pageByTitle.has(name)) pageByTitle.set(name, id);
  }
}

function resolvePage(name) {
  const id = aliasRegistry[name] ? nodeByKey.get(aliasRegistry[name])?.page_id : pageByTitle.get(name);
  return id ? pages.find((page) => page.id === id) : null;
}

const unresolvedTargets = [];
const unresolvedEvidence = [];
const missingEvidence = [];
const selfRelations = [];
const duplicateEdges = [];
const edgeKeys = new Set();
const degree = new Map();
const relationErrors = [];

for (const page of pages) {
  try {
    page.relations = parseRelations(page.body, { pageTitle: page.title });
  } catch (error) {
    relationErrors.push({ page: page.id, error: error.message });
    continue;
  }
  for (const relation of page.relations) {
    const target = resolvePage(relation.target);
    if (!target) {
      unresolvedTargets.push({ page: page.id, target: relation.target, line: relation.line });
      continue;
    }
    if (!relation.evidence?.length) missingEvidence.push({ page: page.id, target: relation.target, line: relation.line });
    if (target.id === page.id) selfRelations.push({ page: page.id, target: relation.target, line: relation.line });

    const evidenceIds = [];
    for (const title of relation.evidence || []) {
      const source = resolvePage(title);
      if (!source) unresolvedEvidence.push({ page: page.id, evidence: title, line: relation.line });
      else evidenceIds.push(source.id);
    }

    const edgeKey = [page.key, relation.kind, target.key, [...evidenceIds].sort().join(",")].join("|");
    if (edgeKeys.has(edgeKey)) duplicateEdges.push({ page: page.id, target: target.id, predicate: relation.kind, line: relation.line });
    edgeKeys.add(edgeKey);

    degree.set(page.key, (degree.get(page.key) || 0) + 1);
    degree.set(target.key, (degree.get(target.key) || 0) + 1);
  }
}

const topNodes = [...degree.entries()]
  .map(([nodeKey, value]) => {
    const node = nodeByKey.get(nodeKey);
    return { key: nodeKey, title: node?.labels?.ko || nodeKey, type: node?.type || "unknown", degree: value, status: node?.status || "unknown" };
  })
  .sort((a, b) => b.degree - a.degree || a.key.localeCompare(b.key))
  .slice(0, 50);

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    pages: pages.length,
    pagesWithRelations: pages.filter((page) => page.relations.length).length,
    relations: pages.reduce((sum, page) => sum + page.relations.length, 0),
    nodes: nodes.length
  },
  issues: {
    relationErrors,
    unresolvedTargets,
    unresolvedEvidence,
    missingEvidence,
    selfRelations,
    duplicateEdges
  },
  topNodes
};

await mkdir(path.join(root, "output"), { recursive: true });
await writeFile(path.join(root, "output", "relations-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const { totals, issues } = report;
  console.log(`Relations preflight: ${totals.pages} pages, ${totals.pagesWithRelations} with relations, ${totals.relations} relations`);
  console.log(`unresolved targets: ${issues.unresolvedTargets.length}, unresolved evidence: ${issues.unresolvedEvidence.length}, missing evidence: ${issues.missingEvidence.length}, self: ${issues.selfRelations.length}, duplicate edges: ${issues.duplicateEdges.length}, table errors: ${issues.relationErrors.length}`);
  console.log("top nodes:");
  for (const node of topNodes.slice(0, 10)) console.log(`- ${node.title} (${node.key}) degree=${node.degree} status=${node.status}`);
  console.log("wrote output/relations-report.json");
}

if (relationErrors.length || unresolvedTargets.length || unresolvedEvidence.length || selfRelations.length) process.exitCode = 1;
