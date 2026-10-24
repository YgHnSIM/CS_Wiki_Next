import { checkRegistry } from "../validate/registry.mjs";

const { counts, errors, warnings } = await checkRegistry(process.cwd());

console.log(`Knowledge check: ${counts.nodes} nodes, ${counts.aliases} aliases, ${counts.reviewed} reviewed, ${counts.auto} auto, ${counts.provisional} provisional`);
for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);
if (errors.length) process.exitCode = 1;
