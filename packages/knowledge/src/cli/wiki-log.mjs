import { parseCliArgs } from "../shared/args.mjs";
import { appendLog, checkOrSyncLogs } from "../ops/log.mjs";

const { hasFlag, getOption } = parseCliArgs();
const write = hasFlag("write");
const add = hasFlag("add");
const dryRun = hasFlag("dry-run");

if (add) {
  const action = getOption("action", "update");
  const title = getOption("title");
  if (!title) {
    console.error("--add requires --title");
    process.exit(1);
  }
  const filename = await appendLog(process.cwd(), {
    action,
    title,
    body: getOption("body"),
    dryRun
  });
  console.log(`${dryRun ? "dry-run: " : ""}added logs/${filename}`);
  process.exit(0);
}

const { listed, files, missingFiles, missingEntries, orderMismatch, hasErrors } = await checkOrSyncLogs(process.cwd(), { write });

console.log(`Wiki log: ${listed.length} listed, ${files.length} files`);
for (const file of missingFiles) console.log(`- listed but missing: ${file}`);
for (const file of missingEntries) console.log(`- file not listed: ${file}`);
if (listed.length === files.length && orderMismatch.length) {
  console.log(`- order mismatch: ${orderMismatch.length} entries`);
}
if (hasErrors && !write) process.exitCode = 1;
