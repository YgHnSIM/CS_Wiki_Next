import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "app", "dist");
const configuredBase = process.env.SITE_BASE || "";
const detectedBase = await detectBase();
const base = configuredBase || detectedBase || "/";
const basePrefix = base === "/" ? "" : base.replace(/\/$/, "");

async function detectBase() {
  try {
    const html = await readFile(path.join(dist, "index.html"), "utf8");
    const match = html.match(/(?:href|src)="(\/[^"]*\/)_astro\//);
    return match ? match[1] : "/";
  } catch {
    return "/";
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name === "_astro") continue;
      files.push(...await walk(absolute));
    } else if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

function targetFile(reference) {
  let clean = reference.split("#", 1)[0].split("?", 1)[0];
  if (!clean.startsWith("/")) return null;
  try { clean = decodeURIComponent(clean); } catch { /* keep encoded path */ }
  if (basePrefix && !clean.startsWith(`${basePrefix}/`) && clean !== basePrefix) return null;
  if (basePrefix) clean = clean.slice(basePrefix.length) || "/";
  if (clean === "/") return path.join(dist, "index.html");
  if (clean.endsWith("/")) return path.join(dist, clean, "index.html");
  if (path.extname(clean)) return path.join(dist, clean);
  return path.join(dist, clean, "index.html");
}

const broken = [];
for (const file of await walk(dist)) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|#)/.test(reference)) continue;
    const target = targetFile(reference);
    if (target && !(await exists(target))) broken.push({ page: path.relative(dist, file), reference });
  }
}

console.log(`Internal links: ${broken.length} broken`);
for (const item of broken.slice(0, 40)) console.log(`- ${item.page} -> ${item.reference}`);
if (broken.length) process.exitCode = 1;
