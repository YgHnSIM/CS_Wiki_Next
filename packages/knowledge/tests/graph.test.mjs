import test from "node:test";
import assert from "node:assert/strict";
import { buildGraph } from "../src/build.mjs";

const result = await buildGraph(process.cwd());

test("graph parity matches the migration contract", () => {
  assert.equal(result.report.documents, 440);
  assert.equal(result.report.relation_documents, 362);
  assert.equal(result.report.statements, 887);
  assert.equal(result.report.redirects, 555);
  assert.equal(result.report.public_documents, 397);
  assert.equal(result.report.unlisted_documents, 43);
  assert.deepEqual(result.graph.parity, {
    documents: true,
    relation_documents: true,
    statements: true,
    redirects: true
  });
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
