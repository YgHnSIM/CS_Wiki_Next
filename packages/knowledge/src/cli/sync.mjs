import { parseCliArgs } from "../shared/args.mjs";
import { syncRelationBlocks } from "../ops/lifecycle.mjs";

const { hasFlag } = parseCliArgs();
const check = hasFlag("check");
const { differences } = await syncRelationBlocks(process.cwd(), { check });

console.log(`${check ? "check" : "sync"}: ${differences.length} page(s) ${check ? "out of date" : "updated"}`);
for (const id of differences) console.log(`- ${id}`);
if (check && differences.length) process.exitCode = 1;
