import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadWorkspace, renderPage, resolvePage } from "../compile/relations.mjs";
import { traceReferences } from "./trace-refs.mjs";
import { today } from "./today.mjs";

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const id = value("id");
const key = value("key");
const mode = value("mode") || "archive";
const reason = value("reason") || "";
const dryRun = args.includes("--dry-run");
const breakUrl = args.includes("--break-url");

if ((!id && !key) || !["archive", "purge"].includes(mode)) {
  console.error("Usage: npm run content:delete -- (--id <id> | --key <key>) [--mode archive|purge] [--reason <text>] [--break-url] [--dry-run]");
  process.exit(1);
}
if (mode === "purge" && !breakUrl) {
  console.error("purge requires --break-url");
  process.exit(1);
}

const root = process.cwd();
const workspace = await loadWorkspace(root);
const byId = new Map(workspace.pages.map((page) => [page.id, page]));
const byKey = new Map(workspace.pages.map((page) => [page.key, page]));
const page = id ? byId.get(id) : byKey.get(key);
if (!page) {
  console.error(`page not found: ${id || key}`);
  process.exit(1);
}
if (page.data.publication_visibility === "public" && !page.data.retirement) {
  console.error(`cannot delete public page ${page.id}; run content:retire first`);
  process.exit(1);
}

const traceRefs = await traceReferences(root, page.key);
if (traceRefs.length) {
  console.error(`cannot delete ${page.id}; referenced by traces: ${traceRefs.join(", ")}`);
  console.error("update catalog/traces.json first");
  process.exit(1);
}

const incoming = workspace.pages.filter((other) =>
  other.id !== page.id && (other.data.relations || []).some((relation) => relation.target === page.key)
);
const incomingLinks = workspace.pages.filter((other) => {
  if (other.id === page.id) return false;
  for (const match of other.body.matchAll(/\[\[([^\]|#\n]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
    const target = resolvePage(workspace, match[1]);
    if (target?.id === page.id) return true;
  }
  return false;
});
if (mode === "purge" && incoming.length) {
  console.error(`cannot purge ${page.id}; incoming relations: ${incoming.map((item) => item.id).join(", ")}`);
  console.error("archive mode keeps the URL and graph node; purge requires removing those relations first");
  process.exit(1);
}
if (mode === "purge" && incomingLinks.length) {
  console.error(`cannot purge ${page.id}; incoming wiki links: ${incomingLinks.map((item) => item.id).join(", ")}`);
  console.error("update incoming links first, or use archive mode");
  process.exit(1);
}

const removedFile = path.join(root, "contracts", "removed-documents.json");
const removedCatalog = JSON.parse(await readFile(removedFile, "utf8"));
const existing = (removedCatalog.removed || []).find((entry) => entry.id === page.id);
if (existing?.mode === "purge") {
  console.error(`already purged: ${page.id}`);
  process.exit(1);
}
if (existing?.mode === "archive" && mode === "archive") {
  console.error(`already archived: ${page.id}`);
  process.exit(1);
}

const todayDate = today();
const archivePath = path.join(root, "archive", "removed", `${page.id}.md`);
const archiveText = await readFile(page.filePath, "utf8");
const entry = {
  id: page.id,
  key: page.key,
  title: page.title,
  kind: page.kind,
  mode,
  removed_at: todayDate,
  source_path: path.relative(root, page.filePath).split(path.sep).join("/"),
  replaced_by: page.data.retirement?.superseded_by || null,
  reason,
  break_url: mode === "purge"
};

if (!dryRun) {
  await mkdir(path.dirname(archivePath), { recursive: true });
  await writeFile(archivePath, archiveText, "utf8");
  removedCatalog.removed = [
    ...(removedCatalog.removed || []).filter((item) => item.id !== page.id),
    entry
  ].sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(removedFile, JSON.stringify(removedCatalog, null, 2) + "\n", "utf8");
}

if (mode === "archive") {
  page.data.retirement = {
    ...(page.data.retirement || {}),
    mode: "tombstone",
    retired_at: todayDate,
    ...(reason ? { note: reason } : {})
  };
  page.data.publication_visibility = "unlisted";
  page.data.updated = todayDate;
  const body = [
    "## 은퇴",
    "",
    `이 문서는 ${todayDate}에 삭제되었습니다. 원문은 \`archive/removed/${page.id}.md\`에 보존되어 있습니다.`,
    reason ? `\n삭제 사유: ${reason}` : ""
  ].join("\n");
  if (!dryRun) await writeFile(page.filePath, renderPage(page.data, body), "utf8");
} else if (!dryRun) {
  await rm(page.filePath, { force: true });
}

console.log(`${dryRun ? "dry-run: " : ""}deleted ${page.id} (${mode})`);
console.log(`Archive: archive/removed/${page.id}.md`);
if (mode === "archive") console.log(`URL: /docs/${page.id}/ (tombstone)`);
else console.log(`URL: /docs/${page.id}/ will be missing; run npm run knowledge:seed`);
if (reason) console.log(`Reason: ${reason}`);
