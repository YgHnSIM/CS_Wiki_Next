import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "app", "dist");
const routes = JSON.parse(await readFile(path.join(root, "contracts", "routes.json"), "utf8"));
const missing = [];

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

for (const page of routes.pages) {
  const file = path.join(dist, "docs", page.id, "index.html");
  if (!(await exists(file))) missing.push(`doc ${page.id}`);
}

for (const from of Object.keys(routes.redirects)) {
  const legacy = from.replace(/^\/+|\/+$/g, "");
  if (!legacy || legacy.startsWith("docs/")) continue;
  if (!(await exists(path.join(dist, legacy, "index.html")))) missing.push(`redirect ${from}`);
}

const staticPages = ["index.html", "index/index.html", "map/index.html", "history/index.html", "evidence/index.html", "search/index.html", "404.html"];
for (const page of staticPages) if (!(await exists(path.join(dist, page)))) missing.push(`static ${page}`);

const docs = (await readFile(path.join(dist, "search.json"), "utf8"));
const searchRecords = JSON.parse(docs).length;
const noindex = [];
for (const page of routes.pages.filter((item) => item.publicationVisibility === "unlisted")) {
  const file = path.join(dist, "docs", page.id, "index.html");
  if (await exists(file)) {
    const html = await readFile(file, "utf8");
    if (!html.includes('name="robots" content="noindex"')) noindex.push(page.id);
  }
}

console.log(`Site parity: ${routes.pages.length} docs, ${Object.keys(routes.redirects).length} redirects, ${searchRecords} search records, ${noindex.length} unlisted noindex violations`);
if (missing.length) {
  console.error(`missing ${missing.length} route(s)`);
  for (const item of missing.slice(0, 30)) console.error(`- ${item}`);
  process.exitCode = 1;
}
if (searchRecords !== 397) {
  console.error(`expected 397 public search records, got ${searchRecords}`);
  process.exitCode = 1;
}
if (noindex.length) process.exitCode = 1;
