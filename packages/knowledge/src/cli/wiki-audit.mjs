import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadWorkspace } from "../compile/relations.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const id = value("id");
const key = value("key");
const json = args.includes("--json");
const strict = args.includes("--strict");
if (!id && !key) {
  console.error("Usage: npm run wiki:audit -- (--id <id> | --key <key>) [--json] [--strict]");
  process.exit(1);
}
const workspace = await loadWorkspace(root);
const page = id
  ? workspace.pages.find((item) => item.id === id)
  : workspace.pages.find((item) => item.key === key);
if (!page) {
  console.error(`page not found: ${id || key}`);
  process.exit(1);
}
const pageById = new Map(workspace.pages.map((item) => [item.id, item]));

function normalize(value) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

async function rawText(sourcePage) {
  for (const item of sourcePage.data.access || []) {
    if (!item.path) continue;
    if (/\.(pdf|png|jpe?g|gif|webp|zip|mp4)$/i.test(item.path)) return null;
    try {
      return await readFile(path.join(root, item.path), "utf8");
    } catch {
      return null;
    }
  }
  return null;
}

const evidence = [];
const sourceIds = new Set();
for (const relation of page.data.relations || []) {
  for (const item of relation.evidence || []) sourceIds.add(item.source);
}
const sourceTexts = new Map();
for (const sourceId of sourceIds) {
  const source = pageById.get(sourceId);
  if (!source) continue;
  sourceTexts.set(sourceId, await rawText(source));
}
if (!sourceTexts.has(page.id)) {
  const ownText = await rawText(page);
  if (ownText) sourceTexts.set(page.id, ownText);
}
for (const relation of page.data.relations || []) {
  for (const item of relation.evidence || []) {
    const text = sourceTexts.get(item.source);
    evidence.push({
      source: item.source,
      locator: item.locator || null,
      quote: item.quote || null,
      found: item.quote && text ? normalize(text).includes(normalize(item.quote)) : null
    });
  }
}

const body = page.body;
const claims = [];
const claimPattern = /(?:["“][^"”]{8,}["”])|(?:\b(?:1[0-9]{3}|20[0-9]{2})\b)|(?:\b\d+(?:[.,]\d+)?\s?(?:%|ms|s|GB|MB|KB|TB|W|kW|MHz|GHz|Hz|K|M|B)\b)/gi;
for (const match of body.matchAll(claimPattern)) {
  const text = match[0].replace(/^["“]|["”]$/g, "").trim();
  if (!text || claims.some((claim) => claim.text === text)) continue;
  const found = [...sourceTexts.entries()]
    .filter(([, sourceText]) => sourceText)
    .filter(([, sourceText]) => normalize(sourceText).includes(normalize(text)) || normalize(sourceText).replaceAll(",", "").includes(normalize(text).replaceAll(",", "")))
    .map(([source]) => source);
  claims.push({ text, found: found.length > 0, sources: found });
  if (claims.length >= 50) break;
}

const unverified = claims.filter((claim) => !claim.found).length + evidence.filter((item) => item.found === false).length;
const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  id: page.id,
  key: page.key,
  title: page.title,
  sources: [...sourceIds],
  evidence,
  claims,
  unverified
};
await mkdir(path.join(root, "output", "audit"), { recursive: true });
await writeFile(path.join(root, "output", "audit", `${page.id}.json`), JSON.stringify(report, null, 2) + "\n", "utf8");

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Audit: ${page.id} ${page.title}`);
  console.log(`Sources: ${sourceIds.size}, claims: ${claims.length}, unverified: ${unverified}`);
  for (const item of evidence) {
    if (item.found === false) console.log(`- quote not found: ${item.source} ${item.locator || ""}`);
  }
  for (const claim of claims.filter((item) => !item.found)) console.log(`- unverified claim: ${claim.text}`);
}
if (strict && unverified > 0) process.exitCode = 1;
