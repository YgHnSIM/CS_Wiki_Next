import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { exists } from "../shared/fs.mjs";
import { extractWikiLinkTargets } from "../parse/links.mjs";
import { loadWorkspace, resolvePage } from "../registry/workspace.mjs";

const EXCLUDED_INDEX_IDS = new Set(["meta-index", "meta-log", "meta-gaps"]);

const SECTION_BY_KIND = {
  source: "소스",
  reference: "참고 자료",
  concept: "개념",
  entity: "개체",
  analysis: "분석",
  meta: "메타"
};

export function formatIndexEntry(page) {
  let prefix = "-";
  if (page.data.status === "stale") prefix = "- [Stale]";
  else if (page.data.page_role === "synthesis") prefix = "- [Synthesis]";
  return `${prefix} [[${page.title}]] — ${page.data.summary || "(no summary)"}`;
}

function addLineToSection(body, heading, line) {
  const start = body.indexOf(`## ${heading}`);
  if (start < 0) {
    const marker = "\n## 출처";
    const at = body.indexOf(marker);
    const block = `\n## ${heading}\n\n${line}\n`;
    return at >= 0 ? body.slice(0, at) + block + body.slice(at) : body.trimEnd() + block + "\n";
  }
  const next = body.indexOf("\n## ", start + 1);
  const end = next >= 0 ? next : body.length;
  return `${body.slice(0, end).trimEnd()}\n${line}\n${body.slice(end)}`;
}

export async function checkOrSyncWikiIndex(root = process.cwd(), { write = false, workspace: existingWorkspace = null } = {}) {
  const indexPath = path.join(root, "wiki", "index.md");
  if (!(await exists(indexPath))) {
    return { publicPages: [], missing: [], updated: false };
  }
  const workspace = existingWorkspace || await loadWorkspace(root);
  const text = await readFile(indexPath, "utf8");
  const linked = new Set();

  for (const target of extractWikiLinkTargets(text)) {
    const page = resolvePage(workspace, target);
    if (page) linked.add(page.id);
  }

  const publicPages = workspace.pages.filter(
    (page) => page.data.publication_visibility === "public" && !EXCLUDED_INDEX_IDS.has(page.id)
  );
  const missing = publicPages.filter((page) => !linked.has(page.id));

  let output = text;
  if (write) {
    // 1. Update status prefixes ([Stale], [Synthesis]) or remove retired/unlisted bullet lines
    const lines = output.split("\n");
    const updatedLines = [];
    for (const line of lines) {
      if (line.startsWith("- ")) {
        const targets = extractWikiLinkTargets(line);
        if (targets.length === 1) {
          const resolved = resolvePage(workspace, targets[0]);
          if (resolved && !EXCLUDED_INDEX_IDS.has(resolved.id)) {
            if (resolved.data.publication_visibility !== "public" || resolved.data.retirement) {
              continue; // Remove retired/unlisted page from public index
            }
            if (resolved.data.status === "stale" && !line.startsWith("- [Stale]")) {
              updatedLines.push(line.replace(/^- (?:\[[^\]]+\]\s*)?/, "- [Stale] "));
              continue;
            }
          }
        }
      }
      updatedLines.push(line);
    }
    output = updatedLines.join("\n");

    // 2. Append any missing public pages
    for (const page of missing) {
      output = addLineToSection(output, SECTION_BY_KIND[page.kind] || "메타", formatIndexEntry(page));
    }
    if (output !== text) {
      await writeFile(indexPath, output, "utf8");
    }
  }

  return { publicPages, missing, updated: output !== text };
}
