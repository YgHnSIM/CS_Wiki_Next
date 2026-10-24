import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { renderPage } from "../compile/relations.mjs";

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const id = value("id");
const makePublic = args.includes("--public");
const dryRun = args.includes("--dry-run");
if (!id) {
  console.error("Usage: npm run content:restore -- --id <id> [--public] [--dry-run]");
  process.exit(1);
}

const root = process.cwd();
const removedFile = path.join(root, "contracts", "removed-documents.json");
const removedCatalog = JSON.parse(await readFile(removedFile, "utf8"));
const entry = (removedCatalog.removed || []).find((item) => item.id === id);
if (!entry) {
  console.error(`removed entry not found: ${id}`);
  process.exit(1);
}
if (entry.mode !== "archive") {
  console.error(`only archive entries can be restored; ${id} is ${entry.mode}`);
  process.exit(1);
}
const archivePath = path.join(root, "archive", "removed", `${id}.md`);
let text;
try {
  text = await readFile(archivePath, "utf8");
} catch {
  console.error(`archive file not found: archive/removed/${id}.md`);
  process.exit(1);
}
const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
if (!match) {
  console.error(`archive file has no frontmatter: ${id}`);
  process.exit(1);
}
const data = YAML.parse(match[1]);
const body = match[2];
const kindDirs = {
  concept: "concepts",
  entity: "entities",
  analysis: "analyses",
  source: "sources",
  reference: "references",
  meta: "meta"
};
const derivedPath = `wiki/${kindDirs[data.kind] || "meta"}/${String(data.title || id).replace(/[\\/:*?"<>|]/g, "-")}.md`;
const sourcePath = entry.source_path || derivedPath;
if (!sourcePath.startsWith("wiki/")) {
  console.error(`invalid source path: ${sourcePath}`);
  process.exit(1);
}
const absoluteSource = path.join(root, sourcePath);
let replacedTombstone = false;
try {
  const existingText = await readFile(absoluteSource, "utf8");
  const existingMatch = existingText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const existing = existingMatch ? YAML.parse(existingMatch[1]) : null;
  if (!existing || existing.id !== id || !existing.retirement) {
    console.error(`restore target already exists and is not this tombstone: ${sourcePath}`);
    process.exit(1);
  }
  replacedTombstone = true;
} catch { /* target is absent; normal restore */ }

delete data.retirement;
delete data.superseded_by;
data.publication_visibility = makePublic ? "public" : "unlisted";
if (makePublic) data.graph_visibility = "public";
data.updated = new Date().toISOString().slice(0, 10);

if (!dryRun) {
  await mkdir(path.dirname(absoluteSource), { recursive: true });
  await writeFile(absoluteSource, renderPage(data, body), "utf8");
  await rm(archivePath, { force: true });
  removedCatalog.removed = (removedCatalog.removed || []).filter((item) => item.id !== id);
  await writeFile(removedFile, JSON.stringify(removedCatalog, null, 2) + "\n", "utf8");
}

console.log(`${dryRun ? "dry-run: " : ""}restored ${id}${replacedTombstone ? " (replaced tombstone)" : ""}`);
console.log(`Path: ${sourcePath}`);
console.log(`Visibility: ${makePublic ? "public" : "unlisted"}`);
console.log("Run npm run knowledge:seed to refresh the registry.");
