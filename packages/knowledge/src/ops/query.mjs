import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { exists, writeJson } from "../shared/fs.mjs";
import { today } from "../shared/today.mjs";
import { renderPage } from "../parse/frontmatter.mjs";
import { extractWikiLinkTargets } from "../parse/links.mjs";
import { updateBody } from "../parse/relations.mjs";
import { loadWorkspace } from "../registry/workspace.mjs";
import { buildGraph } from "../compile/graph.mjs";
import { rankSearch } from "../search/rank.mjs";
import { appendLog } from "./log.mjs";
import { addWikiGap } from "./gaps.mjs";

export async function queryWiki(root = process.cwd(), {
  question,
  limit = 5,
  save = false,
  recordGap = false
} = {}) {
  const cleanQuestion = String(question || "").trim();
  if (!cleanQuestion) {
    throw new Error('Usage: npm run wiki:query -- "질문" [--limit 5] [--json] [--save] [--record-gap]');
  }

  const baseline = process.env.SITE_URL || "https://yghnsim.github.io";
  const base = (process.env.SITE_BASE || "/CS_Wiki_Next").replace(/\/$/, "");
  const urlFor = (id) => `${baseline}${base}/docs/${id}/`;

  // Step 1: Read wiki/index.md to build index catalog map
  const indexMap = new Map();
  const indexPath = path.join(root, "wiki", "index.md");
  if (await exists(indexPath)) {
    const indexText = await readFile(indexPath, "utf8");
    for (const line of indexText.split("\n")) {
      if (!line.startsWith("- ")) continue;
      const [target] = extractWikiLinkTargets(line);
      if (target) indexMap.set(target, line.replace(/^- /, "").trim());
    }
  }

  // Step 2: Build/load graph and rank public documents
  const { documents, graph } = await buildGraph(root);
  const pageById = new Map(documents.map((document) => [document.id, document]));
  const pageByKey = new Map(documents.map((document) => [document.key, document]));
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

  let ranked = rankSearch(searchable, cleanQuestion);
  if (!ranked.length) {
    const merged = new Map();
    for (const term of cleanQuestion.split(/\s+/).filter(Boolean)) {
      for (const hit of rankSearch(searchable, term)) {
        const previous = merged.get(hit.item.id);
        if (!previous || hit.score > previous.score) merged.set(hit.item.id, hit);
      }
    }
    ranked = [...merged.values()].sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "ko"));
  }

  // Step 3 & 4: Expand 1-hop relations/backlinks and collect evidence by document.key
  const results = ranked.slice(0, limit).map(({ item, score }) => {
    const document = pageById.get(item.id);
    const statements = graph.statements.filter(
      (statement) => statement.document === document.key || statement.subject === document.key
    );
    const evidence = statements.flatMap((statement) =>
      statement.evidence.map((entry) => ({
        source: entry.source,
        source_title: pageById.get(entry.source)?.title || entry.source,
        locator: entry.locator,
        quote: entry.quote,
        predicate: statement.predicate,
        target: statement.target
      }))
    );

    const outgoingRelations = statements.slice(0, 6).map((statement) => {
      const targetDoc = pageByKey.get(statement.target);
      return {
        direction: "outgoing",
        predicate: statement.predicate,
        key: statement.target,
        title: targetDoc?.title || statement.target,
        url: targetDoc?.url || null,
        note: statement.note
      };
    });

    const incomingBacklinks = (graph.backlinks[document.key] || []).slice(0, 6).map((backlink) => {
      const sourceDoc = pageByKey.get(backlink.source);
      return {
        direction: "incoming",
        predicate: backlink.predicate,
        key: backlink.source,
        title: sourceDoc?.title || backlink.source,
        url: sourceDoc?.url || null
      };
    });

    return {
      ...item,
      key: document.key,
      url: document.url,
      index_entry: indexMap.get(document.title) || null,
      evidence_ids: document.evidence_ids || [],
      score,
      evidence,
      related: [...outgoingRelations, ...incomingBacklinks]
    };
  });

  const hash = createHash("sha256").update(cleanQuestion).digest("hex").slice(0, 8);
  const date = today();
  const packet = {
    schema_version: 1,
    query: cleanQuestion,
    generated_at: new Date().toISOString(),
    results
  };

  await writeJson(path.join(root, "output", "query", `${date}-${hash}.json`), packet);

  if (recordGap || (!results.length && recordGap)) {
    const gapPath = path.join(root, "wiki", "gaps.md");
    if (await exists(gapPath)) {
      await addWikiGap(root, {
        kind: "question",
        key: cleanQuestion.slice(0, 80),
        evidence: `output/query/${date}-${hash}.json`,
        demand: "1",
        bumpIfOpen: true
      });
    }
  }

  const citation = (result) => `[${result.title}](${urlFor(result.id)})`;
  let markdown = `# Query\n\n**${cleanQuestion}**\n\n`;
  if (!results.length) {
    markdown += "위키에서 일치하는 공개 문서를 찾지 못했습니다.\n";
  } else {
    markdown += `## 결과 ${results.length}개\n\n`;
    for (const result of results) {
      markdown += `### ${citation(result)} (\`[[${result.title}]]\`)\n\n${result.summary}\n\n`;
      if (result.evidence.length) {
        for (const evidence of result.evidence) {
          const locator = evidence.locator ? ` · ${evidence.locator}` : "";
          const quote = evidence.quote ? ` — “${evidence.quote}”` : "";
          markdown += `- ${evidence.source_title}${locator}${quote}\n`;
        }
        markdown += "\n";
      }
      if (result.related.length) {
        const relSummary = result.related
          .slice(0, 4)
          .map((rel) => `${rel.predicate}: [[${rel.title}]]`)
          .join(", ");
        markdown += `- 연결 개념: ${relSummary}\n\n`;
      }
    }
  }

  let synthesisPath = null;
  if (save && results.length) {
    const id = `analysis-synthesis-${date}-${hash}`;
    const key = `analysis:synthesis-${date}-${hash}`;
    const title = `질문: ${cleanQuestion}`.slice(0, 120);
    const summary = `${cleanQuestion}에 대해 위키 문서와 근거를 연결한 synthesis.`.slice(0, 200);
    const sources = [...new Set([
      ...results.flatMap((result) => result.evidence.map((evidence) => evidence.source)),
      ...results.flatMap((result) => result.evidence_ids || [])
    ])].slice(0, 100);

    // Build synthesizes relations when supporting sources exist
    const relations = [];
    if (sources.length > 0) {
      const primarySource = sources[0];
      for (const result of results.slice(0, 5)) {
        if (["concept", "entity", "analysis"].includes(result.kind)) {
          relations.push({
            predicate: "synthesizes",
            target: result.key,
            note: `${cleanQuestion} 질의에서 ${result.title}의 핵심 논의를 합성함.`,
            evidence: [{ source: primarySource }]
          });
        }
      }
    }

    const synthDir = path.join(root, "wiki", "syntheses");
    await mkdir(synthDir, { recursive: true });
    let body = `${markdown}\n${relations.length ? "\n## 관계\n\n" : ""}\n---\n\n이 페이지는 \`wiki:query --save\`로 생성된 synthesis다. 인용한 문서의 변경을 자동 추적하지 않으므로 \`wiki:audit\`으로 재검증한다.\n`;
    if (relations.length) {
      const workspace = await loadWorkspace(root);
      body = updateBody(body, relations, workspace);
    }

    const data = {
      schema_version: 3,
      id,
      key,
      kind: "analysis",
      title,
      aliases: [],
      summary,
      domains: [],
      publication_visibility: "public",
      graph_visibility: "hidden",
      status: "current",
      page_role: "synthesis",
      created: date,
      updated: date,
      evidence_ids: sources,
      capability_layers: [],
      ...(relations.length ? { relations } : {})
    };

    synthesisPath = `wiki/syntheses/${id}.md`;
    await writeFile(path.join(root, synthesisPath), renderPage(data, body), "utf8");
    await appendLog(root, {
      action: "query",
      title: `Synthesis: ${title}`,
      body: `## Query\n\n- question: ${cleanQuestion}\n- synthesis: ${synthesisPath}\n- results: ${results.length}\n`
    });
  }

  return {
    packet,
    markdown: markdown.trim(),
    results,
    synthesisPath
  };
}
