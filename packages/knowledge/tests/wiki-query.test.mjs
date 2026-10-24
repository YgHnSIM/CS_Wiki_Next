import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
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

const special = (id, title, body) => `---
schema_version: 3
id: ${id}
kind: meta
title: ${title}
aliases: []
summary: ${title} fixture page with enough summary length.
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

test("wiki query returns context and saves synthesis", async () => {
  testRoot = await mkdtemp(path.join(tmpdir(), "cswiki-query-"));
  try {
    await mkdir(path.join(testRoot, "wiki", "concepts"), { recursive: true });
    await mkdir(path.join(testRoot, "wiki", "logs"), { recursive: true });
    await mkdir(path.join(testRoot, "wiki", "syntheses"), { recursive: true });
    await mkdir(path.join(testRoot, "catalog"), { recursive: true });
    await mkdir(path.join(testRoot, "contracts"), { recursive: true });
    await mkdir(path.join(testRoot, "output"), { recursive: true });
    await mkdir(path.join(testRoot, "schema"), { recursive: true });
    await copyFile(path.join(repoRoot, "schema", "wiki-page.schema.json"), path.join(testRoot, "schema", "wiki-page.schema.json"));
    await writeFile(path.join(testRoot, "wiki", "concepts", "Query Target.md"), `---
schema_version: 3
id: concept-query-target
key: concept:query-target
kind: concept
title: Query Target
aliases:
  - Query Target
summary: query target page with enough summary length for the schema.
domains: []
publication_visibility: public
graph_visibility: public
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers:
  - computability
---

## 본문

query target body.
`, "utf8");
    await writeFile(path.join(testRoot, "wiki", "index.md"), special("meta-index", "Index", "# Index\n\n- [[Query Target]]\n"), "utf8");
    await writeFile(path.join(testRoot, "wiki", "gaps.md"), special("meta-gaps", "Gaps", "<!-- wiki:gaps:start -->\n# Gaps\n\n## wanted\n\n## question\n\n## closed\n<!-- wiki:gaps:end -->\n"), "utf8");
    await writeFile(path.join(testRoot, "wiki", "log.md"), special("meta-log", "Log", "# Log\n\n## 출처\n"), "utf8");
    await writeFile(path.join(testRoot, "catalog", "reviews.yml"), "reviewed: []\n", "utf8");
    await writeFile(path.join(testRoot, "catalog", "traces.json"), '{"schema_version":1,"traces":[]}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "routes.json"), '{"schema_version":1,"pages":[],"redirects":{}}\n', "utf8");
    await writeFile(path.join(testRoot, "contracts", "removed-documents.json"), '{"schema_version":1,"removed":[]}\n', "utf8");
    const seed = await run("seed.mjs");
    assert.equal(seed.code, 0, seed.stderr);

    const query = await run("wiki-query.mjs", ["Query Target", "--limit", "1"]);
    assert.equal(query.code, 0, query.stderr);
    assert.match(query.stdout, /Query Target/);
    const saved = await run("wiki-query.mjs", ["Query Target", "--limit", "1", "--save"]);
    assert.equal(saved.code, 0, saved.stderr);
    const names = await readdir(path.join(testRoot, "wiki", "syntheses"));
    const name = names.find((item) => item.endsWith(".md"));
    assert.ok(name);
    const files = await readFile(path.join(testRoot, "wiki", "syntheses", name), "utf8");
    assert.match(files, /page_role: synthesis/);
    const reseed = await run("seed.mjs");
    assert.equal(reseed.code, 0, reseed.stderr);
    const schema = await run("schema.mjs");
    assert.equal(schema.code, 0, schema.stderr);
  } finally {
    await rm(testRoot, { recursive: true, force: true });
  }
});
