import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { readJson, toPosixRelative, writeJson } from "../shared/fs.mjs";
import { today } from "../shared/today.mjs";
import { parseDocument, parseFrontmatter, renderPage } from "../parse/frontmatter.mjs";
import { extractWikiLinkTargets } from "../parse/links.mjs";
import {
  relationStart,
  relationEnd,
  renderRelations,
  replaceRelationSection,
  updateBody
} from "../parse/relations.mjs";
import { loadWorkspace, resolvePage, extractRelations } from "../registry/workspace.mjs";
import { traceReferences } from "../registry/traces.mjs";

const KIND_DIRS = {
  concept: "concepts",
  entity: "entities",
  analysis: "analyses",
  source: "sources",
  reference: "references",
  meta: "meta"
};

export async function retireDocument(root = process.cwd(), { id, key, mode, to, note, dryRun = false } = {}) {
  if ((!id && !key) || !["tombstone", "redirect"].includes(mode)) {
    throw new Error("Usage: npm run content:retire -- (--id <id> | --key <key>) --mode <tombstone|redirect> [--to <id|key>] [--note <text>] [--dry-run]");
  }
  if (mode === "redirect" && !to) {
    throw new Error("redirect mode requires --to <id|key>");
  }

  const workspace = await loadWorkspace(root);
  const page = id ? workspace.pageById.get(id) : workspace.pageByKey.get(key);
  if (!page) {
    throw new Error(`page not found: ${id || key}`);
  }
  if (page.data.retirement) {
    throw new Error(`already retired: ${page.id}`);
  }

  const traceRefs = await traceReferences(root, page.key);
  if (traceRefs.length) {
    throw new Error(`cannot retire ${page.id}; referenced by traces: ${traceRefs.join(", ")}\nupdate catalog/traces.json first`);
  }

  const supersedingDependents = workspace.pages.filter(
    (other) => other.id !== page.id && (other.data.superseded_by === page.id || other.data.retirement?.superseded_by === page.id)
  );
  if (supersedingDependents.length) {
    throw new Error(`cannot retire ${page.id}; referenced as superseded_by target by: ${supersedingDependents.map((item) => item.id).join(", ")}`);
  }

  let target = null;
  if (mode === "redirect") {
    target = workspace.pageById.get(to) || workspace.pageByKey.get(to);
    if (!target) {
      throw new Error(`redirect target not found: ${to}`);
    }
    if (target.id === page.id) {
      throw new Error("redirect target must differ from the retired page");
    }
    if (target.data.publication_visibility !== "public" || target.data.retirement) {
      throw new Error(`redirect target must be a public, non-retired page: ${target.id}`);
    }
  }

  const todayDate = today();
  page.data.retirement = {
    mode,
    retired_at: todayDate,
    ...(target ? { superseded_by: target.id } : {}),
    ...(note ? { note } : {})
  };
  page.data.publication_visibility = "unlisted";
  page.data.updated = todayDate;

  if (!dryRun) {
    await writeFile(page.filePath, renderPage(page.data, page.body), "utf8");
  }

  return { page, target, mode, dryRun };
}

