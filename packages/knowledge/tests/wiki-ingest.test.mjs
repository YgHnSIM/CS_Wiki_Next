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

const conceptPage = `---
schema_version: 3
id: concept-ingest-test
key: concept:ingest-test
kind: concept
title: Ingest Test
aliases:
  - Ingest Test
summary: ingest integration test concept page with enough summary length.
domains: []
publication_visibility: public
graph_visibility: public
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 본문

test concept.
`;

test("wiki ingest creates raw source, page, proposal, log, and supports --apply integration", async () => {
  testRoot = await mkdtemp(path.join(tmpdir(), "cswiki-ingest-"));
  try {
    await mkdir(path.join(testRoot, "wiki", "concepts"), { recursive: true });
    await mkdir(path.join(testRoot, "wiki", "sources"), { recursive: true });
    await mkdir(path.join(testRoot, "wiki", "logs"), { recursive: true });
    await mkdir(path.join(testRoot, "catalog"), { recursive: true });
    await mkdir(path.join(testRoot, "contracts"), { recursive: true });
    await mkdir(path.join(testRoot, "output"), { recursive: true });
    await mkdir(path.join(testRoot, "raw"), { recursive: true });
    await mkdir(path.join(testRoot, "schema"), { recursive: true });
    await copyFile(path.join(repoRoot, "schema", "wiki-page.schema.json"), path.join(testRoot, "schema", "wiki-page.schema.json"));
    await writeFile(path.join(testRoot, "source.txt"), "Ingest Test source body\n", "utf8");
    await writeFile(path.join(testRoot, "wiki", "concepts", "Ingest Test.md"), conceptPage, "utf8");
    await writeFile(path.join(testRoot, "wiki", "index.md"), `---
schema_version: 3
id: meta-index
kind: meta
title: Index
aliases: []
summary: index fixture page with enough summary length for validation.
domains: []
publication_visibility: public
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

# Index

## 개념

- [[Ingest Test]] — ingest integration test concept page with enough summary length.
`, "utf8");
    await writeFile(path.join(testRoot, "wiki", "gaps.md"), `---
schema_version: 3
id: meta-gaps
kind: meta
title: Gaps
aliases: []
summary: gaps fixture page with enough summary length for validation.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

<!-- wiki:gaps:start -->
# Gaps

## wanted

### [open] concept:ingest-gap
- kind: wanted
- evidence: Ingest Source
- demand: 1

## question

## closed
<!-- wiki:gaps:end -->
`, "utf8");
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

    const result = await run("wiki-ingest.mjs", ["--source", "source.txt", "--id", "src-999", "--title", "Ingest Source", "--doi", "10.1145/360670.360675", "--year", "1960"]);
    assert.equal(result.code, 0, result.stderr);
    const pageText = await readFile(path.join(testRoot, "wiki", "sources", "Ingest Source.md"), "utf8");
    assert.match(pageText, /id: src-999/);
    assert.match(pageText, /kind: source/);
    assert.match(pageText, /origin: local/);
    assert.match(pageText, /raw\/ingested\//);
    assert.match(pageText, /10\.1145\/360670\.360675/);
    const proposalPath = path.join(testRoot, "output", "ingest", "src-999.json");
    const proposal = JSON.parse(await readFile(proposalPath, "utf8"));
    assert.equal(proposal.source, "src-999");
    assert.ok(proposal.candidates.some((c) => c.id === "concept-ingest-test"));
    assert.ok(proposal.matched_gaps.some((g) => g.key === "concept:ingest-gap"));
    const log = await readFile(path.join(testRoot, "wiki", "log.md"), "utf8");
    assert.match(log, /ingest \| Ingest Source/);
    const reseed = await run("seed.mjs");
    assert.equal(reseed.code, 0, reseed.stderr);
    const duplicate = await run("wiki-ingest.mjs", ["--source", "source.txt", "--id", "src-998", "--title", "Duplicate Source"]);
    assert.notEqual(duplicate.code, 0);
    assert.match(duplicate.stderr, /already ingested/);

    // Populate integration block and run --apply
    proposal.integration = {
      create_pages: [
        {
          id: "concept-ingest-gap",
          key: "concept:ingest-gap",
          kind: "concept",
          title: "Ingest Gap Concept",
          summary: "Newly created concept from ingest apply with enough summary length.",
          evidence_ids: ["src-999"]
        }
      ],
      update_pages: [
        {
          id: "concept-ingest-test",
          add_evidence_ids: ["src-999"],
          add_relations: [
            {
              predicate: "enables",
              target: "concept:ingest-gap",
              note: "Ingest test enables ingest gap concept.",
              evidence: [{ source: "src-999", locator: "p. 1", quote: "Ingest Test source body" }]
            }
          ]
        }
      ],
      close_gaps: ["concept:ingest-gap"]
    };
    await writeFile(proposalPath, JSON.stringify(proposal, null, 2) + "\n", "utf8");

    const applied = await run("wiki-ingest.mjs", ["--apply", "output/ingest/src-999.json"]);
    assert.equal(applied.code, 0, applied.stderr);
    const updatedConcept = await readFile(path.join(testRoot, "wiki", "concepts", "Ingest Test.md"), "utf8");
    assert.match(updatedConcept, /src-999/);
    assert.match(updatedConcept, /knowledge:relations:start/);
    assert.match(updatedConcept, /\[\[Ingest Gap Concept\]\]/);
    const gapsAfter = await readFile(path.join(testRoot, "wiki", "gaps.md"), "utf8");
    assert.match(gapsAfter, /\[closed\] concept:ingest-gap/);

    const lint = await run("wiki-lint.mjs");
    assert.equal(lint.code, 0, lint.stdout + lint.stderr);
  } finally {
    await rm(testRoot, { recursive: true, force: true });
  }
});
