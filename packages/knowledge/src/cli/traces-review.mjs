import { renderTraceReview } from "../validate/traces.mjs";

const { traces, checkpoints } = await renderTraceReview(process.cwd());

console.log(`Trace review: ${traces} traces, ${checkpoints} checkpoints`);
console.log("wrote output/trace-checkpoints.md");