export async function deleteDocument(root = process.cwd(), { id, key, mode = "archive", reason = "", breakUrl = false, dryRun = false } = {}) {
  if ((!id && !key) || !["archive", "purge"].includes(mode)) {
    throw new Error("Usage: npm run content:delete -- (--id <id> | --key <key>) [--mode archive|purge] [--reason <text>] [--break-url] [--dry-run]");
  }
  if (mode === "purge" && !breakUrl) {
    throw new Error("purge requires --break-url");
  }

  const workspace = await loadWorkspace(root);
  const page = id ? workspace.pageById.get(id) : workspace.pageByKey.get(key);
  if (!page) {
    throw new Error(`page not found: ${id || key}`);
  }
  if (page.data.publication_visibility === "public" && !page.data.retirement) {
    throw new Error(`cannot delete public page ${page.id}; run content:retire first`);
  }

  const traceRefs = await traceReferences(root, page.key);
  if (traceRefs.length) {
    throw new Error(`cannot delete ${page.id}; referenced by traces: ${traceRefs.join(", ")}\nupdate catalog/traces.json first`);
  }

  const incoming = workspace.pages.filter((other) =>
    other.id !== page.id && (other.data.relations || []).some((relation) => relation.target === page.key)
  );
  const incomingLinks = workspace.pages.filter((other) => {
    if (other.id === page.id) return false;
    for (const targetName of extractWikiLinkTargets(other.body, { includeAssets: true })) {
      const target = resolvePage(workspace, targetName);
      if (target?.id === page.id) return true;
    }
    return false;
  });
  const incomingSupersedes = workspace.pages.filter(
    (other) => other.id !== page.id && (other.data.superseded_by === page.id || other.data.retirement?.superseded_by === page.id)
  );

  if (mode === "purge" && incoming.length) {
    throw new Error(`cannot purge ${page.id}; incoming relations: ${incoming.map((item) => item.id).join(", ")}\narchive mode keeps the URL and graph node; purge requires removing those relations first`);
  }
  if (mode === "purge" && incomingLinks.length) {
    throw new Error(`cannot purge ${page.id}; incoming wiki links: ${incomingLinks.map((item) => item.id).join(", ")}\nupdate incoming links first, or use archive mode`);
  }
  if (mode === "purge" && incomingSupersedes.length) {
    throw new Error(`cannot purge ${page.id}; referenced by superseded_by on: ${incomingSupersedes.map((item) => item.id).join(", ")}`);
  }

  const removedFile = path.join(root, "contracts", "removed-documents.json");
  const removedCatalog = await readJson(removedFile);
  const existing = (removedCatalog.removed || []).find((entry) => entry.id === page.id);
  if (existing?.mode === "purge") {
    throw new Error(`already purged: ${page.id}`);
  }
  if (existing?.mode === "archive" && mode === "archive") {
    throw new Error(`already archived: ${page.id}`);
  }

  const todayDate = today();
  const archivePath = path.join(root, "archive", "removed", `${page.id}.md`);
  const archiveText = await readFile(page.filePath, "utf8");
  const entry = {
    id: page.id,
    key: page.key,
    title: page.title,
    kind: page.kind,
    mode,
    removed_at: todayDate,
    source_path: toPosixRelative(root, page.filePath),
    replaced_by: page.data.retirement?.superseded_by || null,
    reason,
    break_url: mode === "purge"
  };

  if (!dryRun) {
    await mkdir(path.dirname(archivePath), { recursive: true });
    await writeFile(archivePath, archiveText, "utf8");
    removedCatalog.removed = [
      ...(removedCatalog.removed || []).filter((item) => item.id !== page.id),
      entry
    ].sort((a, b) => a.id.localeCompare(b.id));
    await writeJson(removedFile, removedCatalog);
  }

  if (mode === "archive") {
    page.data.retirement = {
      ...(page.data.retirement || {}),
      mode: "tombstone",
      retired_at: todayDate,
      ...(reason ? { note: reason } : {})
    };
    page.data.publication_visibility = "unlisted";
    page.data.graph_visibility = "hidden";
    // Clear relations on the tombstone so knowledge:sync does not fail on missing ## 관계 section
    delete page.data.relations;
    page.data.updated = todayDate;
    const body = [
      "## 은퇴",
      "",
      `이 문서는 ${todayDate}에 삭제되었습니다. 원문은 \`archive/removed/${page.id}.md\`에 보존되어 있습니다.`,
      reason ? `\n삭제 사유: ${reason}` : ""
    ].join("\n");
    if (!dryRun) await writeFile(page.filePath, renderPage(page.data, body), "utf8");
  } else if (!dryRun) {
    await rm(page.filePath, { force: true });
  }

  return { page, mode, reason, dryRun };
}

