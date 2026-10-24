import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
let testRoot;

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

const page = `---
schema_version: 3
id: meta-ingest-test
key: document:ingest-test
kind: meta
title: Ingest Test
aliases: []
summary: ingest integration test page with enough summary length.
domains: []
publication_visibility: public
graph_visibility: public
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 본문

test.
`;

test("wiki ingest creates raw source, page, proposal, and log", async () => {
  testRoot = await mkdtemp(path.join(tmpdir(), "cswiki-ingest-"));
  try {
    await mkdir(path.join(testRoot, "wiki", "meta"), { recursive: true });
    await mkdir(path.join(testRoot, "wiki", "sources"), { recursive: true });
    await mkdir(path.join(testRoot, "wiki", "logs"), { recursive: true });
    await mkdir(path.join(testRoot, "catalog"), { recursive: true });
    await mkdir(path.join(testRoot, "contracts"), { recursive: true });
    await mkdir(path.join(testRoot, "output"), { recursive: true });
    await mkdir(path.join(testRoot, "raw"), { recursive: true });
    await mkdir(path.join(testRoot, "schema"), { recursive: true });
    await copyFile(path.join(repoRoot, "schema", "wiki-page.schema.json"), path.join(testRoot, "schema", "wiki-page.schema.json"));
    await writeFile(path.join(testRoot, "source.txt"), "source body\n", "utf8");
    await writeFile(path.join(testRoot, "wiki", "meta", "Ingest Test.md"), page, "utf8");
    await writeFile(path.join(testRoot, "wiki", "log.md"), `---
schema_version: 3
id: meta-log
kind: meta
title: Log
aliases: []
summary: log fixture page with enough summary length.
domains: []
publication_visibility: public
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

# Log

## 출처
`, "utf8");
    await writeFile(path.join(testRoot, "catalog", "reviews.yml"), "reviewed: []\n", "utf8");
    await writeFile(path.join(testRoot, "catalog", "traces.json"), '{"schema_version":1,"traces":[]}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "routes.json"), '{"schema_version":1,"pages":[],"redirects":{}}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "removed-documents.json"), '{"schema_version":1,"removed":[]}\n', "utf8");
    const seed = await run("seed.mjs");
    assert.equal(seed.code, 0, seed.stderr);

    const result = await run("wiki-ingest.mjs", ["--source", "source.txt", "--id", "src-999", "--title", "Ingest Source"]);
    assert.equal(result.code, 0, result.stderr);
    const pageText = await readFile(path.join(testRoot, "wiki", "sources", "Ingest Source.md"), "utf8");
    assert.match(pageText, /id: src-999/);
    assert.match(pageText, /kind: source/);
    assert.match(pageText, /origin: local/);
    assert.match(pageText, /raw\/ingested\//);
    const proposal = JSON.parse(await readFile(path.join(testRoot, "output", "ingest", "src-999.json"), "utf8"));
    assert.equal(proposal.source, "src-999");
    assert.ok(proposal.candidates.length >= 0);
    const log = await readFile(path.join(testRoot, "wiki", "log.md"), "utf8");
    assert.match(log, /ingest \| Ingest Source/);
    const reseed = await run("seed.mjs");
    assert.equal(reseed.code, 0, reseed.stderr);
    const duplicate = await run("wiki-ingest.mjs", ["--source", "source.txt", "--id", "src-998", "--title", "Duplicate Source"]);
    assert.notEqual(duplicate.code, 0);
    assert.match(duplicate.stderr, /already ingested/);
    const schema = await run("schema.mjs");
    assert.equal(schema.code, 0, schema.stderr);
    assert.match(schema.stdout, /src-999|0 errors/);
  } finally {
    await rm(testRoot, { recursive: true, force: true });
  }
});
