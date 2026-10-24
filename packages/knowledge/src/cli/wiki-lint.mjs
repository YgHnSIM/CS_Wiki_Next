import { parseCliArgs } from "../shared/args.mjs";
import { lintWiki } from "../validate/wiki-lint.mjs";

const { hasFlag } = parseCliArgs();
const jsonOnly = hasFlag("json");
const semantic = hasFlag("semantic");

const report = await lintWiki(process.cwd(), { semantic });

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Wiki lint: ${report.pages} pages, ${report.issues.length} issues`);
  for (const issue of report.issues.slice(0, 50)) {
    console.log(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  }
  if (report.issues.length > 50) {
    console.log(`... ${report.issues.length - 50} more`);
  }
  if (semantic) {
    console.log(`Semantic warnings: ${report.semantic.length}`);
    for (const item of report.semantic.slice(0, 30)) {
      console.log(`- [${item.code}] ${item.path}: ${item.message}`);
    }
  }
}

if (report.issues.length) process.exitCode = 1;
