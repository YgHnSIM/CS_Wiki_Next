import { parseCliArgs } from "../shared/args.mjs";
import { seedRegistry } from "../registry/seed.mjs";

const { hasFlag } = parseCliArgs();
const dryRun = hasFlag("dry-run");
const report = await seedRegistry(process.cwd(), { dryRun });

console.log(`${dryRun ? "dry-run: " : ""}${report.pages} pages, ${report.nodes} nodes, ${report.aliases} aliases, ${report.collisions.length} alias collisions, ${report.hashKeys} provisional hash keys`);
console.log(report.types);
if (report.collisions.length) {
  console.log("alias collisions:");
  for (const collision of report.collisions.slice(0, 20)) {
    console.log(`- ${collision.alias}: ${collision.kept} vs ${collision.ignored}`);
  }
}
