import { parseCliArgs } from "../shared/args.mjs";
import { reportRelations } from "../validate/relations.mjs";

const { hasFlag } = parseCliArgs();
const json = hasFlag("json");
const { report, hasFatalErrors } = await reportRelations(process.cwd());

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const { totals, issues, topNodes } = report;
  console.log(`Relations preflight: ${totals.pages} pages, ${totals.pagesWithRelations} with relations, ${totals.relations} relations`);
  console.log(`unresolved targets: ${issues.unresolvedTargets.length}, unresolved evidence: ${issues.unresolvedEvidence.length}, missing evidence: ${issues.missingEvidence.length}, self: ${issues.selfRelations.length}, duplicate edges: ${issues.duplicateEdges.length}, table errors: ${issues.relationErrors.length}`);
  console.log("top nodes:");
  for (const node of topNodes.slice(0, 10)) {
    console.log(`- ${node.title} (${node.key}) degree=${node.degree} status=${node.status}`);
  }
  console.log("wrote output/relations-report.json");
}

if (hasFatalErrors) process.exitCode = 1;
