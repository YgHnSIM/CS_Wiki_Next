import { analyzeQuality } from "../validate/quality.mjs";

const report = await analyzeQuality(process.cwd());

console.log(`Content quality: ${report.public_documents} public docs, ${report.public_knowledge} public knowledge`);
console.log(`undated: ${report.undated.length}, event without evidence: ${report.event_without_evidence.length}, orphans: ${report.orphans.length}, single evidence: ${report.single_evidence.length}, no evidence: ${report.no_evidence.length}, relation evidence outside ids: ${report.relation_evidence_outside.length}`);
console.log("undated samples:");
for (const document of report.undated.slice(0, 10)) console.log(`- ${document.title} (${document.key})`);
console.log("orphan samples:");
for (const document of report.orphans.slice(0, 10)) console.log(`- ${document.title} (${document.key})`);
console.log("single-evidence samples:");
for (const document of report.single_evidence.slice(0, 10)) console.log(`- ${document.title} (${document.key})`);
console.log("wrote output/content-quality.json");
