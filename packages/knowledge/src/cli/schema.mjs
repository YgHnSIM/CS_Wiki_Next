import { validatePageSchemas } from "../validate/schema.mjs";

const { count, errors } = await validatePageSchemas(process.cwd());

console.log(`Page schema: ${count} pages, ${errors.length} errors`);
for (const error of errors.slice(0, 40)) {
  console.error(`${error.file}${error.path ? ` ${error.path}` : ""}: ${error.error}`);
}
if (errors.length) process.exitCode = 1;
