import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildGraph } from "../src/build.mjs";

const root = process.cwd();
const routes = JSON.parse(await readFile(path.join(root, "contracts", "routes.json"), "utf8"));
const removedCatalog = JSON.parse(await readFile(path.join(root, "contracts", "removed-documents.json"), "utf8"));
const result = await buildGraph(root);
const documentIds = new Set(result.documents.map((document) => document.id));
const removedById = new Map((removedCatalog.removed || []).map((entry) => [entry.id, entry]));

test("every legacy route is active, archived, or explicitly purged", () => {
  for (const page of routes.pages) {
    if (documentIds.has(page.id)) continue;
    const removed = removedById.get(page.id);
    assert.ok(removed, `missing legacy page ${page.id} without removal entry`);
    assert.equal(removed.mode, "purge", `legacy page ${page.id} missing without purge mode`);
    assert.equal(removed.break_url, true, `legacy page ${page.id} purged without break_url`);
  }
});

test("removed document registry is internally consistent", () => {
  const ids = new Set();
  for (const entry of removedCatalog.removed || []) {
    assert.ok(!ids.has(entry.id), `duplicate removal ${entry.id}`);
    ids.add(entry.id);
    if (entry.mode === "archive") assert.ok(documentIds.has(entry.id), `archived page missing: ${entry.id}`);
    if (entry.mode === "purge") {
      assert.equal(entry.break_url, true, `purged page missing break_url: ${entry.id}`);
      assert.ok(!documentIds.has(entry.id), `purged page still built: ${entry.id}`);
    }
  }
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
