import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadWorkspace, resolvePage } from "../compile/relations.mjs";

const root = process.cwd();
const write = process.argv.includes("--write");
const indexPath = path.join(root, "wiki", "index.md");
const workspace = await loadWorkspace(root);
const text = await readFile(indexPath, "utf8");
const linked = new Set();
for (const match of text.matchAll(/\[\[([^\]|#\n]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
  const page = resolvePage(workspace, match[1]);
  if (page) linked.add(page.id);
}
const excluded = new Set(["meta-index", "meta-log", "meta-gaps"]);
const publicPages = workspace.pages.filter((page) =>
  page.data.publication_visibility === "public" && !excluded.has(page.id)
);
const missing = publicPages.filter((page) => !linked.has(page.id));
const sectionByKind = {
  source: "소스",
  reference: "참고 자료",
  concept: "개념",
  entity: "개체",
  analysis: "분석",
  meta: "메타"
};

function addLine(body, heading, line) {
  const start = body.indexOf(`## ${heading}`);
  if (start < 0) {
    const marker = "\n## 출처";
    const at = body.indexOf(marker);
    const block = `\n## ${heading}\n\n${line}\n`;
    return at >= 0 ? body.slice(0, at) + block + body.slice(at) : body.trimEnd() + block + "\n";
  }
  const next = body.indexOf("\n## ", start + 1);
  const end = next >= 0 ? next : body.length;
  return `${body.slice(0, end).trimEnd()}\n${line}\n${body.slice(end)}`;
}

let output = text;
if (write) {
  for (const page of missing) {
    output = addLine(output, sectionByKind[page.kind] || "메타", `- [[${page.title}]] — ${page.data.summary || "(no summary)"}`);
  }
  if (missing.length) await writeFile(indexPath, output, "utf8");
}

console.log(`Wiki index: ${publicPages.length} public pages, ${missing.length} missing`);
for (const page of missing) console.log(`- ${page.id} ${page.title}`);
if (write && missing.length) console.log(`updated ${path.relative(root, indexPath)}`);
if (!write && missing.length) process.exitCode = 1;
