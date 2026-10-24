import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraph, writeGraph } from "./compile/graph.mjs";

export { buildGraph, writeGraph };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const report = await writeGraph();
  console.log(`Graph: ${report.documents} documents, ${report.statements} statements, ${report.nodes} nodes`);
  console.log(`Issues: ${JSON.stringify(report.issues)}`);
}
