import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

test("wiki audit verifies body literals against raw access", async () => {
  testRoot = await mkdtemp(path.join(tmpdir(), "cswiki-audit-"));
  try {
    await mkdir(path.join(testRoot, "wiki", "sources"), { recursive: true });
    await mkdir(path.join(testRoot, "wiki", "logs"), { recursive: true });
    await mkdir(path.join(testRoot, "catalog"), { recursive: true });
    await mkdir(path.join(testRoot, "contracts"), { recursive: true });
    await mkdir(path.join(testRoot, "output"), { recursive: true });
    await mkdir(path.join(testRoot, "raw"), { recursive: true });
    const raw = "Cache memory was described in 1965 by Wilkes.\n";
    await writeFile(path.join(testRoot, "raw", "evidence.txt"), raw, "utf8");
    const digest = createHash("sha256").update(raw).digest("hex");
    const source = `---
schema_version: 3
id: src-901
key: source:src-901
kind: source
title: Audit Source
aliases: []
summary: audit fixture source with enough summary length.
domains: []
publication_visibility: public
graph_visibility: public
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
origin: local
works:
  primary:
    - citation: Audit Source
      genre: other
      identifiers: []
      edition: null
  supporting: []
access:
  - kind: local
    role: preservation
    path: raw/evidence.txt
    sha256: ${digest}
    media_type: text/plain
    bytes: ${Buffer.byteLength(raw)}
    retrieved: 2026-10-25
---

## 본문

Cache memory was described in 1965 by Wilkes.
`;
    await writeFile(path.join(testRoot, "wiki", "sources", "Audit Source.md"), source, "utf8");
    await writeFile(path.join(testRoot, "catalog", "reviews.yml"), "reviewed: []\n", "utf8");
    await writeFile(path.join(testRoot, "catalog", "traces.json"), '{"schema_version":1,"traces":[]}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "routes.json"), '{"schema_version":1,"pages":[],"redirects":{}}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "removed-documents.json"), '{"schema_version":1,"removed":[]}\n', "utf8");
    const seed = await run("seed.mjs");
    assert.equal(seed.code, 0, seed.stderr);

    const audit = await run("wiki-audit.mjs", ["--id", "src-901", "--strict"]);
    assert.equal(audit.code, 0, audit.stderr);
    assert.match(audit.stdout, /unverified: 0/);
    const report = JSON.parse(await readFile(path.join(testRoot, "output", "audit", "src-901.json"), "utf8"));
    assert.equal(report.claims.some((claim) => claim.text === "1965" && claim.found), true);
  } finally {
    await rm(testRoot, { recursive: true, force: true });
  }
});
