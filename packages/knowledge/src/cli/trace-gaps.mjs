import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildGraph } from "../build.mjs";
import { loadWorkspace } from "../compile/relations.mjs";

const root = process.cwd();
const catalog = JSON.parse(await readFile(path.join(root, "catalog", "traces.json"), "utf8"));
const { graph, documents } = await buildGraph(root);
const workspace = await loadWorkspace(root);
const pages = new Map(workspace.pages.map((page) => [page.key, page]));
const docs = new Map(documents.map((document) => [document.key, document]));

const traceStepKeys = new Set(catalog.traces.flatMap((trace) => trace.steps.map((step) => step.document)));
const prerequisiteKeys = new Set(catalog.traces.flatMap((trace) => trace.prerequisites || []));
const branchKeys = new Set(catalog.traces.flatMap((trace) => (trace.branches || []).flatMap((branch) => branch.documents)));

const degree = new Map();
for (const statement of graph.statements) {
  degree.set(statement.subject, (degree.get(statement.subject) || 0) + 1);
  degree.set(statement.target, (degree.get(statement.target) || 0) + 1);
}

const publicKnowledge = [...pages.values()].filter(
  (page) => ["concept", "entity", "analysis"].includes(page.kind) && page.data.publication_visibility === "public"
);
const gaps = publicKnowledge
  .filter((page) => !traceStepKeys.has(page.key))
  .map((page) => {
    const document = docs.get(page.key);
    const status = prerequisiteKeys.has(page.key) ? "prerequisite" : branchKeys.has(page.key) ? "branch" : "unassigned";
    return {
      key: page.key,
      title: page.title,
      kind: page.kind,
      degree: degree.get(page.key) || 0,
      date: page.data.history?.event?.start ?? page.data.history?.publication_year ?? null,
      evidence_count: (page.data.evidence_ids || []).length,
      domains: document?.domains || page.data.domains || [],
      status
    };
  })
  .sort((a, b) => b.degree - a.degree || a.title.localeCompare(b.title, "ko"));

const coverage = {
  generated_at: new Date().toISOString(),
  traces: catalog.traces.length,
  steps: catalog.traces.reduce((sum, trace) => sum + trace.steps.length, 0),
  public_knowledge: publicKnowledge.length,
  unique_step_documents: traceStepKeys.size,
  coverage_percent: publicKnowledge.length ? Number(((traceStepKeys.size / publicKnowledge.length) * 100).toFixed(1)) : 0,
  gaps: gaps.length,
  top_gaps: gaps.slice(0, 30)
};

const lines = [
  "# Trace gap report",
  "",
  `Generated: ${coverage.generated_at}`,
  "",
  `- traces: ${coverage.traces}`,
  `- steps: ${coverage.steps}`,
  `- public knowledge: ${coverage.public_knowledge}`,
  `- unique step documents: ${coverage.unique_step_documents} (${coverage.coverage_percent}%)`,
  `- not in any trace step: ${coverage.gaps}`,
  "",
  "Status: `unassigned` — no step/prerequisite/branch; `prerequisite` / `branch` — referenced but not a step.",
  "",
  "| # | degree | kind | date | evidence | document | status |",
  "|---:|---:|---|---:|---:|---|---|",
  ...gaps.slice(0, 30).map((gap, index) =>
    `| ${index + 1} | ${gap.degree} | ${gap.kind} | ${gap.date ?? "—"} | ${gap.evidence_count} | ${gap.title} | ${gap.status} |`
  ),
  ""
];

await mkdir(path.join(root, "output"), { recursive: true });
await writeFile(path.join(root, "output", "trace-gaps.json"), JSON.stringify(coverage, null, 2) + "\n", "utf8");
await writeFile(path.join(root, "output", "trace-gaps.md"), lines.join("\n") + "\n", "utf8");
console.log(`Trace gaps: ${coverage.gaps} public knowledge not in steps`);
console.log(`Coverage: ${coverage.unique_step_documents}/${coverage.public_knowledge} (${coverage.coverage_percent}%)`);
console.log("top gaps:");
for (const gap of gaps.slice(0, 10)) console.log(`- ${gap.degree} ${gap.kind} ${gap.title} (${gap.status})`);
console.log("wrote output/trace-gaps.json and output/trace-gaps.md");
