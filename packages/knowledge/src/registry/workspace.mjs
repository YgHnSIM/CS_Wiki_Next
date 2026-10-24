import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { walkWikiMarkdownFiles } from "../shared/fs.mjs";
import { parseDocument } from "../parse/frontmatter.mjs";
import { parseRelations } from "../parse/relations.mjs";

export async function loadWorkspace(root = process.cwd()) {
  const registry = YAML.parse(await readFile(path.join(root, "catalog", "nodes.yml"), "utf8"));
  const aliases = YAML.parse(await readFile(path.join(root, "catalog", "aliases.yml"), "utf8")).aliases || {};
  const nodes = registry.nodes || [];
  const nodeByPage = new Map(nodes.map((node) => [node.page_id, node]));
  const nodeByKey = new Map(nodes.map((node) => [node.key, node]));
  const pages = [];
  const pageById = new Map();
  const pageByKey = new Map();
  const byName = new Map();

  for (const file of await walkWikiMarkdownFiles(root)) {
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
    pageById.set(page.id, page);
    pageByKey.set(page.key, page);
    for (const name of [page.title, ...page.aliases, page.id, page.filename, page.key]) {
      if (name && !byName.has(name)) byName.set(name, page);
    }
  }

  return { root, nodes, aliases, nodeByPage, nodeByKey, pages, pageById, pageByKey, byName };
}

export function resolvePage(workspace, name) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return null;
  const nodeKey = workspace.aliases[cleanName];
  if (nodeKey) {
    const node = workspace.nodeByKey.get(nodeKey);
    const page = node ? (workspace.pageById?.get(node.page_id) || workspace.pages.find((candidate) => candidate.id === node.page_id)) : null;
    if (page) return page;
  }
  return workspace.byName.get(cleanName) || workspace.pageById?.get(cleanName) || workspace.pageByKey?.get(cleanName) || null;
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
