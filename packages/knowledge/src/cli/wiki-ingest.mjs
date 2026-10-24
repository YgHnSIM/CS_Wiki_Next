import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadWorkspace } from "../compile/relations.mjs";
import { today } from "./today.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const sourceArg = value("source");
const id = value("id");
const dryRun = args.includes("--dry-run");
if (!sourceArg || !id) {
  console.error("Usage: npm run wiki:ingest -- --source <url|path> --id <src-###|ref-###> [--title ...] [--kind source|reference] [--summary ...] [--domain ...] [--url ...] [--dry-run]");
  process.exit(1);
}
if (!/^(src|ref)-[0-9]{3,}$/.test(id)) {
  console.error("source id must look like src-151 or ref-151");
  process.exit(1);
}
const isUrl = /^https?:\/\//i.test(sourceArg);
const kind = value("kind") || (id.startsWith("ref-") ? "reference" : "source");
if (!["source", "reference"].includes(kind)) {
  console.error("--kind must be source or reference");
  process.exit(1);
}
const title = value("title") || (isUrl ? decodeURIComponent(new URL(sourceArg).pathname.split("/").filter(Boolean).pop() || id) : path.basename(sourceArg, path.extname(sourceArg)));
const visibility = value("visibility") || "public";
const summary = value("summary") || `${title}의 원문과 인용 위치를 확인하기 위해 수집한 ${kind === "source" ? "1차 소스" : "참고 자료"}.`;
const date = today();
const workspace = await loadWorkspace(root);
if (workspace.pages.some((page) => page.id === id)) {
  console.error(`document id already exists: ${id}`);
  process.exit(1);
}

const sourceUrl = isUrl ? sourceArg : value("url");
const normalizeUrl = (value) => {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return String(value || "").replace(/\/$/, "").toLowerCase();
  }
};
const doiOf = (value) => String(value || "").match(/10\.\d{4,9}\/[^\s]+/i)?.[0]?.replace(/[.,;]+$/, "").toLowerCase() || null;
const sourceDoi = doiOf(sourceUrl || sourceArg);
let localBuffer = null;
let localSha = null;
let localExt = null;
if (!isUrl) {
  const absolute = path.resolve(root, sourceArg);
  localBuffer = await readFile(absolute);
  localExt = path.extname(absolute).toLowerCase();
  localSha = createHash("sha256").update(localBuffer).digest("hex");
}
const duplicate = workspace.pages
  .filter((page) => ["source", "reference"].includes(page.kind))
  .find((page) => {
    const urls = (page.data.access || []).filter((item) => item.url).map((item) => normalizeUrl(item.url));
    if (sourceUrl && urls.includes(normalizeUrl(sourceUrl))) return true;
    if (sourceDoi) {
      const dois = (page.data.works?.primary || [])
        .flatMap((work) => work.identifiers || [])
        .filter((identifier) => identifier.type === "doi")
        .map((identifier) => String(identifier.value).toLowerCase());
      if (dois.includes(sourceDoi)) return true;
    }
    if (localSha) {
      const hashes = (page.data.access || []).filter((item) => item.sha256).map((item) => item.sha256);
      if (hashes.includes(localSha)) return true;
    }
    return false;
  });
if (duplicate) {
  console.error(`source already ingested as ${duplicate.id} (${duplicate.title}); update that source instead`);
  process.exit(1);
}

const mediaTypes = {
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".html": "text/html",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};
const citations = value("citation") || title;
const access = [];
let origin;
let rawPath = null;
let sourceBytes = null;
if (isUrl) {
  origin = "external";
  access.push({ kind: "url", role: "canonical", url: sourceArg, retrieved: date });
} else {
  origin = "local";
  const absolute = path.resolve(root, sourceArg);
  const ext = localExt;
  const sha256 = localSha;
  const insideRaw = path.relative(root, absolute).startsWith(`raw${path.sep}`) || path.relative(root, absolute).startsWith("raw/");
  if (insideRaw) {
    rawPath = path.relative(root, absolute).split(path.sep).join("/");
  } else {
    const slug = title.toLowerCase().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 70) || id;
    rawPath = `raw/ingested/${date}-${slug}${ext}`;
    if (!dryRun) {
      await mkdir(path.dirname(path.join(root, rawPath)), { recursive: true });
      await copyFile(absolute, path.join(root, rawPath));
    }
  }
  sourceBytes = localBuffer.length;
  access.push({
    kind: "local",
    role: "preservation",
    path: rawPath,
    sha256,
    media_type: mediaTypes[ext] || "application/octet-stream",
    bytes: sourceBytes,
    retrieved: date
  });
  const url = value("url");
  if (url) access.push({ kind: "url", role: "original", url, retrieved: date });
}

