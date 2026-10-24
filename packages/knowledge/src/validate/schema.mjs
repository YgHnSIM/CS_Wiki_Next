import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { exists, readJson, toPosixRelative, walkWikiMarkdownFiles } from "../shared/fs.mjs";
import { parseFrontmatter } from "../parse/frontmatter.mjs";

const FALLBACK_SCHEMA_PATH = fileURLToPath(new URL("../../../../schema/wiki-page.schema.json", import.meta.url));

export async function createPageSchemaValidator(root = process.cwd()) {
  const localSchemaPath = path.join(root, "schema", "wiki-page.schema.json");
  const schemaPath = (await exists(localSchemaPath)) ? localSchemaPath : FALLBACK_SCHEMA_PATH;
  const schema = await readJson(schemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

export async function validatePageSchemas(root = process.cwd(), { pages = null } = {}) {
  const validate = await createPageSchemaValidator(root);
  const errors = [];
  let count = 0;

  if (Array.isArray(pages)) {
    for (const page of pages) {
      const relative = toPosixRelative(root, page.filePath);
      if (!validate(page.data)) {
        for (const error of validate.errors || []) {
          errors.push({
            file: page.filePath,
            relative,
            path: error.instancePath || "",
            error: error.message || "schema validation failed"
          });
        }
      }
      count += 1;
    }
    return { count, errors };
  }

  for (const file of await walkWikiMarkdownFiles(root)) {
    const relative = toPosixRelative(root, file);
    const text = await readFile(file, "utf8");
    let data;
    try {
      data = parseFrontmatter(text, file);
    } catch {
      errors.push({ file, relative, path: "", error: "missing frontmatter" });
      continue;
    }
    if (!validate(data)) {
      for (const error of validate.errors || []) {
        errors.push({
          file,
          relative,
          path: error.instancePath || "",
          error: error.message || "schema validation failed"
        });
      }
    }
    count += 1;
  }

  return { count, errors };
}
