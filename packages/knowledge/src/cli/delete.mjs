import { parseCliArgs } from "../shared/args.mjs";
import { deleteDocument } from "../ops/lifecycle.mjs";

const { hasFlag, getOption } = parseCliArgs();
try {
  const { page, mode, reason, dryRun } = await deleteDocument(process.cwd(), {
    id: getOption("id"),
    key: getOption("key"),
    mode: getOption("mode", "archive"),
    reason: getOption("reason", ""),
    breakUrl: hasFlag("break-url"),
    dryRun: hasFlag("dry-run")
  });
  console.log(`${dryRun ? "dry-run: " : ""}deleted ${page.id} (${mode})`);
  console.log(`Archive: archive/removed/${page.id}.md`);
  if (mode === "archive") console.log(`URL: /docs/${page.id}/ (tombstone)`);
  else console.log(`URL: /docs/${page.id}/ will be missing; run npm run knowledge:seed`);
  if (reason) console.log(`Reason: ${reason}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
