import { parseCliArgs } from "../shared/args.mjs";
import { queryWiki } from "../ops/query.mjs";

const { hasFlag, getOption, getPositionals } = parseCliArgs(process.argv.slice(2), {
  valuedOptions: ["limit"]
});
const json = hasFlag("json");
const save = hasFlag("save");
const recordGap = hasFlag("record-gap");
const limit = Math.max(1, Math.min(Number(getOption("limit")) || 5, 20));
const question = getPositionals().join(" ").trim();

if (!question) {
  console.error('Usage: npm run wiki:query -- "질문" [--limit 5] [--json] [--save] [--record-gap]');
  process.exit(1);
}

try {
  const { packet, markdown, results, synthesisPath } = await queryWiki(process.cwd(), {
    question,
    limit,
    save,
    recordGap
  });

  if (json) {
    console.log(JSON.stringify(packet, null, 2));
  } else {
    console.log(markdown);
  }

  if (save) {
    if (!results.length) {
      console.error("nothing to save: no results");
      process.exitCode = 1;
    } else if (synthesisPath) {
      console.log(`\nSaved synthesis: ${synthesisPath}`);
      console.log("Next: npm run knowledge:seed && npm run wiki:index -- --write && npm run wiki:lint");
    }
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
