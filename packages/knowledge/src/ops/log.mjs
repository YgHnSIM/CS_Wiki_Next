import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { exists } from "../shared/fs.mjs";
import { today } from "../shared/today.mjs";

export async function appendLog(root, { action = "update", title, summary = null, body = null, filenameSlug = null, dryRun = false }) {
  const date = today();
  const logsDir = path.join(root, "wiki", "logs");
  const logPath = path.join(root, "wiki", "log.md");
  await mkdir(logsDir, { recursive: true });
  const files = (await readdir(logsDir)).filter((name) => name.endsWith(".md")).sort();
  const prefix = `log-${date}-`;
  const numbers = files
    .filter((name) => name.startsWith(prefix))
    .map((name) => Number(name.match(/-([0-9]{3})-/)?.[1] || 0));
  const number = String(Math.max(0, ...numbers) + 1).padStart(3, "0");
  const slug = filenameSlug || title.toLowerCase().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60) || "entry";
  const filename = `${prefix}${number}-${slug}.md`;
  const resolvedSummary = (summary || `${title} 기록.`).slice(0, 180);
  const resolvedBody = body || `## 변경\n\n- ${title}\n`;
  const entry = `---
schema_version: 3
id: log-${date}-${number}
kind: meta
title: ${JSON.stringify(`${date} ${action} | ${title}`)}
aliases: []
summary: ${JSON.stringify(resolvedSummary)}
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: ${date}
updated: ${date}
evidence_ids: []
capability_layers: []
---

${resolvedBody.trimEnd()}
`;

  if (!dryRun) {
    await writeFile(path.join(logsDir, filename), entry, "utf8");
    if (await exists(logPath)) {
      const text = await readFile(logPath, "utf8");
      const marker = "\n## 출처";
      const at = text.indexOf(marker);
      const line = `- [${date} ${action} | ${title}](logs/${filename})`;
      const next = at >= 0
        ? text.slice(0, at).trimEnd() + "\n" + line + "\n\n" + text.slice(at + 1)
        : text.trimEnd() + "\n" + line + "\n";
      await writeFile(logPath, next, "utf8");
    }
  }

  return filename;
}

export async function checkOrSyncLogs(root = process.cwd(), { write = false } = {}) {
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

  if (write && missingEntries.length) {
    const additions = missingEntries.map((file) => {
      const name = file.replace(/^logs\//, "").replace(/\.md$/, "");
      return `- [${name}](${file})`;
    }).join("\n");
    const marker = "\n## 출처";
    const at = text.indexOf(marker);
    const next = at >= 0
      ? text.slice(0, at).trimEnd() + "\n" + additions + "\n\n" + text.slice(at + 1)
      : text.trimEnd() + "\n" + additions + "\n";
    await writeFile(logPath, next, "utf8");
  }

  const hasErrors = Boolean(
    missingFiles.length || missingEntries.length || (listed.length === files.length && orderMismatch.length)
  );

  return { listed, files, missingFiles, missingEntries, orderMismatch, hasErrors };
}
