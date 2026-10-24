import { createHash } from "node:crypto";
import { access, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadWorkspace, resolvePage } from "../compile/relations.mjs";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json");
const workspace = await loadWorkspace(root);
const pageById = new Map(workspace.pages.map((page) => [page.id, page]));
const pageByKey = new Map(workspace.pages.map((page) => [page.key, page]));
const issues = [];
const add = (code, file, message) => issues.push({ code, path: file, message });

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

for (const page of workspace.pages) {
  const relative = path.relative(root, page.filePath).split(path.sep).join("/");
  const raw = await readFile(page.filePath, "utf8");
  if (raw.includes("\r\n")) add("eol.crlf", relative, "LF line endings are required");
  if (!raw.endsWith("\n")) add("eol.final_newline", relative, "final newline is required");

  for (const item of page.data.access || []) {
    if (item.kind === "url") {
      try { new URL(item.url); } catch { add("raw.url", relative, `invalid URL: ${item.url}`); }
      continue;
    }
    if (!item.path || !item.sha256 || !Number.isInteger(item.bytes)) {
      add("raw.fields", relative, "local access needs path, sha256, bytes");
      continue;
    }
    if (!(await exists(path.join(root, item.path)))) {
      add("raw.missing", relative, `missing ${item.path}`);
      continue;
    }
    const buffer = await readFile(path.join(root, item.path));
    const digest = createHash("sha256").update(buffer).digest("hex");
    if (digest !== item.sha256) add("raw.sha256", relative, `${item.path} sha256 mismatch`);
    if (buffer.length !== item.bytes) add("raw.bytes", relative, `${item.path} byte length mismatch`);
  }

  for (const relation of page.data.relations || []) {
    const target = pageByKey.get(relation.target);
    if (!target) add("relation.target", relative, `missing target ${relation.target}`);
    for (const evidence of relation.evidence || []) {
      const source = pageById.get(evidence.source);
      if (!source) add("evidence.source", relative, `missing evidence source ${evidence.source}`);
      else if (!["source", "reference"].includes(source.kind)) add("evidence.kind", relative, `${evidence.source} is ${source.kind}`);
    }
  }

  for (const match of page.body.matchAll(/\[\[([^\]|#\n]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
    const target = match[1].trim();
    if (match[0].startsWith("![[") || /\.[a-z0-9]{2,5}([?#].*)?$/i.test(target)) continue;
    if (!resolvePage(workspace, target)) add("link.internal", relative, `missing link target ${target}`);
  }

  if (page.data.status === "stale") {
    if (!page.data.superseded_by) add("supersede.missing", relative, "stale page needs superseded_by");
    else if (!pageById.has(page.data.superseded_by)) add("supersede.target", relative, `missing superseded_by ${page.data.superseded_by}`);
  }
}

const indexText = await readFile(path.join(root, "wiki", "index.md"), "utf8");
const linked = new Set();
for (const match of indexText.matchAll(/\[\[([^\]|#\n]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
  const page = resolvePage(workspace, match[1]);
  if (page) linked.add(page.id);
}
const excluded = new Set(["meta-index", "meta-log", "meta-gaps"]);
for (const page of workspace.pages) {
  if (page.data.publication_visibility !== "public" || excluded.has(page.id)) continue;
  if (!linked.has(page.id)) add("index.missing", "wiki/index.md", `missing ${page.id}`);
}

const logText = await readFile(path.join(root, "wiki", "log.md"), "utf8");
const listedLogs = [...logText.matchAll(/^- \[[^\]]+\]\((logs\/[^)]+)\)$/gm)].map((match) => match[1]);
const logFiles = (await readdir(path.join(root, "wiki", "logs"))).filter((name) => name.endsWith(".md")).sort().map((name) => `logs/${name}`);
const listedSet = new Set(listedLogs);
const fileSet = new Set(logFiles);
for (const file of listedLogs) if (!fileSet.has(file)) add("log.missing_file", "wiki/log.md", file);
for (const file of logFiles) if (!listedSet.has(file)) add("log.missing_entry", "wiki/log.md", file);
if (listedLogs.length === logFiles.length && listedLogs.some((file, index) => file !== logFiles[index])) {
  add("log.order", "wiki/log.md", "log order differs from filenames");
}

const gapsText = await readFile(path.join(root, "wiki", "gaps.md"), "utf8");
if (!gapsText.includes("<!-- wiki:gaps:start -->") || !gapsText.includes("<!-- wiki:gaps:end -->")) {
  add("gaps.marker", "wiki/gaps.md", "missing generated markers");
}
const gapKeys = new Set();
for (const match of gapsText.matchAll(/^### \[(open|closed)\] ([^\n]+)$/gm)) {
  const key = match[2].trim();
  if (gapKeys.has(key)) add("gaps.duplicate", "wiki/gaps.md", key);
  gapKeys.add(key);
}

const report = {
  generated_at: new Date().toISOString(),
  pages: workspace.pages.length,
  issues,
  errors: issues.length
};
await writeFile(path.join(root, "output", "wiki-lint.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Wiki lint: ${workspace.pages.length} pages, ${issues.length} issues`);
  for (const issue of issues.slice(0, 50)) console.log(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  if (issues.length > 50) console.log(`... ${issues.length - 50} more`);
}
if (issues.length) process.exitCode = 1;
