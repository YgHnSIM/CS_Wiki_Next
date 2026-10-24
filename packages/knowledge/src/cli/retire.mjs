import { parseCliArgs } from "../shared/args.mjs";
import { retireDocument } from "../ops/lifecycle.mjs";

const { hasFlag, getOption } = parseCliArgs();
try {
  const { page, target, mode, dryRun } = await retireDocument(process.cwd(), {
    id: getOption("id"),
    key: getOption("key"),
    mode: getOption("mode"),
    to: getOption("to"),
    note: getOption("note"),
    dryRun: hasFlag("dry-run")
  });
  console.log(`${dryRun ? "dry-run: " : ""}retired ${page.id} (${mode})`);
  console.log(`URL: /docs/${page.id}/`);
  if (target) console.log(`Redirect: /docs/${target.id}/`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
