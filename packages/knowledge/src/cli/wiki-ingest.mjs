import path from "node:path";
import { parseCliArgs } from "../shared/args.mjs";
import { applyIngestProposal, ingestSource } from "../ops/ingest.mjs";

const { hasFlag, getOption } = parseCliArgs();
const root = process.cwd();
const dryRun = hasFlag("dry-run");
const applyPath = getOption("apply");

try {
  if (applyPath) {
    const result = await applyIngestProposal(root, { proposalPath: applyPath, dryRun });
    console.log(`${dryRun ? "dry-run: " : ""}applied ingest proposal for ${result.source || applyPath}`);
    console.log(`Created: ${result.created.length}, Updated: ${result.updated.length}, Closed gaps: ${result.closedGaps.length}`);
    console.log("Next: npm run wiki:lint && npm run knowledge:build");
  } else {
    const result = await ingestSource(root, {
      sourceArg: getOption("source"),
      id: getOption("id"),
      title: getOption("title"),
      kind: getOption("kind"),
      visibility: getOption("visibility", "public"),
      summary: getOption("summary"),
      domain: getOption("domain"),
      url: getOption("url"),
      citation: getOption("citation"),
      doi: getOption("doi"),
      year: getOption("year"),
      genre: getOption("genre"),
      dryRun
    });
    console.log(`${dryRun ? "dry-run: " : ""}ingested ${result.id} -> ${result.rawPath}`);
    console.log(`Page: ${path.relative(root, result.pagePath)}`);
    console.log(`Proposal: output/ingest/${result.id}.json`);
    console.log("Next: write relations/evidence or run wiki:ingest -- --apply, then npm run knowledge:seed && npm run wiki:lint");
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
