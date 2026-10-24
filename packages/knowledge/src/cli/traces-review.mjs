import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadWorkspace } from "../compile/relations.mjs";

const root = process.cwd();
const catalog = JSON.parse(await readFile(path.join(root, "catalog", "traces.json"), "utf8"));
const workspace = await loadWorkspace(root);
const pages = new Map(workspace.pages.map((page) => [page.key, page]));

const lines = [
  "# Trace checkpoint review",
  "",
  `Generated from \`catalog/traces.json\` (${catalog.traces.length} traces).`,
  "",
  "Each entry lists the step rationale, checkpoint question/answer, and the cited evidence summaries.",
  "Mark each as `ok`, `revise`, or `drop` during editorial review.",
  ""
];

for (const [traceIndex, trace] of catalog.traces.entries()) {
  lines.push(`## ${String(traceIndex + 1).padStart(2, "0")}. ${trace.title}`, "");
  lines.push(`- id: \`${trace.id}\``);
  lines.push(`- ${trace.steps.length} steps / ${trace.minutes} min`);
  lines.push("");
  for (const [stepIndex, step] of trace.steps.entries()) {
    const page = pages.get(step.document);
    lines.push(`### ${String(stepIndex + 1).padStart(2, "0")} · ${page?.title || step.document}`, "");
    lines.push(`- document: \`${step.document}\``);
    lines.push(`- role: \`${step.role}\``);
    lines.push(`- why: ${step.why}`);
    lines.push(`- question: ${step.checkpoint.question}`);
    lines.push(`- answer: ${step.checkpoint.answer}`);
    lines.push("- evidence:");
    for (const key of step.checkpoint.evidence) {
      const source = pages.get(key);
      lines.push(`  - \`${key}\` — ${source?.title || "missing"}${source ? `: ${source.data.summary}` : ""}`);
    }
    lines.push("");
  }
}

await mkdir(path.join(root, "output"), { recursive: true });
await writeFile(path.join(root, "output", "trace-checkpoints.md"), lines.join("\n") + "\n", "utf8");
const checkpoints = catalog.traces.reduce((sum, trace) => sum + trace.steps.length, 0);
console.log(`Trace review: ${catalog.traces.length} traces, ${checkpoints} checkpoints`);
console.log("wrote output/trace-checkpoints.md");
