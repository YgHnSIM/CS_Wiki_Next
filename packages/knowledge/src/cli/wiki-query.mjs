import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildGraph } from "../build.mjs";
import { rankSearch } from "../../../../app/src/lib/search.mjs";
import { appendLog } from "../llm-wiki/log-entry.mjs";
import { today } from "./today.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const json = args.includes("--json");
const save = args.includes("--save");
const limit = Math.max(1, Math.min(Number(value("limit")) || 5, 20));
const question = args.filter((arg) => !arg.startsWith("--") && arg !== String(limit)).join(" ").trim();
if (!question) {
  console.error('Usage: npm run wiki:query -- "질문" [--limit 5] [--json] [--save]');
  process.exit(1);
}

const baseline = process.env.SITE_URL || "https://yghnsim.github.io";
const base = (process.env.SITE_BASE || "/CS_Wiki_Next").replace(/\/$/, "");
const urlFor = (id) => `${baseline}${base}/docs/${id}/`;
const { documents, graph } = await buildGraph(root);
const pageById = new Map(documents.map((document) => [document.id, document]));
const degree = new Map();
for (const statement of graph.statements) {
  degree.set(statement.subject, (degree.get(statement.subject) || 0) + 1);
  degree.set(statement.target, (degree.get(statement.target) || 0) + 1);
}
const publicDocuments = documents.filter((document) => document.publication_visibility === "public");
const searchable = publicDocuments.map((document) => ({
  id: document.id,
  title: document.title,
  summary: document.summary,
  kind: document.kind,
  aliases: document.aliases,
  domains: document.domains,
  degree: degree.get(document.key) || 0
}));
let ranked = rankSearch(searchable, question);
if (!ranked.length) {
  const merged = new Map();
  for (const term of question.split(/\s+/).filter(Boolean)) {
    for (const hit of rankSearch(searchable, term)) {
      const previous = merged.get(hit.item.id);
      if (!previous || hit.score > previous.score) merged.set(hit.item.id, hit);
    }
  }
  ranked = [...merged.values()].sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "ko"));
}
const results = ranked.slice(0, limit).map(({ item, score }) => {
  const document = pageById.get(item.id);
  const evidence = graph.statements
    .filter((statement) => statement.document === document.id)
    .flatMap((statement) => statement.evidence.map((entry) => ({
      source: entry.source,
      source_title: pageById.get(entry.source)?.title || entry.source,
      locator: entry.locator,
      quote: entry.quote,
      predicate: statement.predicate,
      target: statement.target
    })));
  return { ...item, key: document.key, url: document.url, score, evidence };
});
const hash = createHash("sha256").update(question).digest("hex").slice(0, 8);
const date = today();
const packet = {
  schema_version: 1,
  query: question,
  generated_at: new Date().toISOString(),
  results
};

await mkdir(path.join(root, "output", "query"), { recursive: true });
await writeFile(path.join(root, "output", "query", `${date}-${hash}.json`), JSON.stringify(packet, null, 2) + "\n", "utf8");

const citation = (result) => `[${result.title}](${urlFor(result.id)})`;
let markdown = `# Query\n\n**${question}**\n\n`;
if (!results.length) {
  markdown += "위키에서 일치하는 공개 문서를 찾지 못했습니다.\n";
} else {
  markdown += `## 결과 ${results.length}개\n\n`;
  for (const result of results) {
    markdown += `### ${citation(result)}\n\n${result.summary}\n\n`;
    if (result.evidence.length) {
      for (const evidence of result.evidence) {
        const locator = evidence.locator ? ` · ${evidence.locator}` : "";
        const quote = evidence.quote ? ` — “${evidence.quote}”` : "";
        markdown += `- ${evidence.source_title}${locator}${quote}\n`;
      }
      markdown += "\n";
    }
  }
}

if (json) {
  console.log(JSON.stringify(packet, null, 2));
} else {
  console.log(markdown.trim());
}

if (save) {
  if (!results.length) {
    console.error("nothing to save: no results");
    process.exitCode = 1;
  } else {
    const id = `analysis-synthesis-${date}-${hash}`;
    const key = `analysis:synthesis-${date}-${hash}`;
    const title = `질문: ${question}`.slice(0, 120);
    const summary = `${question}에 대해 위키 문서와 근거를 연결한 synthesis.`.slice(0, 200);
    const sources = [...new Set(results.flatMap((result) => result.evidence.map((evidence) => evidence.source)))];
    const synthDir = path.join(root, "wiki", "syntheses");
    await mkdir(synthDir, { recursive: true });
    const body = `${markdown}\n\n---\n\n이 페이지는 \`wiki:query --save\`로 생성된 synthesis다. 인용한 문서의 변경을 자동 추적하지 않으므로 \`wiki:audit\`으로 재검증한다.\n`;
    const page = `---
schema_version: 3
id: ${id}
key: ${key}
kind: analysis
title: ${JSON.stringify(title)}
aliases: []
summary: ${JSON.stringify(summary)}
domains: []
publication_visibility: public
graph_visibility: hidden
status: current
page_role: synthesis
created: ${date}
updated: ${date}
evidence_ids: ${JSON.stringify(sources.slice(0, 100))}
capability_layers: []
---

${body}`;
    await writeFile(path.join(synthDir, `${id}.md`), page, "utf8");
    await appendLog(root, {
      action: "query",
      title: `Synthesis: ${title}`,
      body: `## Query\n\n- question: ${question}\n- synthesis: wiki/syntheses/${id}.md\n- results: ${results.length}\n`
    });
    console.log(`\nSaved synthesis: wiki/syntheses/${id}.md`);
    console.log("Next: npm run knowledge:seed && npm run wiki:index -- --write && npm run wiki:lint");
  }
}