const pagePath = path.join(root, "wiki", "sources", `${title.replace(/[\\/:*?"<>|]/g, "-")}.md`);
const frontmatter = `---
schema_version: 3
id: ${id}
key: ${kind === "source" ? "source" : "source"}:${id}
kind: ${kind}
title: ${JSON.stringify(title)}
aliases:
  - ${JSON.stringify(title)}
summary: ${JSON.stringify(summary.slice(0, 200))}
domains: ${value("domain") ? `\n  - ${value("domain")}` : "[]"}
publication_visibility: ${visibility}
graph_visibility: public
status: current
page_role: knowledge
created: ${date}
updated: ${date}
evidence_ids: []
capability_layers: []
origin: ${origin}
works:
  primary:
    - citation: ${JSON.stringify(citations)}
      genre: other
      identifiers: []
      edition: null
  supporting: []
access:
${access.map((item) => `  - kind: ${item.kind}\n    role: ${item.role}\n${item.path ? `    path: ${JSON.stringify(item.path)}\n    sha256: ${JSON.stringify(item.sha256)}\n    media_type: ${JSON.stringify(item.media_type)}\n    bytes: ${item.bytes}\n` : ""}${item.retrieved ? `    retrieved: ${item.retrieved}\n` : ""}${item.url ? `    url: ${JSON.stringify(item.url)}\n` : ""}`).join("")}
---

## 요약

${summary}

## 인용 위치

- 아직 정리하지 않음.
`;

const candidates = workspace.pages
  .map((page) => {
    const haystack = `${page.title} ${(page.data.aliases || []).join(" ")}`.toLowerCase();
    const tokens = title.toLowerCase().split(/[\s-]+/).filter((token) => token.length > 1);
    const score = tokens.filter((token) => haystack.includes(token)).length;
    return { id: page.id, key: page.key, title: page.title, kind: page.kind, score };
  })
  .filter((candidate) => candidate.score > 0)
  .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ko"))
  .slice(0, 5);
const proposal = {
  schema_version: 1,
  source: id,
  title,
  disposition: candidates.length ? "update-or-new" : "new",
  raw: rawPath,
  candidates,
  notes: "Source skeleton only. Review candidates, write relations/evidence, then run knowledge:seed and wiki:lint."
};

if (!dryRun) {
  await mkdir(path.dirname(pagePath), { recursive: true });
  await writeFile(pagePath, frontmatter, "utf8");
  await mkdir(path.join(root, "output", "ingest"), { recursive: true });
  await writeFile(path.join(root, "output", "ingest", `${id}.json`), JSON.stringify(proposal, null, 2) + "\n", "utf8");
  const logs = (await readdir(path.join(root, "wiki", "logs"))).filter((name) => name.endsWith(".md")).sort();
  const prefix = `log-${date}-`;
  const numbers = logs.filter((name) => name.startsWith(prefix)).map((name) => Number(name.match(/-([0-9]{3})-/)?.[1] || 0));
  const number = String(Math.max(0, ...numbers) + 1).padStart(3, "0");
  const logName = `${prefix}${number}-ingest-${id}.md`;
  const logBody = `## 수집

- source: ${isUrl ? sourceArg : rawPath}
- id: ${id}
- proposal: output/ingest/${id}.json
`;
  await writeFile(path.join(root, "wiki", "logs", logName), `---
schema_version: 3
id: log-${date}-${number}
kind: meta
title: "${date} ingest | ${title.replaceAll('"', '\\"')}"
aliases: []
summary: ${JSON.stringify(`${title} 소스를 수집한 기록.`)}
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: ${date}
updated: ${date}
evidence_ids: []
capability_layers: []
---

${logBody}
`, "utf8");
  const logPath = path.join(root, "wiki", "log.md");
  const logText = await readFile(logPath, "utf8");
  const marker = "\n## 출처";
  const at = logText.indexOf(marker);
  const line = `- [${date} ingest | ${title}](logs/${logName})`;
  const next = at >= 0 ? logText.slice(0, at).trimEnd() + "\n" + line + "\n\n" + logText.slice(at + 1) : logText.trimEnd() + "\n" + line + "\n";
  await writeFile(logPath, next, "utf8");
}

console.log(`${dryRun ? "dry-run: " : ""}ingested ${id} -> ${rawPath || sourceArg}`);
console.log(`Page: ${path.relative(root, pagePath)}`);
console.log(`Proposal: output/ingest/${id}.json`);
console.log("Next: write relations/evidence, then npm run knowledge:seed && npm run wiki:lint");
