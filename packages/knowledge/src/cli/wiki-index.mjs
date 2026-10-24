import { parseCliArgs } from "../shared/args.mjs";
import { checkOrSyncWikiIndex } from "../ops/index-doc.mjs";

const { hasFlag } = parseCliArgs();
const write = hasFlag("write");

const { publicPages, missing, updated } = await checkOrSyncWikiIndex(process.cwd(), { write });

console.log(`Wiki index: ${publicPages.length} public pages, ${missing.length} missing`);
for (const page of missing) console.log(`- ${page.id} ${page.title}`);
if (write && (missing.length || updated)) console.log("updated wiki/index.md");
if (!write && missing.length) process.exitCode = 1;
