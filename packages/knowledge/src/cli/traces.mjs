import { readFile } from "node:fs/promises";
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
  const steps = catalog.traces.reduce((sum, trace) => sum + trace.steps.length, 0);
  console.log(`Trace check: ${catalog.traces.length} traces, ${steps} steps, ${catalog.traces.reduce((sum, trace) => sum + trace.minutes, 0)} minutes`);
}
