import { writeFile } from "node:fs/promises";
import { loadWorkspace, renderPage } from "../compile/relations.mjs";
import { traceReferences } from "./trace-refs.mjs";
import { today } from "./today.mjs";

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const id = value("id");
const key = value("key");
const mode = value("mode");
const to = value("to");
const note = value("note");
const dryRun = args.includes("--dry-run");

if ((!id && !key) || !["tombstone", "redirect"].includes(mode)) {
  console.error("Usage: npm run content:retire -- (--id <id> | --key <key>) --mode <tombstone|redirect> [--to <id|key>] [--note <text>] [--dry-run]");
  process.exit(1);
}
if (mode === "redirect" && !to) {
  console.error("redirect mode requires --to <id|key>");
  process.exit(1);
}

const workspace = await loadWorkspace(process.cwd());
const byId = new Map(workspace.pages.map((page) => [page.id, page]));
const byKey = new Map(workspace.pages.map((page) => [page.key, page]));
const page = id ? byId.get(id) : byKey.get(key);
if (!page) {
  console.error(`page not found: ${id || key}`);
  process.exit(1);
}
if (page.data.retirement) {
  console.error(`already retired: ${page.id}`);
  process.exit(1);
}
const traceRefs = await traceReferences(process.cwd(), page.key);
if (traceRefs.length) {
  console.error(`cannot retire ${page.id}; referenced by traces: ${traceRefs.join(", ")}`);
  console.error("update catalog/traces.json first");
  process.exit(1);
}

let target = null;
if (mode === "redirect") {
  target = byId.get(to) || byKey.get(to);
  if (!target) {
    console.error(`redirect target not found: ${to}`);
    process.exit(1);
  }
  if (target.id === page.id) {
    console.error("redirect target must differ from the retired page");
    process.exit(1);
  }
  if (target.data.publication_visibility !== "public" || target.data.retirement) {
    console.error(`redirect target must be a public, non-retired page: ${target.id}`);
    process.exit(1);
  }
}

const todayDate = today();
page.data.retirement = {
  mode,
  retired_at: todayDate,
  ...(target ? { superseded_by: target.id } : {}),
  ...(note ? { note } : {})
};
page.data.publication_visibility = "unlisted";
page.data.updated = todayDate;

if (!dryRun) {
  await writeFile(page.filePath, renderPage(page.data, page.body), "utf8");
}

console.log(`${dryRun ? "dry-run: " : ""}retired ${page.id} (${mode})`);
console.log(`URL: /docs/${page.id}/`);
if (target) console.log(`Redirect: /docs/${target.id}/`);
