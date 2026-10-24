import { parseCliArgs } from "../shared/args.mjs";
import { addWikiGap, closeWikiGap, parseWikiGaps } from "../ops/gaps.mjs";

const { hasFlag, getOption } = parseCliArgs();

try {
  const parsed = await parseWikiGaps(process.cwd());
  if (!parsed.exists || !parsed.hasMarkers) {
    console.error("wiki/gaps.md is missing the wiki:gaps generated block");
    process.exit(1);
  }

  if (hasFlag("list")) {
    for (const entry of parsed.entries) {
      console.log(`${entry.status === "open" ? "open" : "closed"}\t${entry.key}`);
    }
    process.exit(0);
  }

  const add = hasFlag("add");
  const close = hasFlag("close");
  const key = getOption("key");
  if (!key || (!add && !close)) {
    console.error("Usage: wiki:gaps --add --kind wanted|question --key <key> [--evidence <text>] [--demand N]");
    console.error("       wiki:gaps --close --key <key> [--resolution <text>]");
    process.exit(1);
  }

  if (add) {
    await addWikiGap(process.cwd(), {
      kind: getOption("kind", "wanted"),
      key,
      evidence: getOption("evidence", "none"),
      demand: getOption("demand", "1")
    });
    console.log(`${key} added`);
  } else if (close) {
    await closeWikiGap(process.cwd(), {
      key,
      resolution: getOption("resolution", "resolved")
    });
    console.log(`${key} closed`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
