import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
let testRoot;

const page = `---
schema_version: 3
id: meta-tool-test
key: document:tool-test
kind: meta
title: Tool Test
aliases:
  - Tool Test
summary: wiki tool integration test page with enough summary length.
domains: []
publication_visibility: public
graph_visibility: public
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 본문

Tool test body.
`;

const special = (id, title, body) => `---
schema_version: 3
id: ${id}
kind: meta
title: ${title}
aliases: []
summary: ${title} special page with enough summary length.
domains: []
publication_visibility: public
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

${body}
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

test("wiki tools: index, log, gaps, lint", async (t) => {
  testRoot = await mkdtemp(path.join(tmpdir(), "cswiki-tools-"));
  try {
    await mkdir(path.join(testRoot, "wiki", "meta"), { recursive: true });
    await mkdir(path.join(testRoot, "wiki", "logs"), { recursive: true });
    await mkdir(path.join(testRoot, "catalog"), { recursive: true });
    await mkdir(path.join(testRoot, "contracts"), { recursive: true });
    await mkdir(path.join(testRoot, "output"), { recursive: true });
    await writeFile(path.join(testRoot, "wiki", "meta", "Tool Test.md"), page, "utf8");
    await writeFile(path.join(testRoot, "wiki", "index.md"), special("meta-index", "Index", "# Index\n\n- [[Tool Test]]\n"), "utf8");
    await writeFile(path.join(testRoot, "wiki", "gaps.md"), special("meta-gaps", "Gaps", "<!-- wiki:gaps:start -->\n# Gaps\n\n## wanted\n\n## question\n\n## closed\n<!-- wiki:gaps:end -->\n"), "utf8");
    await writeFile(path.join(testRoot, "wiki", "logs", "log-2026-10-25-001-test.md"), special("log-2026-10-25-001", "Test log", "## 변경\n\n- test\n"), "utf8");
    await writeFile(path.join(testRoot, "wiki", "log.md"), special("meta-log", "Log", "<!-- wiki:generated log -->\n# Log\n\n- [2026-10-25 update | Test log](logs/log-2026-10-25-001-test.md)\n"), "utf8");
    await writeFile(path.join(testRoot, "catalog", "reviews.yml"), "reviewed: []\n", "utf8");
    await writeFile(path.join(testRoot, "catalog", "traces.json"), '{"schema_version":1,"traces":[]}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "routes.json"), '{"schema_version":1,"pages":[],"redirects":{}}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "removed-documents.json"), '{"schema_version":1,"removed":[]}\n', "utf8");

    const seed = await run("seed.mjs");
    assert.equal(seed.code, 0, seed.stderr);

    await t.test("index check and write", async () => {
      const check = await run("wiki-index.mjs");
      assert.equal(check.code, 0, check.stdout + check.stderr);
    });

    await t.test("log check and add", async () => {
      const before = await run("wiki-log.mjs");
      assert.equal(before.code, 0, before.stdout + before.stderr);
      const add = await run("wiki-log.mjs", ["--add", "--action", "lint", "--title", "Tool test log"]);
      assert.equal(add.code, 0, add.stdout + add.stderr);
      const after = await run("wiki-log.mjs");
      assert.equal(after.code, 0, after.stdout + after.stderr);
    });

    await t.test("gaps add and close", async () => {
      const add = await run("wiki-gaps.mjs", ["--add", "--kind", "wanted", "--key", "concept:tool-gap", "--evidence", "test"]);
      assert.equal(add.code, 0, add.stdout + add.stderr);
      const closed = await run("wiki-gaps.mjs", ["--close", "--key", "concept:tool-gap", "--resolution", "test"]);
      assert.equal(closed.code, 0, closed.stdout + closed.stderr);
      const text = await readFile(path.join(testRoot, "wiki", "gaps.md"), "utf8");
      assert.match(text, /\[closed\] concept:tool-gap/);
    });

    await t.test("lint passes after generated tools", async () => {
      const result = await run("wiki-lint.mjs");
      assert.equal(result.code, 0, result.stdout + result.stderr);
      assert.match(result.stdout, /0 issues/);
    });
  } finally {
    await rm(testRoot, { recursive: true, force: true });
  }
});
