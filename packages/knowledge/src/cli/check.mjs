import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const nodesFile = YAML.parse(await readFile(path.join(root, "catalog", "nodes.yml"), "utf8"));
const aliasesFile = YAML.parse(await readFile(path.join(root, "catalog", "aliases.yml"), "utf8"));
const reviews = await readFile(path.join(root, "catalog", "reviews.yml"), "utf8")
  .then((text) => YAML.parse(text) || {})
  .catch(() => ({}));
const routes = JSON.parse(await readFile(path.join(root, "contracts", "routes.json"), "utf8"));

const nodes = Array.isArray(nodesFile.nodes) ? nodesFile.nodes : [];
const aliases = aliasesFile.aliases && typeof aliasesFile.aliases === "object" ? aliasesFile.aliases : {};
const errors = [];
const warnings = [];
const keyPattern = /^(person|organization|concept|entity|work|event|place|artifact|analysis|document|source):[a-z0-9][a-z0-9-]*$/;
const types = new Set(["person", "organization", "concept", "entity", "work", "event", "place", "artifact", "analysis", "document", "source"]);
const statuses = new Set(["auto", "reviewed", "deprecated"]);
const keys = new Set();
const pages = new Set();

for (const node of nodes) {
  if (!keyPattern.test(node.key || "")) errors.push(`invalid key: ${node.key}`);
  if (keys.has(node.key)) errors.push(`duplicate key: ${node.key}`);
  keys.add(node.key);
  if (pages.has(node.page_id)) errors.push(`duplicate page_id: ${node.page_id}`);
  pages.add(node.page_id);
  if (!types.has(node.type)) errors.push(`invalid type: ${node.key} ${node.type}`);
  if (!statuses.has(node.status)) errors.push(`invalid status: ${node.key} ${node.status}`);
  if (!node.labels || !Object.values(node.labels).some((value) => typeof value === "string" && value.trim())) {
    errors.push(`missing label: ${node.key}`);
  }
  if (!Array.isArray(node.aliases) || node.aliases.length === 0) errors.push(`missing aliases: ${node.key}`);
}

for (const [alias, key] of Object.entries(aliases)) {
  if (!keys.has(key)) errors.push(`alias points to missing key: ${alias} -> ${key}`);
}

for (const pageId of routes.pages.map((page) => page.id)) {
  if (!pages.has(pageId)) errors.push(`route page has no registry node: ${pageId}`);
}

const reviewed = new Set(Array.isArray(reviews.reviewed) ? reviews.reviewed : []);
for (const key of reviewed) if (!keys.has(key)) errors.push(`reviewed key missing: ${key}`);
for (const [base, override] of Object.entries(reviews.overrides || {})) {
  if (!override?.key || !keys.has(override.key)) errors.push(`override target missing: ${base} -> ${override?.key}`);
}

const counts = {
  nodes: nodes.length,
  aliases: Object.keys(aliases).length,
  reviewed: nodes.filter((node) => node.status === "reviewed").length,
  auto: nodes.filter((node) => node.status === "auto").length,
  provisional: nodes.filter((node) => /:page-[0-9a-f]{8}$/.test(node.key)).length
};
console.log(`Knowledge check: ${counts.nodes} nodes, ${counts.aliases} aliases, ${counts.reviewed} reviewed, ${counts.auto} auto, ${counts.provisional} provisional`);
for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);
if (errors.length) process.exitCode = 1;
