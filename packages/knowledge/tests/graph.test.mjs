import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildGraph } from "../src/build.mjs";

const root = process.cwd();
const baseline = JSON.parse(await readFile(path.join(root, "contracts", "migration-baseline.json"), "utf8"));
const routes = JSON.parse(await readFile(path.join(root, "contracts", "routes.json"), "utf8"));
const result = await buildGraph(root);

test("legacy migration baseline is preserved as a lower bound", () => {
  assert.ok(result.report.documents >= baseline.documents);
  assert.ok(result.report.relation_documents >= baseline.relation_documents);
  assert.ok(result.report.statements >= baseline.statements);
  assert.ok(result.report.redirects >= baseline.redirects);
  assert.ok(result.report.public_documents >= baseline.public_documents);
  assert.ok(result.report.unlisted_documents >= baseline.unlisted_documents);
  assert.deepEqual(result.graph.parity, {
    documents: true,
    relation_documents: true,
    statements: true,
    redirects: true
  });
});

test("every legacy route still has a document", () => {
  const ids = new Set(result.documents.map((document) => document.id));
  for (const page of routes.pages) assert.ok(ids.has(page.id), `missing legacy page ${page.id}`);
});

test("every document has a generated /docs/{id}/ URL", () => {
  for (const document of result.documents) {
    assert.equal(document.url, `/docs/${document.id}/`);
  }
});

test("every statement has a registered target and a document", () => {
  const keys = new Set(result.graph.nodes.map((node) => node.key));
  for (const statement of result.graph.statements) {
    assert.ok(keys.has(statement.target), `missing target ${statement.target}`);
    assert.ok(keys.has(statement.subject), `missing subject ${statement.subject}`);
    assert.ok(statement.document, `missing document for ${statement.id}`);
  }
});

test("graph invariants are clean", () => {
  assert.deepEqual(result.report.issues.missingRoutes, []);
  assert.deepEqual(result.report.issues.missingTargets, []);
  assert.deepEqual(result.report.issues.missingEvidence, []);
  assert.deepEqual(result.report.issues.invalidEvidence, []);
  assert.deepEqual(result.report.issues.selfStatements, []);
  assert.deepEqual(result.report.issues.duplicateStatements, []);
});

test("backlinks are reciprocal indexes, not a second source of truth", () => {
  for (const statement of result.graph.statements) {
    const entries = result.graph.backlinks[statement.target] || [];
    assert.ok(entries.some((entry) => entry.statement === statement.id), `missing backlink for ${statement.id}`);
  }
});

test("timeline includes dated documents without inventing undated events", () => {
  assert.ok(result.graph.timeline.length > 0);
  for (const event of result.graph.timeline) {
    assert.ok(event.document.startsWith("concept:") || event.document.startsWith("analysis:") || event.document.startsWith("person:") || event.document.startsWith("source:"));
    assert.ok(event.publication_year === null || Number.isInteger(event.publication_year));
    assert.ok(event.event_start === null || Number.isInteger(event.event_start));
  }
});