export async function restoreDocument(root = process.cwd(), { id, makePublic = false, dryRun = false } = {}) {
  if (!id) {
    throw new Error("Usage: npm run content:restore -- --id <id> [--public] [--dry-run]");
  }
  const removedFile = path.join(root, "contracts", "removed-documents.json");
  const removedCatalog = await readJson(removedFile);
  const entry = (removedCatalog.removed || []).find((item) => item.id === id);
  if (!entry) {
    throw new Error(`removed entry not found: ${id}`);
  }
  if (entry.mode !== "archive") {
    throw new Error(`only archive entries can be restored; ${id} is ${entry.mode}`);
  }
  const archivePath = path.join(root, "archive", "removed", `${id}.md`);
  let text;
  try {
    text = await readFile(archivePath, "utf8");
  } catch {
    throw new Error(`archive file not found: archive/removed/${id}.md`);
  }
  let parsed;
  try {
    parsed = parseDocument(text, archivePath);
  } catch {
    throw new Error(`archive file has no frontmatter: ${id}`);
  }
  const { data, body } = parsed;
  const derivedPath = `wiki/${KIND_DIRS[data.kind] || "meta"}/${String(data.title || id).replace(/[\\/:*?"<>|]/g, "-")}.md`;
  const sourcePath = entry.source_path || derivedPath;
  if (!sourcePath.startsWith("wiki/")) {
    throw new Error(`invalid source path: ${sourcePath}`);
  }
  const absoluteSource = path.join(root, sourcePath);
  let replacedTombstone = false;
  try {
    const existingText = await readFile(absoluteSource, "utf8");
    const existing = parseFrontmatter(existingText, absoluteSource);
    if (!existing || existing.id !== id || !existing.retirement) {
      throw new Error(`restore target already exists and is not this tombstone: ${sourcePath}`);
    }
    replacedTombstone = true;
  } catch (error) {
    if (error.message?.startsWith("restore target already exists")) throw error;
    /* target is absent; normal restore */
  }

  delete data.retirement;
  delete data.superseded_by;
  data.publication_visibility = makePublic ? "public" : "unlisted";
  if (makePublic) data.graph_visibility = "public";
  data.updated = today();

  if (!dryRun) {
    await mkdir(path.dirname(absoluteSource), { recursive: true });
    await writeFile(absoluteSource, renderPage(data, body), "utf8");
    await rm(archivePath, { force: true });
    removedCatalog.removed = (removedCatalog.removed || []).filter((item) => item.id !== id);
    await writeJson(removedFile, removedCatalog);
  }

  return { id, sourcePath, makePublic, replacedTombstone, dryRun };
}

export async function syncRelationBlocks(root = process.cwd(), { check = false } = {}) {
  const workspace = await loadWorkspace(root);
  const todayDate = today();
  const differences = [];

  for (const page of workspace.pages) {
    const relations = Array.isArray(page.data.relations) ? page.data.relations : null;
    if (!relations) continue;
    const expected = renderRelations(relations, workspace);
    const start = page.body.indexOf(relationStart);
    const end = page.body.indexOf(relationEnd);
    const actual = start >= 0 && end > start
      ? page.body.slice(start, end + relationEnd.length)
      : "";
    if (actual.trim() !== expected.trim()) {
      differences.push(page.id);
      if (!check) {
        const body = updateBody(page.body, relations, workspace);
        const data = { ...page.data, updated: page.data.updated === todayDate ? page.data.updated : todayDate };
        await writeFile(page.filePath, renderPage(data, body), "utf8");
      }
    }
  }

  return { differences, check };
}

export async function migrateRelationsBatch(root = process.cwd(), { kind = "concept", limit = 24, dryRun = false } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`invalid --limit: ${limit}`);
  const workspace = await loadWorkspace(root);
  const todayDate = today();

  const candidates = workspace.pages
    .filter((page) => page.kind === kind && !page.data.relations && /^##\s+관계\s*$/m.test(page.body))
    .sort((a, b) => a.filePath.localeCompare(b.filePath))
    .slice(0, limit);

  const report = { generatedAt: new Date().toISOString(), kind, limit, pages: [], relations: 0 };
  for (const page of candidates) {
    const relations = extractRelations(page, workspace);
    if (!relations.length) continue;
    const { schema_version, id, ...rest } = page.data;
    const data = {
      schema_version,
      id,
      key: page.key,
      ...rest,
      updated: page.data.updated === todayDate ? page.data.updated : todayDate,
      relations
    };
    const body = replaceRelationSection(page.body, relations, workspace);
    const output = renderPage(data, body);
    report.pages.push({ id: page.id, key: page.key, relations: relations.length, path: page.filePath });
    report.relations += relations.length;
    if (!dryRun) await writeFile(page.filePath, output, "utf8");
  }

  await writeJson(path.join(root, "output", "migration-batch.json"), report);
  return report;
}
