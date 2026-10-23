import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadWorkspace, renderRelations, relationStart, relationEnd, updateBody, renderPage } from "../compile/relations.mjs";

const root = process.cwd();
const workspace = await loadWorkspace(root);
const check = process.argv.includes("--check");

const today = (() => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
})();

const differences = [];
for (const page of workspace.pages) {
  const relations = Array.isArray(page.data.relations) ? page.data.relations : null;
  if (!relations) continue;
  const expected = renderRelations(relations, workspace);
  const start = page.body.indexOf(relationStart);
  const end = page.body.indexOf(relationEnd);
  const actual = start >= 0 && end > start
    ? page.body.slice(start, end + relationEnd.length)
    : "";
  if (actual.trim() !== expected.trim()) {
    differences.push(page.id);
    if (!check) {
      const body = updateBody(page.body, relations, workspace);
      const data = { ...page.data, updated: page.data.updated === today ? page.data.updated : today };
      await writeFile(page.filePath, renderPage(data, body), "utf8");
    }
  }
}

console.log(`${check ? "check" : "sync"}: ${differences.length} page(s) ${check ? "out of date" : "updated"}`);
for (const id of differences) console.log(`- ${id}`);
if (check && differences.length) process.exitCode = 1;
