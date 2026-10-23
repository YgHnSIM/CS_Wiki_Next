import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { loadWorkspace, extractRelations, replaceRelationSection, renderPage } from "../compile/relations.mjs";

const root = process.cwd();
const workspace = await loadWorkspace(root);
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const kindArg = args.find((arg) => arg.startsWith("--kind="))?.split("=")[1]
  || (args.includes("--kind") ? args[args.indexOf("--kind") + 1] : "concept");
const limitArg = args.find((arg) => arg.startsWith("--limit="))?.split("=")[1]
  || (args.includes("--limit") ? args[args.indexOf("--limit") + 1] : "24");
const kind = kindArg || "concept";
const limit = Number.parseInt(limitArg, 10);
if (!Number.isInteger(limit) || limit < 1) throw new Error(`invalid --limit: ${limitArg}`);

const today = (() => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
})();

const candidates = workspace.pages
  .filter((page) => page.kind === kind && !page.data.relations && /^##\s+관계\s*$/m.test(page.body))
  .sort((a, b) => a.filePath.localeCompare(b.filePath))
  .slice(0, limit);

const report = { generatedAt: new Date().toISOString(), kind, limit, pages: [], relations: 0 };
for (const page of candidates) {
  const relations = extractRelations(page, workspace);
  if (!relations.length) continue;
  const { schema_version, id, ...rest } = page.data;
  const data = {
    schema_version,
    id,
    key: page.key,
    ...rest,
    updated: page.data.updated === today ? page.data.updated : today,
    relations
  };
  const body = replaceRelationSection(page.body, relations, workspace);
  const output = renderPage(data, body);
  report.pages.push({ id: page.id, key: page.key, relations: relations.length, path: page.filePath });
  report.relations += relations.length;
  if (!dryRun) await writeFile(page.filePath, output, "utf8");
}

await mkdir(path.join(root, "output"), { recursive: true });
await writeFile(path.join(root, "output", "migration-batch.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(`${dryRun ? "dry-run: " : ""}${report.pages.length} pages, ${report.relations} relations, kind=${kind}, limit=${limit}`);
for (const page of report.pages.slice(0, 8)) console.log(`- ${page.id} (${page.key}) ${page.relations}`);
if (report.pages.length > 8) console.log(`- ... ${report.pages.length - 8} more`);
