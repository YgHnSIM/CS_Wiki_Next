import { parseCliArgs } from "../shared/args.mjs";
import { migrateRelationsBatch } from "../ops/lifecycle.mjs";

const { hasFlag, getOption } = parseCliArgs();
const dryRun = hasFlag("dry-run");
const kind = getOption("kind", "concept");
const limitArg = getOption("limit", "24");
const limit = Number.parseInt(limitArg, 10);
if (!Number.isInteger(limit) || limit < 1) throw new Error(`invalid --limit: ${limitArg}`);

const report = await migrateRelationsBatch(process.cwd(), { kind, limit, dryRun });

console.log(`${dryRun ? "dry-run: " : ""}${report.pages.length} pages, ${report.relations} relations, kind=${kind}, limit=${limit}`);
for (const page of report.pages.slice(0, 8)) console.log(`- ${page.id} (${page.key}) ${page.relations}`);
if (report.pages.length > 8) console.log(`- ... ${report.pages.length - 8} more`);
