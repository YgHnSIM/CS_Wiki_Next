import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { exists, toPosixRelative, writeJson } from "../shared/fs.mjs";
import { checkTextEndings } from "../parse/frontmatter.mjs";
import { extractWikiLinkTargets } from "../parse/links.mjs";
import { loadWorkspace, resolvePage } from "../registry/workspace.mjs";
import { validatePageSchemas } from "./schema.mjs";
import { validateLifecycle } from "./lifecycle.mjs";

export async function lintWiki(root = process.cwd(), { semantic = false, write = true } = {}) {
  const workspace = await loadWorkspace(root);
  const { pageById, pageByKey } = workspace;
  const issues = [];
  const add = (code, file, message) => issues.push({ code, path: file, message });

  const schemaResult = await validatePageSchemas(root, { pages: workspace.pages });
  for (const err of schemaResult.errors) {
    add("schema.frontmatter", err.relative, `${err.path ? `${err.path} ` : ""}${err.error}`.trim());
  }

  for (const page of workspace.pages) {
    const relative = toPosixRelative(root, page.filePath);
    const raw = await readFile(page.filePath, "utf8");
    const endings = checkTextEndings(raw);
    if (endings.hasCrlf) add("eol.crlf", relative, "LF line endings are required");
    if (!endings.hasFinalNewline) add("eol.final_newline", relative, "final newline is required");

    for (const item of page.data.access || []) {
      if (item.kind === "url") {
        try {
          new URL(item.url);
        } catch {
          add("raw.url", relative, `invalid URL: ${item.url}`);
        }
        continue;
      }
      if (!item.path || !item.sha256 || !Number.isInteger(item.bytes)) {
        add("raw.fields", relative, "local access needs path, sha256, bytes");
        continue;
      }
      if (!(await exists(path.join(root, item.path)))) {
        add("raw.missing", relative, `missing ${item.path}`);
        continue;
      }
      const buffer = await readFile(path.join(root, item.path));
      const digest = createHash("sha256").update(buffer).digest("hex");
      if (digest !== item.sha256) add("raw.sha256", relative, `${item.path} sha256 mismatch`);
      if (buffer.length !== item.bytes) add("raw.bytes", relative, `${item.path} byte length mismatch`);
    }

    for (const relation of page.data.relations || []) {
      const target = pageByKey.get(relation.target);
      if (!target) add("relation.target", relative, `missing target ${relation.target}`);
      for (const evidence of relation.evidence || []) {
        const source = pageById.get(evidence.source);
        if (!source) add("evidence.source", relative, `missing evidence source ${evidence.source}`);
        else if (!["source", "reference"].includes(source.kind)) add("evidence.kind", relative, `${evidence.source} is ${source.kind}`);
      }
    }

    for (const target of extractWikiLinkTargets(page.body)) {
      if (!resolvePage(workspace, target)) {
        add("link.internal", relative, `missing link target ${target}`);
      }
    }
  }

  for (const lifecycleIssue of validateLifecycle(root, workspace)) {
    add(lifecycleIssue.code, lifecycleIssue.path, lifecycleIssue.message);
  }

  const indexText = await readFile(path.join(root, "wiki", "index.md"), "utf8");
  const linked = new Set();
  for (const target of extractWikiLinkTargets(indexText)) {
    const page = resolvePage(workspace, target);
    if (page) linked.add(page.id);
  }
  const excluded = new Set(["meta-index", "meta-log", "meta-gaps"]);
  for (const page of workspace.pages) {
    if (page.data.publication_visibility !== "public" || excluded.has(page.id)) continue;
    if (!linked.has(page.id)) add("index.missing", "wiki/index.md", `missing ${page.id}`);
  }

  const logText = await readFile(path.join(root, "wiki", "log.md"), "utf8");
  const listedLogs = [...logText.matchAll(/^- \[[^\]]+\]\((logs\/[^)]+)\)$/gm)].map((match) => match[1]);
  const logFiles = (await readdir(path.join(root, "wiki", "logs"))).filter((name) => name.endsWith(".md")).sort().map((name) => `logs/${name}`);
  const listedSet = new Set(listedLogs);
  const fileSet = new Set(logFiles);
  for (const file of listedLogs) if (!fileSet.has(file)) add("log.missing_file", "wiki/log.md", file);
  for (const file of logFiles) if (!listedSet.has(file)) add("log.missing_entry", "wiki/log.md", file);
  if (listedLogs.length === logFiles.length && listedLogs.some((file, index) => file !== logFiles[index])) {
    add("log.order", "wiki/log.md", "log order differs from filenames");
  }

  const gapsText = await readFile(path.join(root, "wiki", "gaps.md"), "utf8");
  if (!gapsText.includes("<!-- wiki:gaps:start -->") || !gapsText.includes("<!-- wiki:gaps:end -->")) {
    add("gaps.marker", "wiki/gaps.md", "missing generated markers");
  }
  const gapKeys = new Set();
  const openGapKeys = [];
  for (const match of gapsText.matchAll(/^### \[(open|closed)\] ([^\n]+)$/gm)) {
    const status = match[1];
    const key = match[2].trim();
    if (gapKeys.has(key)) add("gaps.duplicate", "wiki/gaps.md", key);
    gapKeys.add(key);
    if (status === "open") openGapKeys.push(key);
  }

  const report = {
    generated_at: new Date().toISOString(),
    pages: workspace.pages.length,
    issues,
    semantic: [],
    errors: issues.length
  };

  if (semantic) {
    const incoming = new Map();
    const docTouchCount = new Map();
    for (const page of workspace.pages) {
      const touchedNodes = new Set();
      for (const relation of page.data.relations || []) {
        incoming.set(relation.target, (incoming.get(relation.target) || 0) + 1);
        touchedNodes.add(relation.target);
        if (relation.subject) touchedNodes.add(relation.subject);
      }
      touchedNodes.add(page.key);
      for (const nodeKey of touchedNodes) {
        docTouchCount.set(nodeKey, (docTouchCount.get(nodeKey) || 0) + 1);
      }
    }

    for (const page of workspace.pages) {
      if (page.data.publication_visibility !== "public" || page.kind === "meta") continue;
      if (!incoming.get(page.key)) {
        report.semantic.push({ code: "semantic.orphan", path: page.id, message: `${page.title} has no incoming relation` });
      }
      if (page.data.status === "stale") {
        const line = indexText.split("\n").find((item) => item.includes(`[[${page.title}]]`));
        if (!line || !line.startsWith("- [Stale]")) {
          report.semantic.push({ code: "semantic.stale_index", path: page.id, message: "stale page is not marked [Stale] in index" });
        }
      }
      if (page.data.status === "disputed") {
        report.semantic.push({ code: "semantic.disputed", path: page.id, message: "disputed page needs a reader-facing conflict note" });
      }
      if (page.data.page_role === "synthesis") {
        const referencedPages = new Map();
        for (const sourceId of page.data.evidence_ids || []) {
          const sourcePage = pageById.get(sourceId);
          if (sourcePage) referencedPages.set(sourcePage.id, sourcePage);
        }
        for (const relation of page.data.relations || []) {
          const targetPage = pageByKey.get(relation.target);
          if (targetPage) referencedPages.set(targetPage.id, targetPage);
        }
        for (const linkTarget of extractWikiLinkTargets(page.body)) {
          const linkedPage = resolvePage(workspace, linkTarget);
          if (linkedPage && linkedPage.id !== page.id) referencedPages.set(linkedPage.id, linkedPage);
        }
        for (const refPage of referencedPages.values()) {
          if (refPage.data.retirement || refPage.data.status === "stale" || refPage.data.status === "disputed") {
            report.semantic.push({
              code: "semantic.synthesis_drift",
              path: page.id,
              message: `synthesis references ${refPage.id} (${refPage.data.retirement ? "retired" : refPage.data.status})`
            });
          } else if (refPage.data.updated && page.data.updated && refPage.data.updated > page.data.updated) {
            report.semantic.push({
              code: "semantic.synthesis_drift",
              path: page.id,
              message: `synthesis predates update on ${refPage.id} (${refPage.data.updated} > ${page.data.updated})`
            });
          }
        }
      }
    }

    for (const node of workspace.nodes) {
      if (node.status === "auto" && (docTouchCount.get(node.key) || 0) >= 3) {
        report.semantic.push({
          code: "semantic.provisional_node",
          path: node.page_id || node.key,
          message: `auto node ${node.key} is used across ${docTouchCount.get(node.key)} documents; consider reviewing`
        });
      }
    }

    for (const gapKey of openGapKeys) {
      const resolved = resolvePage(workspace, gapKey);
      if (resolved && resolved.data.publication_visibility === "public" && !resolved.data.retirement) {
        report.semantic.push({
          code: "semantic.resolved_gap",
          path: "wiki/gaps.md",
          message: `open gap '${gapKey}' matches active public page ${resolved.id}`
        });
      }
    }
  }

  if (write) {
    await writeJson(path.join(root, "output", "wiki-lint.json"), report);
  }

  return report;
}
