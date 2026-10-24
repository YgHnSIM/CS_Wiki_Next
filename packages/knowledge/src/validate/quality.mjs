import path from "node:path";
import { writeJson } from "../shared/fs.mjs";
import { extractWikiLinkTargets } from "../parse/links.mjs";
import { loadWorkspace, resolvePage } from "../registry/workspace.mjs";
import { buildGraph } from "../compile/graph.mjs";

export async function analyzeQuality(root = process.cwd(), { write = true } = {}) {
  const { graph, documents } = await buildGraph(root);
  const workspace = await loadWorkspace(root);
  const publicDocuments = documents.filter((document) => document.publication_visibility === "public");
  const publicKnowledge = publicDocuments.filter((document) => ["concept", "entity", "analysis"].includes(document.kind));
  const statementsByDocument = new Map();

  for (const statement of graph.statements) {
    const list = statementsByDocument.get(statement.document) || [];
    list.push(statement);
    statementsByDocument.set(statement.document, list);
  }

  const undated = publicDocuments.filter((document) => {
    const history = document.history;
    return !(history?.event?.start !== undefined && history?.event?.start !== null)
      && !(history?.publication_year !== undefined && history?.publication_year !== null);
  });

  const eventWithoutEvidence = publicDocuments.filter((document) =>
    document.history?.event?.start !== undefined
    && document.history?.event?.start !== null
    && !document.history?.event?.evidence_id
  );

  const wikiIncoming = new Map();
  for (const page of workspace.pages) {
    for (const targetName of extractWikiLinkTargets(page.body, { includeAssets: true })) {
      const target = resolvePage(workspace, targetName);
      if (!target) continue;
      wikiIncoming.set(target.id, (wikiIncoming.get(target.id) || 0) + 1);
    }
  }

  const orphans = publicKnowledge.filter((document) =>
    !(graph.backlinks[document.key] || []).length && !(wikiIncoming.get(document.id) || 0)
  );
  const singleEvidence = publicKnowledge.filter((document) => (document.evidence_ids || []).length === 1);
  const noEvidence = publicKnowledge.filter((document) => !(document.evidence_ids || []).length);

  const relationEvidenceOutside = [];
  for (const document of publicKnowledge) {
    const evidence = new Set(document.evidence_ids || []);
    const outside = new Set();
    for (const statement of statementsByDocument.get(document.key) || []) {
      for (const item of statement.evidence) if (!evidence.has(item.source)) outside.add(item.source);
    }
    if (outside.size) relationEvidenceOutside.push({ key: document.key, title: document.title, outside: [...outside] });
  }

  const byDomain = new Map();
  for (const document of publicDocuments) {
    for (const domain of document.domains) byDomain.set(domain, (byDomain.get(domain) || 0) + 1);
  }

  const report = {
    generated_at: new Date().toISOString(),
    public_documents: publicDocuments.length,
    public_knowledge: publicKnowledge.length,
    undated: undated.map((document) => ({ key: document.key, title: document.title, kind: document.kind })),
    event_without_evidence: eventWithoutEvidence.map((document) => ({ key: document.key, title: document.title, event: document.history.event })),
    orphans: orphans.map((document) => ({ key: document.key, title: document.title, kind: document.kind })),
    single_evidence: singleEvidence.map((document) => ({ key: document.key, title: document.title, kind: document.kind })),
    no_evidence: noEvidence.map((document) => ({ key: document.key, title: document.title, kind: document.kind })),
    relation_evidence_outside: relationEvidenceOutside,
    domains: Object.fromEntries([...byDomain.entries()].sort((a, b) => b[1] - a[1]))
  };

  if (write) {
    await writeJson(path.join(root, "output", "content-quality.json"), report);
  }

  return report;
}
