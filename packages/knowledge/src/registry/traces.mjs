import path from "node:path";
import { readJson } from "../shared/fs.mjs";

export async function loadTraceCatalog(root = process.cwd()) {
  return readJson(path.join(root, "catalog", "traces.json"));
}

export async function traceReferences(root, key) {
  const catalog = await loadTraceCatalog(root);
  const references = [];
  for (const trace of catalog.traces || []) {
    const inSteps = (trace.steps || []).some((step) => step.document === key);
    const inPrerequisites = (trace.prerequisites || []).includes(key);
    const inBranches = (trace.branches || []).some((branch) => (branch.documents || []).includes(key));
    if (inSteps || inPrerequisites || inBranches) references.push(trace.id);
  }
  return references;
}
