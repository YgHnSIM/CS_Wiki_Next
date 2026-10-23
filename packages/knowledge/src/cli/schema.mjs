import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const schema = JSON.parse(await readFile(path.join(root, "schema", "wiki-page.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (relative === "wiki/logs") continue;
      files.push(...await walk(absolute));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolute);
    }
  }
  return files;
}

const errors = [];
let count = 0;
for (const file of (await walk(path.join(root, "wiki"))).sort()) {
  const text = await readFile(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    errors.push({ file, error: "missing frontmatter" });
    continue;
  }
  const data = YAML.parse(match[1]);
  if (!validate(data)) {
    for (const error of validate.errors || []) {
      errors.push({ file, path: error.instancePath, error: error.message });
    }
  }
  count += 1;
}

console.log(`Page schema: ${count} pages, ${errors.length} errors`);
for (const error of errors.slice(0, 40)) console.error(`${error.file}${error.path ? ` ${error.path}` : ""}: ${error.error}`);
if (errors.length) process.exitCode = 1;
