import { parseCliArgs } from "../shared/args.mjs";
import { restoreDocument } from "../ops/lifecycle.mjs";

const { hasFlag, getOption } = parseCliArgs();
try {
  const { id, sourcePath, makePublic, replacedTombstone, dryRun } = await restoreDocument(process.cwd(), {
    id: getOption("id"),
    makePublic: hasFlag("public"),
    dryRun: hasFlag("dry-run")
  });
  console.log(`${dryRun ? "dry-run: " : ""}restored ${id}${replacedTombstone ? " (replaced tombstone)" : ""}`);
  console.log(`Path: ${sourcePath}`);
  console.log(`Visibility: ${makePublic ? "public" : "unlisted"}`);
  console.log("Run npm run knowledge:seed to refresh the registry.");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
