import { analyzeTraceGaps } from "../validate/traces.mjs";

const { coverage, gaps } = await analyzeTraceGaps(process.cwd());

console.log(`Trace gaps: ${coverage.gaps} public knowledge not in steps`);
console.log(`Coverage: ${coverage.unique_step_documents}/${coverage.public_knowledge} (${coverage.coverage_percent}%)`);
console.log("top gaps:");
for (const gap of gaps.slice(0, 10)) console.log(`- ${gap.degree} ${gap.kind} ${gap.title} (${gap.status})`);
console.log("wrote output/trace-gaps.json and output/trace-gaps.md");
