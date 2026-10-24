import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readJson, writeJson } from "../shared/fs.mjs";
import { loadWorkspace } from "../registry/workspace.mjs";
import { loadTraceCatalog } from "../registry/traces.mjs";
import { buildGraph } from "../compile/graph.mjs";

export async function checkTraces(root = process.cwd(), { write = true } = {}) {
  const catalog = await loadTraceCatalog(root);
  const schema = await readJson(path.join(root, "schema", "trace.schema.json"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const errors = [];
  if (!validate(catalog)) {
    for (const issue of validate.errors || []) errors.push(`${issue.instancePath || "/"} ${issue.message}`);
  }

  const workspace = await loadWorkspace(root);
  const pages = workspace.pageByKey;
  const ids = new Set();
  const publicKinds = new Set(["concept", "entity", "analysis", "source", "reference"]);
  const roleKinds = {
    source: new Set(["source", "reference"]),
    concept: new Set(["concept"]),
    analysis: new Set(["analysis"]),
    entity: new Set(["entity"])
  };

  const checkDocument = (key, where) => {
    const page = pages.get(key);
    if (!page) {
      errors.push(`${where}: missing document ${key}`);
      return null;
    }
    if (page.data.publication_visibility !== "public") errors.push(`${where}: non-public document ${key}`);
    if (!publicKinds.has(page.kind)) errors.push(`${where}: unsupported document kind ${page.kind} for ${key}`);
    return page;
  };

  for (const trace of catalog.traces || []) {
    if (ids.has(trace.id)) errors.push(`duplicate trace id ${trace.id}`);
    ids.add(trace.id);
    const seen = new Set();
    for (const key of trace.prerequisites || []) checkDocument(key, `${trace.id}.prerequisites`);
    for (const [index, step] of (trace.steps || []).entries()) {
      const where = `${trace.id}.steps[${index}]`;
      const page = checkDocument(step.document, where);
      if (page && !roleKinds[step.role]?.has(page.kind)) {
        errors.push(`${where}: role ${step.role} does not match kind ${page.kind} for ${step.document}`);
      }
      if (seen.has(step.document)) errors.push(`${where}: duplicate step document ${step.document}`);
      seen.add(step.document);
      for (const key of step.checkpoint?.evidence || []) checkDocument(key, `${where}.checkpoint.evidence`);
      if (!(step.checkpoint?.evidence || []).length) errors.push(`${where}: checkpoint needs evidence`);
    }
    for (const [index, branch] of (trace.branches || []).entries()) {
      for (const key of branch.documents || []) checkDocument(key, `${trace.id}.branches[${index}]`);
    }
  }

  if (errors.length) {
    return { errors, coverage: null };
  }

  const publicKnowledge = workspace.pages.filter(
    (page) => ["concept", "entity", "analysis"].includes(page.kind) && page.data.publication_visibility === "public"
  );
  const stepDocuments = new Map();
  const referencedDocuments = new Set();
  const roleCounts = {};
  const singleEvidenceSteps = [];
  const undatedSteps = [];
  const traceReports = [];

  for (const trace of catalog.traces) {
    const traceSteps = new Set();
    for (const [index, step] of trace.steps.entries()) {
      const page = pages.get(step.document);
      traceSteps.add(step.document);
      stepDocuments.set(step.document, page);
      referencedDocuments.add(step.document);
      roleCounts[step.role] = (roleCounts[step.role] || 0) + 1;
      if (page && (page.data.evidence_ids || []).length === 1) {
        singleEvidenceSteps.push({ trace: trace.id, step: index + 1, document: step.document, title: page.title });
      }
      if (page && !(page.data.history?.event?.start != null || page.data.history?.publication_year != null)) {
        undatedSteps.push({ trace: trace.id, step: index + 1, document: step.document, title: page.title });
      }
    }
    for (const key of trace.prerequisites || []) referencedDocuments.add(key);
    for (const branch of trace.branches || []) for (const key of branch.documents) referencedDocuments.add(key);
    traceReports.push({
      id: trace.id,
      title: trace.title,
      steps: trace.steps.length,
      unique_step_documents: traceSteps.size,
      minutes: trace.minutes
    });
  }

  const qualityBudget = {
    min_coverage_percent: 25,
    max_single_evidence_steps: 3,
    max_undated_steps: 24
  };
  const coveragePercent = publicKnowledge.length ? Number(((stepDocuments.size / publicKnowledge.length) * 100).toFixed(1)) : 0;
  const budgetOk = coveragePercent >= qualityBudget.min_coverage_percent
    && singleEvidenceSteps.length <= qualityBudget.max_single_evidence_steps
    && undatedSteps.length <= qualityBudget.max_undated_steps;

  const coverage = {
    generated_at: new Date().toISOString(),
    traces: catalog.traces.length,
    steps: catalog.traces.reduce((sum, trace) => sum + trace.steps.length, 0),
    minutes: catalog.traces.reduce((sum, trace) => sum + trace.minutes, 0),
    public_knowledge: publicKnowledge.length,
    unique_step_documents: stepDocuments.size,
    coverage_percent: coveragePercent,
    referenced_documents: referencedDocuments.size,
    roles: roleCounts,
    single_evidence_steps: singleEvidenceSteps,
    undated_steps: undatedSteps,
    quality_budget: qualityBudget,
    budget_ok: budgetOk,
    tests: traceReports
  };

  if (write) {
    await writeJson(path.join(root, "output", "trace-coverage.json"), coverage);
  }

  return { errors: [], coverage };
}

export async function analyzeTraceGaps(root = process.cwd(), { write = true } = {}) {
  const catalog = await loadTraceCatalog(root);
  const { graph, documents } = await buildGraph(root);
  const workspace = await loadWorkspace(root);
  const pages = workspace.pageByKey;
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

  if (write) {
    await writeJson(path.join(root, "output", "trace-gaps.json"), coverage);
    await writeFile(path.join(root, "output", "trace-gaps.md"), lines.join("\n") + "\n", "utf8");
  }

  return { coverage, gaps };
}

export async function renderTraceReview(root = process.cwd(), { write = true } = {}) {
  const catalog = await loadTraceCatalog(root);
  const workspace = await loadWorkspace(root);
  const pages = workspace.pageByKey;

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

  if (write) {
    await mkdir(path.join(root, "output"), { recursive: true });
    await writeFile(path.join(root, "output", "trace-checkpoints.md"), lines.join("\n") + "\n", "utf8");
  }

  const checkpoints = catalog.traces.reduce((sum, trace) => sum + trace.steps.length, 0);
  return { traces: catalog.traces.length, checkpoints };
}
