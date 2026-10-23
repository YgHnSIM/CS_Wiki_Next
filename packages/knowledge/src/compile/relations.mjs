import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { parseRelations } from "../parse/relations.mjs";

export const relationStart = "<!-- knowledge:relations:start -->";
export const relationEnd = "<!-- knowledge:relations:end -->";

async function walk(directory, root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (relative === "wiki/logs") continue;
      files.push(...await walk(absolute, root));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolute);
    }
  }
  return files;
}

export function parseDocument(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`missing frontmatter: ${file}`);
  const data = YAML.parse(match[1]);
  if (!data || typeof data !== "object") throw new Error(`invalid frontmatter: ${file}`);
  return { data, body: match[2] };
}

export async function loadWorkspace(root = process.cwd()) {
  const registry = YAML.parse(await readFile(path.join(root, "catalog", "nodes.yml"), "utf8"));
  const aliases = YAML.parse(await readFile(path.join(root, "catalog", "aliases.yml"), "utf8")).aliases;
  const nodes = registry.nodes || [];
  const nodeByPage = new Map(nodes.map((node) => [node.page_id, node]));
  const nodeByKey = new Map(nodes.map((node) => [node.key, node]));
  const pages = [];
  const byName = new Map();

  for (const file of (await walk(path.join(root, "wiki"), root)).sort()) {
    const { data, body } = parseDocument(await readFile(file, "utf8"), file);
    const node = nodeByPage.get(data.id);
    if (!node) throw new Error(`page has no registry node: ${data.id}`);
    const page = {
      id: data.id,
      key: node.key,
      kind: data.kind,
      title: data.title || data.id,
      filename: path.basename(file, ".md"),
      aliases: Array.isArray(data.aliases) ? data.aliases : [],
      data,
      body,
      filePath: file
    };
    pages.push(page);
    for (const name of [page.title, ...page.aliases, page.id, page.filename]) {
      if (!byName.has(name)) byName.set(name, page);
    }
  }

  return { root, nodes, aliases, nodeByPage, nodeByKey, pages, byName };
}

export function resolvePage(workspace, name) {
  const nodeKey = workspace.aliases[name];
  if (nodeKey) {
    const node = workspace.nodeByKey.get(nodeKey);
    const page = node ? workspace.pages.find((candidate) => candidate.id === node.page_id) : null;
    if (page) return page;
  }
  return workspace.byName.get(name) || null;
}

export function extractRelations(page, workspace) {
  const relations = [];
  for (const relation of parseRelations(page.body, { pageTitle: page.title })) {
    const target = resolvePage(workspace, relation.target);
    if (!target) throw new Error(`unresolved relation target '${relation.target}' on ${page.id}`);
    const evidence = [];
    for (const name of relation.evidence || []) {
      const source = resolvePage(workspace, name);
      if (!source) throw new Error(`unresolved relation evidence '${name}' on ${page.id}`);
      evidence.push({ source: source.id });
    }
    relations.push({
      predicate: relation.kind,
      target: target.key,
      note: relation.note,
      evidence
    });
  }
  return relations;
}

function escapeCell(value) {
  return String(value || "").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

export function renderRelations(relations, workspace) {
  if (!relations.length) return "";
  const rows = relations.map((relation) => {
    const target = workspace.nodeByKey.get(relation.target);
    const targetLabel = target?.labels?.ko || relation.target;
    const evidence = (relation.evidence || [])
      .map((item) => {
        const source = workspace.pages.find((page) => page.id === item.source);
        return source ? `[[${source.title}]]` : item.source;
      })
      .join(", ") || "-";
    return `| ${relation.predicate} | [[${targetLabel}]] | ${escapeCell(relation.note)} | ${evidence} |`;
  });
  return [
    relationStart,
    "| 관계 | 대상 | 설명 | 근거 |",
    "|---|---|---|---|",
    ...rows,
    relationEnd
  ].join("\n");
}

export function replaceRelationSection(body, relations, workspace) {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+관계\s*$/.test(line));
  if (start < 0) throw new Error("missing ## 관계 section");
  let end = start + 1;
  while (end < lines.length && !/^##\s+/.test(lines[end])) end += 1;
  const before = lines.slice(0, start + 1);
  const after = lines.slice(end);
  const block = renderRelations(relations, workspace).split("\n");
  return [...before, "", ...block, "", ...after].join("\n");
}

export function updateBody(body, relations, workspace) {
  if (relations.length) return replaceRelationSection(body, relations, workspace);
  return body.replace(/\n*<!-- knowledge:relations:start -->[\s\S]*?<!-- knowledge:relations:end -->\n*/g, "\n");
}

export function renderPage(data, body) {
  const frontmatter = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
  const cleanBody = body.replace(/^\n+/, "").replace(/\s*$/, "\n");
  return `---\n${frontmatter}\n---\n\n${cleanBody}`;
}
