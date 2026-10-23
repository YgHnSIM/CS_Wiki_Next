import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspace } from "./compile/relations.mjs";

const statementPattern = /^stmt:[a-z0-9][a-z0-9:/_-]*$/;

function statementBase(subject, predicate, target) {
  return `stmt:${subject}/${predicate}/${target}`;
}

export async function buildGraph(root = process.cwd()) {
  const workspace = await loadWorkspace(root);
  const routes = JSON.parse(await readFile(path.join(root, "contracts", "routes.json"), "utf8"));
  const baseline = JSON.parse(await readFile(path.join(root, "contracts", "parity.json"), "utf8"));
  const routeById = new Map(routes.pages.map((page) => [page.id, page]));
  const nodeByKey = new Map(workspace.nodes.map((node) => [node.key, node]));
  const pageById = new Map(workspace.pages.map((page) => [page.id, page]));
  const issues = {
    missingRoutes: [],
    missingTargets: [],
    missingEvidence: [],
    invalidEvidence: [],
    selfStatements: [],
    duplicateStatements: []
  };

  const documents = workspace.pages.map((page) => {
    const route = routeById.get(page.id);
    if (!route) issues.missingRoutes.push(page.id);
    return {
      id: page.id,
      key: page.key,
      kind: page.kind,
      title: page.title,
      aliases: page.aliases,
      summary: page.data.summary,
      domains: page.data.domains || [],
      publication_visibility: page.data.publication_visibility,
      graph_visibility: page.data.graph_visibility,
      created: page.data.created,
      updated: page.data.updated,
      url: route?.url || null,
      redirects: route?.legacyUrls || [],
      about: Array.isArray(page.data.about) && page.data.about.length ? page.data.about : [page.key],
      history: page.data.history || null,
      body: page.body
    };
  });
  documents.sort((a, b) => a.id.localeCompare(b.id));

  const statements = [];
  const statementCounts = new Map();
  const backlinks = new Map();

  for (const page of workspace.pages) {
    const relations = Array.isArray(page.data.relations) ? page.data.relations : [];
    for (const relation of relations) {
      const subject = relation.subject || page.key;
      const target = relation.target;
      if (!nodeByKey.has(target)) {
        issues.missingTargets.push({ page: page.id, target });
        continue;
      }
      if (subject === target) issues.selfStatements.push({ page: page.id, subject, target });

      const evidence = [];
      for (const item of relation.evidence || []) {
        const source = pageById.get(item.source);
        if (!source) {
          issues.missingEvidence.push({ page: page.id, source: item.source });
          continue;
        }
        if (!["source", "reference"].includes(source.kind)) {
          issues.invalidEvidence.push({ page: page.id, source: item.source, kind: source.kind });
          continue;
        }
        evidence.push({
          source: item.source,
          locator: item.locator || null,
          quote: item.quote || null,
          snapshot: item.snapshot || null
        });
      }

      const base = statementBase(subject, relation.predicate, target);
      const count = (statementCounts.get(base) || 0) + 1;
      statementCounts.set(base, count);
      const id = count === 1 ? base : `${base}-${count}`;
      if (!statementPattern.test(id)) throw new Error(`invalid statement id: ${id}`);
      if (count > 1) issues.duplicateStatements.push({ page: page.id, id: base });

      const statement = {
        id,
        subject,
        predicate: relation.predicate,
        target,
        note: relation.note || "",
        evidence,
        confidence: relation.confidence || "unspecified",
        valid_from: relation.valid_from ?? null,
        valid_to: relation.valid_to ?? null,
        document: page.key
      };
      statements.push(statement);

      const targetBacklinks = backlinks.get(target) || [];
      targetBacklinks.push({ source: subject, predicate: relation.predicate, statement: id });
      backlinks.set(target, targetBacklinks);
    }
  }

  statements.sort((a, b) => a.id.localeCompare(b.id));
  const backlinkObject = Object.fromEntries([...backlinks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => [key, values.sort((a, b) => a.statement.localeCompare(b.statement))]));

  const relationDocuments = workspace.pages.filter((page) => Array.isArray(page.data.relations) && page.data.relations.length > 0).length;
  const publicDocuments = documents.filter((document) => document.publication_visibility === "public").length;
  const unlistedDocuments = documents.filter((document) => document.publication_visibility === "unlisted").length;
  const report = {
    generated_at: new Date().toISOString(),
    documents: documents.length,
    public_documents: publicDocuments,
    unlisted_documents: unlistedDocuments,
    relation_documents: relationDocuments,
    statements: statements.length,
    nodes: workspace.nodes.length,
    redirects: Object.keys(routes.redirects || {}).length,
    evidence_references: statements.reduce((sum, statement) => sum + statement.evidence.length, 0),
    issues
  };

  const parity = {
    documents: report.documents === baseline.documents,
    relation_documents: report.relation_documents === baseline.relation_documents,
    statements: report.statements === baseline.statements,
    redirects: report.redirects === baseline.redirects
  };
  const parityOk = Object.values(parity).every(Boolean);
  if (!parityOk) {
    throw new Error(`graph parity failed: ${JSON.stringify({ actual: report, expected: baseline, parity })}`);
  }
  if (Object.values(issues).some((items) => items.length > 0)) {
    const fatal = issues.missingRoutes.length || issues.missingTargets.length || issues.missingEvidence.length
      || issues.invalidEvidence.length || issues.selfStatements.length;
    if (fatal) throw new Error(`graph invariants failed: ${JSON.stringify(issues)}`);
  }

  const graph = {
    schema_version: 1,
    nodes: workspace.nodes.map((node) => ({
      key: node.key,
      type: node.type,
      labels: node.labels,
      aliases: node.aliases,
      external_ids: node.external_ids,
      status: node.status,
      page_id: node.page_id
    })),
    statements,
    backlinks: backlinkObject,
    timeline: documents
      .filter((document) => document.history)
      .map((document) => ({
        document: document.key,
        publication_year: document.history.publication_year ?? null,
        event_start: document.history.event?.start ?? null,
        event_end: document.history.event?.end ?? null,
        layer: document.history.layer ?? null
      })),
    parity
  };

  return { graph, documents, report };
}

export async function writeGraph(root = process.cwd()) {
  const { graph, documents, report } = await buildGraph(root);
  const output = path.join(root, "data", "build");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "graph.json"), JSON.stringify(graph, null, 2) + "\n", "utf8");
  await writeFile(path.join(output, "documents.json"), JSON.stringify(documents, null, 2) + "\n", "utf8");
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const report = await writeGraph();
  console.log(`Graph: ${report.documents} documents, ${report.statements} statements, ${report.nodes} nodes`);
  console.log(`Issues: ${JSON.stringify(report.issues)}`);
}
