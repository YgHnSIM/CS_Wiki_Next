import { readFile } from "node:fs/promises";
import path from "node:path";

export async function traceReferences(root, key) {
  const catalog = JSON.parse(await readFile(path.join(root, "catalog", "traces.json"), "utf8"));
  const references = [];
  for (const trace of catalog.traces || []) {
    const inSteps = (trace.steps || []).some((step) => step.document === key);
    const inPrerequisites = (trace.prerequisites || []).includes(key);
    const inBranches = (trace.branches || []).some((branch) => (branch.documents || []).includes(key));
    if (inSteps || inPrerequisites || inBranches) references.push(trace.id);
  }
  return references;
}
