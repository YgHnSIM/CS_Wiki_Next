import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");

const prefixByKind = {
  concept: "concept",
  entity: "entity",
  analysis: "analysis",
  source: "source",
  reference: "source",
  meta: "document"
};

const kindPrefixes = ["concept-", "entity-", "analysis-", "meta-", "source-"];

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

function parseFrontmatter(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error(`missing frontmatter: ${file}`);
  const data = YAML.parse(match[1]);
  if (!data || typeof data !== "object") throw new Error(`invalid frontmatter: ${file}`);
  return data;
}

function slugFromId(id, kind) {
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

const files = await walk(path.join(root, "wiki"));
const pages = [];
const seenIds = new Set();

for (const file of files.sort()) {
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
  let key = override.key || base;
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
  await mkdir(path.join(root, "output"), { recursive: true });
  await writeFile(path.join(root, "output", "registry-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
}

console.log(`${dryRun ? "dry-run: " : ""}${report.pages} pages, ${report.nodes} nodes, ${report.aliases} aliases, ${report.collisions.length} alias collisions, ${report.hashKeys} provisional hash keys`);
console.log(report.types);
if (report.collisions.length) {
  console.log("alias collisions:");
  for (const collision of report.collisions.slice(0, 20)) console.log(`- ${collision.alias}: ${collision.kept} vs ${collision.ignored}`);
}
