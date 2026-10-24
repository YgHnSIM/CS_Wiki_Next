import { parseCliArgs } from "../shared/args.mjs";
import { auditWikiPage } from "../ops/audit.mjs";

const { hasFlag, getOption } = parseCliArgs();
const id = getOption("id");
const key = getOption("key");
const json = hasFlag("json");
const strict = hasFlag("strict");

try {
  const report = await auditWikiPage(process.cwd(), { id, key });

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Audit: ${report.id} ${report.title}`);
    console.log(`Sources: ${report.sources.length}, claims: ${report.claims.length}, unverified: ${report.unverified}`);
    for (const item of report.evidence) {
      if (item.found === false) console.log(`- quote not found: ${item.source} ${item.locator || ""}`);
    }
    for (const claim of report.claims.filter((item) => !item.found)) {
      console.log(`- unverified claim: ${claim.text}`);
    }
    for (const drift of report.synthesis_drift || []) {
      console.log(`- synthesis drift: ${drift.id} (${drift.reason})`);
    }
  }
  if (strict && report.unverified > 0) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
