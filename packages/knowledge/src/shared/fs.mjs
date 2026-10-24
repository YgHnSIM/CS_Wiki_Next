import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function toPosixRelative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function walkWikiMarkdownFiles(root) {
  const wikiRoot = path.join(root, "wiki");
  if (!(await exists(wikiRoot))) return [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = toPosixRelative(root, absolute);
      if (entry.isDirectory()) {
        if (relative === "wiki/logs") continue;
        files.push(...await walk(absolute));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(absolute);
      }
    }
    return files;
  }

  return (await walk(wikiRoot)).sort();
}
