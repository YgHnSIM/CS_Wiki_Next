import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { today } from "../cli/today.mjs";

export async function appendLog(root, { action, title, body }) {
  const date = today();
  const logsDir = path.join(root, "wiki", "logs");
  await mkdir(logsDir, { recursive: true });
  const files = (await readdir(logsDir)).filter((name) => name.endsWith(".md")).sort();
  const prefix = `log-${date}-`;
  const numbers = files.filter((name) => name.startsWith(prefix)).map((name) => Number(name.match(/-([0-9]{3})-/)?.[1] || 0));
  const number = String(Math.max(0, ...numbers) + 1).padStart(3, "0");
  const slug = title.toLowerCase().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60) || "entry";
  const filename = `${prefix}${number}-${slug}.md`;
  await writeFile(path.join(logsDir, filename), `---
schema_version: 3
id: log-${date}-${number}
kind: meta
title: ${JSON.stringify(`${date} ${action} | ${title}`)}
aliases: []
summary: ${JSON.stringify(`${title} 기록.`)}
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: ${date}
updated: ${date}
evidence_ids: []
capability_layers: []
---

${body}
`, "utf8");
  const logPath = path.join(root, "wiki", "log.md");
  const text = await readFile(logPath, "utf8");
  const marker = "\n## 출처";
  const at = text.indexOf(marker);
  const line = `- [${date} ${action} | ${title}](logs/${filename})`;
  const next = at >= 0
    ? text.slice(0, at).trimEnd() + "\n" + line + "\n\n" + text.slice(at + 1)
    : text.trimEnd() + "\n" + line + "\n";
  await writeFile(logPath, next, "utf8");
  return filename;
}
