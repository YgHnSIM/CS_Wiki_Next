import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import YAML from "yaml";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
const pageId = "meta-lifecycle-test";
const pageKey = "document:lifecycle-test";
const pagePath = "wiki/meta/Lifecycle Test.md";

const frontmatter = `---
schema_version: 3
id: ${pageId}
key: ${pageKey}
kind: meta
title: Lifecycle Test
aliases:
  - Lifecycle Test
summary: lifecycle CLI integration test document with enough summary length.
domains: []
publication_visibility: public
graph_visibility: public
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
relations:
  - predicate: enables
    target: document:lifecycle-target
    note: test relation for archive sync parity
    evidence: []
---

## 본문

lifecycle test body.

## 관계

<!-- knowledge:relations:start -->
| 관계 | 대상 | 설명 | 근거 |
|---|---|---|---|
| enables | [[Lifecycle Target]] | test relation for archive sync parity | - |
<!-- knowledge:relations:end -->
`;

const targetPage = `---
schema_version: 3
id: meta-lifecycle-target
key: document:lifecycle-target
kind: meta
title: Lifecycle Target
aliases:
  - Lifecycle Target
summary: target document for lifecycle relation sync test with enough length.
domains: []
publication_visibility: public
graph_visibility: public
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 본문

target body.
`;

async function run(script, args = []) {
  try {
    const result = await execFileAsync(process.execPath, [path.join(repoRoot, "packages", "knowledge", "src", "cli", script), ...args], {
      cwd: testRoot,
      encoding: "utf8"
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? String(error) };
  }
}

async function readPage(relPath = pagePath) {
  const text = await readFile(path.join(testRoot, relPath), "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return { data: YAML.parse(match[1]), body: match[2] };
}

async function readRemoved() {
  return JSON.parse(await readFile(path.join(testRoot, "contracts", "removed-documents.json"), "utf8"));
}

let testRoot;

test("content lifecycle: retire, archive, restore, purge", async (t) => {
  testRoot = await mkdtemp(path.join(tmpdir(), "cswiki-lifecycle-"));
  try {
    await mkdir(path.join(testRoot, "wiki", "meta"), { recursive: true });
    await mkdir(path.join(testRoot, "catalog"), { recursive: true });
    await mkdir(path.join(testRoot, "contracts"), { recursive: true });
    await mkdir(path.join(testRoot, "archive", "removed"), { recursive: true });
    await writeFile(path.join(testRoot, pagePath), frontmatter, "utf8");
    await writeFile(path.join(testRoot, "wiki", "meta", "Lifecycle Target.md"), targetPage, "utf8");
    await writeFile(path.join(testRoot, "catalog", "reviews.yml"), "reviewed: []\n", "utf8");
    await writeFile(path.join(testRoot, "catalog", "traces.json"), '{"schema_version":1,"traces":[]}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "routes.json"), '{"schema_version":1,"pages":[],"redirects":{}}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "removed-documents.json"), '{"schema_version":1,"removed":[]}\n', "utf8");

    const seed = await run("seed.mjs");
    assert.equal(seed.code, 0, seed.stderr);

    await t.test("public document cannot be deleted before retirement", async () => {
      const result = await run("delete.mjs", ["--id", pageId, "--mode", "archive"]);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /retire first/);
      assert.equal((await readPage()).data.publication_visibility, "public");
    });

    await t.test("retire writes tombstone metadata", async () => {
      const result = await run("retire.mjs", ["--id", pageId, "--mode", "tombstone", "--note", "test"]);
      assert.equal(result.code, 0, result.stderr);
      const page = await readPage();
      assert.equal(page.data.publication_visibility, "unlisted");
      assert.equal(page.data.retirement.mode, "tombstone");
    });

    await t.test("archive delete keeps URL, preserves original relations, and passes sync --check", async () => {
      const result = await run("delete.mjs", ["--id", pageId, "--mode", "archive", "--reason", "test"]);
      assert.equal(result.code, 0, result.stderr);
      const page = await readPage();
      assert.equal(page.data.publication_visibility, "unlisted");
      assert.equal(page.data.relations, undefined);
      assert.match(page.body, /은퇴/);
      const syncCheck = await run("sync.mjs", ["--check"]);
      assert.equal(syncCheck.code, 0, syncCheck.stderr);
      assert.match(await readFile(path.join(testRoot, "archive", "removed", `${pageId}.md`), "utf8"), /lifecycle test body/);
      const removed = await readRemoved();
      assert.equal(removed.removed.length, 1);
      assert.equal(removed.removed[0].mode, "archive");
      assert.equal(removed.removed[0].source_path, pagePath);
    });

    await t.test("restore replaces tombstone, restores relations, and removes removal entry", async () => {
      const result = await run("restore.mjs", ["--id", pageId, "--public"]);
      assert.equal(result.code, 0, result.stderr);
      const page = await readPage();
      assert.equal(page.data.publication_visibility, "public");
      assert.equal(page.data.retirement, undefined);
      assert.equal(page.data.relations.length, 1);
      assert.match(page.body, /lifecycle test body/);
      assert.equal((await readRemoved()).removed.length, 0);
      const syncCheck = await run("sync.mjs", ["--check"]);
      assert.equal(syncCheck.code, 0, syncCheck.stderr);
    });

    await t.test("trace reference blocks retirement", async () => {
      await writeFile(path.join(testRoot, "catalog", "traces.json"), JSON.stringify({
        schema_version: 1,
        traces: [{ id: "test-trace", title: "Test", steps: [{ document: pageKey }] }]
      }), "utf8");
      const result = await run("retire.mjs", ["--id", pageId, "--mode", "tombstone"]);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /referenced by traces/);
      await writeFile(path.join(testRoot, "catalog", "traces.json"), '{"schema_version":1,"traces":[]}\n', "utf8");
    });

    await t.test("purge requires --break-url and removes page", async () => {
      const retire = await run("retire.mjs", ["--id", pageId, "--mode", "tombstone"]);
      assert.equal(retire.code, 0, retire.stderr);
      const withoutBreak = await run("delete.mjs", ["--id", pageId, "--mode", "purge"]);
      assert.notEqual(withoutBreak.code, 0);
      assert.match(withoutBreak.stderr, /break-url/);
      const purged = await run("delete.mjs", ["--id", pageId, "--mode", "purge", "--break-url"]);
      assert.equal(purged.code, 0, purged.stderr);
      await assert.rejects(readFile(path.join(testRoot, pagePath), "utf8"));
      const removed = await readRemoved();
      assert.equal(removed.removed.length, 1);
      assert.equal(removed.removed[0].mode, "purge");
      assert.equal(removed.removed[0].break_url, true);
    });
  } finally {
    await rm(testRoot, { recursive: true, force: true });
  }
});
