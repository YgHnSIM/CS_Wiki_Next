import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { loadWorkspace } from "../compile/relations.mjs";

const root = process.cwd();
const catalog = JSON.parse(await readFile(path.join(root, "catalog", "traces.json"), "utf8"));
const schema = JSON.parse(await readFile(path.join(root, "schema", "trace.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const errors = [];
if (!validate(catalog)) {
  for (const issue of validate.errors || []) errors.push(`${issue.instancePath || "/"} ${issue.message}`);
}

const workspace = await loadWorkspace(root);
const pages = new Map(workspace.pages.map((page) => [page.key, page]));
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
  console.error(`Trace check: ${errors.length} error(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
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

  await mkdir(path.join(root, "output"), { recursive: true });
  await writeFile(path.join(root, "output", "trace-coverage.json"), JSON.stringify(coverage, null, 2) + "\n", "utf8");

  console.log(`Trace check: ${coverage.traces} traces, ${coverage.steps} steps, ${coverage.minutes} minutes`);
  console.log(`Coverage: ${coverage.unique_step_documents}/${coverage.public_knowledge} public knowledge (${coverage.coverage_percent}%), ${coverage.referenced_documents} referenced documents`);
  console.log(`Single-evidence steps: ${singleEvidenceSteps.length}, undated steps: ${undatedSteps.length}`);
  if (!budgetOk) {
    console.error(`Trace quality budget failed: coverage >= ${qualityBudget.min_coverage_percent}%, single <= ${qualityBudget.max_single_evidence_steps}, undated <= ${qualityBudget.max_undated_steps}`);
    process.exitCode = 1;
  }
  console.log("wrote output/trace-coverage.json");
}
