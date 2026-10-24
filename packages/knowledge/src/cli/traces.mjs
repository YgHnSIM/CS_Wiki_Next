import { checkTraces } from "../validate/traces.mjs";

const { errors, coverage } = await checkTraces(process.cwd());

if (errors.length) {
  console.error(`Trace check: ${errors.length} error(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const { quality_budget: qualityBudget, budget_ok: budgetOk, single_evidence_steps: singleEvidenceSteps, undated_steps: undatedSteps } = coverage;
  console.log(`Trace check: ${coverage.traces} traces, ${coverage.steps} steps, ${coverage.minutes} minutes`);
  console.log(`Coverage: ${coverage.unique_step_documents}/${coverage.public_knowledge} public knowledge (${coverage.coverage_percent}%), ${coverage.referenced_documents} referenced documents`);
  console.log(`Single-evidence steps: ${singleEvidenceSteps.length}, undated steps: ${undatedSteps.length}`);
  if (!budgetOk) {
    console.error(`Trace quality budget failed: coverage >= ${qualityBudget.min_coverage_percent}%, single <= ${qualityBudget.max_single_evidence_steps}, undated <= ${qualityBudget.max_undated_steps}`);
    process.exitCode = 1;
  }
  console.log("wrote output/trace-coverage.json");
}
