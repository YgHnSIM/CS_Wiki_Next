import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { walkWikiMarkdownFiles, writeJson } from "../shared/fs.mjs";
import { parseFrontmatter } from "../parse/frontmatter.mjs";

const prefixByKind = {
  concept: "concept",
  entity: "entity",
  analysis: "analysis",
  source: "source",
  reference: "source",
  meta: "document"
};

const kindPrefixes = ["concept-", "entity-", "analysis-", "meta-", "source-"];

export function slugFromId(id, kind) {
  if (kind === "source" || kind === "reference") return id;
  let rest = id;
  for (const prefix of kindPrefixes) {
    if (rest.startsWith(prefix)) {
      rest = rest.slice(prefix.length);
      break;
    }
  }
  if (/^[a-z][a-z0-9-]*$/.test(rest) && !/^[0-9a-f]{10,}$/.test(rest) && !/-[0-9a-f]{10,}$/.test(rest)) return rest;
  const hash = id.match(/([0-9a-f]{8,})$/)?.[1]?.slice(0, 8) || "unknown";
  return `page-${hash}`;
}

export async function seedRegistry(root = process.cwd(), { dryRun = false } = {}) {
  const files = await walkWikiMarkdownFiles(root);
  const pages = [];
  const seenIds = new Set();

  for (const file of files) {
    const text = await readFile(file, "utf8");
    const data = parseFrontmatter(text, file);
    const id = typeof data.id === "string" ? data.id : "";
    if (!id) throw new Error(`missing id: ${file}`);
    if (seenIds.has(id)) throw new Error(`duplicate id: ${id}`);
    seenIds.add(id);
    const kind = typeof data.kind === "string" ? data.kind : "";
    const prefix = prefixByKind[kind];
    if (!prefix) throw new Error(`unsupported kind '${kind}': ${file}`);
    pages.push({
      id,
      kind,
      prefix,
      title: data.title || id,
      aliases: data.aliases || [],
      filename: path.basename(file, ".md")
    });
  }

  if (pages.length === 0) {
    throw new Error("no wiki pages found");
  }

  const nodes = [];
  const keys = new Set();
  const aliasMap = new Map();
  const collisions = [];
  const reviews = await readFile(path.join(root, "catalog", "reviews.yml"), "utf8")
    .then((text) => YAML.parse(text) || {})
    .catch(() => ({}));
  const reviewed = new Set(Array.isArray(reviews.reviewed) ? reviews.reviewed : []);
  const overrides = reviews.overrides && typeof reviews.overrides === "object" ? reviews.overrides : {};

  for (const page of pages) {
    const base = `${page.prefix}:${slugFromId(page.id, page.kind)}`;
    const override = overrides[base] && typeof overrides[base] === "object" ? overrides[base] : {};
    const key = override.key || base;
    if (keys.has(key)) throw new Error(`registry key collision: ${key}`);
    keys.add(key);

    const aliases = [...new Set([
      page.title,
      ...(Array.isArray(page.aliases) ? page.aliases : []),
      page.id,
      page.filename,
      base,
      ...(Array.isArray(override.aliases) ? override.aliases : [])
    ].filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()))];

    for (const alias of aliases) {
      if (!aliasMap.has(alias)) aliasMap.set(alias, key);
      else if (aliasMap.get(alias) !== key) {
        collisions.push({ alias, kept: aliasMap.get(alias), ignored: key, page_id: page.id });
      }
    }

    nodes.push({
      key,
      type: override.type || page.prefix,
      labels: override.labels || { ko: page.title },
      aliases,
      external_ids: override.external_ids || {},
      same_as: override.same_as || [],
      status: override.status || (reviewed.has(key) ? "reviewed" : "auto"),
      page_id: page.id
    });
  }

  nodes.sort((a, b) => a.key.localeCompare(b.key));
  const aliases = Object.fromEntries([...aliasMap.entries()].sort(([a], [b]) => a.localeCompare(b)));
  const report = {
    generatedAt: new Date().toISOString(),
    pages: pages.length,
    nodes: nodes.length,
    aliases: Object.keys(aliases).length,
    collisions,
    hashKeys: nodes.filter((node) => /:page-[0-9a-f]{8}$/.test(node.key)).length,
    types: nodes.reduce((accumulator, node) => {
      accumulator[node.type] = (accumulator[node.type] || 0) + 1;
      return accumulator;
    }, {})
  };

  if (!dryRun) {
    await writeFile(path.join(root, "catalog", "nodes.yml"), YAML.stringify({ schema_version: 1, nodes }, { lineWidth: 0 }), "utf8");
    await writeFile(path.join(root, "catalog", "aliases.yml"), YAML.stringify({ aliases }, { lineWidth: 0 }), "utf8");
    await writeJson(path.join(root, "output", "registry-report.json"), report);
  }

  return report;
}
