import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "app", "dist");
const routes = JSON.parse(await readFile(path.join(root, "contracts", "routes.json"), "utf8"));
const traceCatalog = JSON.parse(await readFile(path.join(root, "catalog", "traces.json"), "utf8"));
const documents = JSON.parse(await readFile(path.join(root, "data", "build", "documents.json"), "utf8"));
const missing = [];

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

for (const document of documents) {
  const file = path.join(dist, "docs", document.id, "index.html");
  if (!(await exists(file))) missing.push(`doc ${document.id}`);
}

for (const from of Object.keys(routes.redirects)) {
  const legacy = from.replace(/^\/+|\/+$/g, "");
  if (!legacy || legacy.startsWith("docs/")) continue;
  if (!(await exists(path.join(dist, legacy, "index.html")))) missing.push(`redirect ${from}`);
}

const staticPages = ["index.html", "index/index.html", "history/index.html", "evidence/index.html", "search/index.html", "traces/index.html", ...traceCatalog.traces.map((trace) => `traces/${trace.id}/index.html`), "guides/index.html", "guides/reading/index.html", "guides/evidence/index.html", "404.html"];
for (const page of staticPages) if (!(await exists(path.join(dist, page)))) missing.push(`static ${page}`);
if (!(await exists(path.join(dist, "robots.txt")))) missing.push("robots.txt");
if (!(await exists(path.join(dist, "sitemap.xml")))) missing.push("sitemap.xml");

const searchRecords = JSON.parse(await readFile(path.join(dist, "search.json"), "utf8"));
const publicDocuments = documents.filter((document) => document.publication_visibility === "public");
for (const document of publicDocuments) {
  if (!searchRecords.some((record) => record.url.endsWith(document.url))) missing.push(`search ${document.url}`);
}
if (searchRecords.length !== publicDocuments.length) {
  console.error(`search records ${searchRecords.length} do not match public documents ${publicDocuments.length}`);
  process.exitCode = 1;
}

const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
for (const document of publicDocuments) {
  if (!sitemapUrls.some((url) => url.endsWith(document.url))) missing.push(`sitemap ${document.url}`);
}
const staticSitemapPaths = ["/", "/index/", "/history/", "/evidence/", "/search/", "/traces/", ...traceCatalog.traces.map((trace) => `/traces/${trace.id}/`), "/guides/", "/guides/reading/", "/guides/evidence/"];
for (const route of staticSitemapPaths) {
  if (!sitemapUrls.some((url) => url.endsWith(route))) missing.push(`sitemap ${route}`);
}

const noindex = [];
for (const document of documents.filter((item) => item.publication_visibility === "unlisted")) {
  const file = path.join(dist, "docs", document.id, "index.html");
  if (await exists(file)) {
    const html = await readFile(file, "utf8");
    if (!html.includes('name="robots" content="noindex"')) noindex.push(document.id);
  }
}

console.log(`Site parity: ${documents.length} docs, ${Object.keys(routes.redirects).length} redirects, ${searchRecords.length} search records, ${sitemapUrls.length} sitemap URLs, ${noindex.length} unlisted noindex violations`);
if (missing.length) {
  console.error(`missing ${missing.length} route(s)`);
  for (const item of missing.slice(0, 30)) console.error(`- ${item}`);
  process.exitCode = 1;
}
if (noindex.length) process.exitCode = 1;
