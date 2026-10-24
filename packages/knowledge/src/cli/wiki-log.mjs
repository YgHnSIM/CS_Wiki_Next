import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { today } from "./today.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const write = args.includes("--write");
const add = args.includes("--add");
const dryRun = args.includes("--dry-run");
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const logPath = path.join(root, "wiki", "log.md");
const logsDir = path.join(root, "wiki", "logs");
const text = await readFile(logPath, "utf8");
const listed = [...text.matchAll(/^- \[[^\]]+\]\((logs\/[^)]+)\)$/gm)].map((match) => match[1]);
const files = (await readdir(logsDir)).filter((name) => name.endsWith(".md")).sort().map((name) => `logs/${name}`);
const listedSet = new Set(listed);
const fileSet = new Set(files);
const missingFiles = listed.filter((file) => !fileSet.has(file));
const missingEntries = files.filter((file) => !listedSet.has(file));
const orderMismatch = listed.filter((file, index) => files[index] !== file);

if (add) {
  const action = value("action") || "update";
  const title = value("title");
  if (!title) {
    console.error("--add requires --title");
    process.exit(1);
  }
  const date = today();
  const prefix = `log-${date}-`;
  const numbers = files
    .filter((file) => file.startsWith(`logs/${prefix}`))
    .map((file) => Number(file.match(/-([0-9]{3})-/)?.[1] || 0));
  const number = String(Math.max(0, ...numbers) + 1).padStart(3, "0");
  const slug = title.toLowerCase().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60) || "entry";
  const filename = `${prefix}${number}-${slug}.md`;
  const body = value("body") || `## 변경\n\n- ${title}\n`;
  const entry = `---
schema_version: 3
id: log-${date}-${number}
kind: meta
title: "${date} ${action} | ${title.replaceAll('"', '\\"')}"
aliases: []
summary: ${JSON.stringify(title.slice(0, 180))}
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: ${date}
updated: ${date}
evidence_ids: []
capability_layers: []
---

${body}
`;
  if (!dryRun) {
    await mkdir(logsDir, { recursive: true });
    await writeFile(path.join(logsDir, filename), entry, "utf8");
    const marker = "\n## 출처";
    const at = text.indexOf(marker);
    const line = `- [${action} | ${title}](logs/${filename})`;
    const next = at >= 0 ? text.slice(0, at).trimEnd() + "\n" + line + "\n\n" + text.slice(at + 1) : text.trimEnd() + "\n" + line + "\n";
    await writeFile(logPath, next, "utf8");
  }
  console.log(`${dryRun ? "dry-run: " : ""}added logs/${filename}`);
  process.exit(0);
}

console.log(`Wiki log: ${listed.length} listed, ${files.length} files`);
for (const file of missingFiles) console.log(`- listed but missing: ${file}`);
for (const file of missingEntries) console.log(`- file not listed: ${file}`);
if (listed.length === files.length && orderMismatch.length) {
  console.log(`- order mismatch: ${orderMismatch.length} entries`);
}
if (write && missingEntries.length) {
  const additions = missingEntries.map((file) => {
    const name = file.replace(/^logs\//, "").replace(/\.md$/, "");
    return `- [${name}](${file})`;
  }).join("\n");
  const marker = "\n## 출처";
  const at = text.indexOf(marker);
  const next = at >= 0 ? text.slice(0, at).trimEnd() + "\n" + additions + "\n\n" + text.slice(at + 1) : text.trimEnd() + "\n" + additions + "\n";
  await writeFile(logPath, next, "utf8");
}
if (missingFiles.length || missingEntries.length || (listed.length === files.length && orderMismatch.length)) {
  process.exitCode = 1;
}
