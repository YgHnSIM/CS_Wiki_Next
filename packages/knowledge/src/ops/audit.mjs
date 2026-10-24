import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeJson } from "../shared/fs.mjs";
import { extractWikiLinkTargets } from "../parse/links.mjs";
import { loadWorkspace, resolvePage } from "../registry/workspace.mjs";

function normalize(value) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

async function rawText(root, sourcePage) {
  for (const item of sourcePage.data.access || []) {
    if (!item.path) continue;
    if (/\.(pdf|png|jpe?g|gif|webp|zip|mp4)$/i.test(item.path)) return null;
    try {
      return await readFile(path.join(root, item.path), "utf8");
    } catch {
      return null;
    }
  }
  return null;
}

export async function auditWikiPage(root = process.cwd(), { id, key, write = true } = {}) {
  if (!id && !key) {
    throw new Error("Usage: npm run wiki:audit -- (--id <id> | --key <key>) [--json] [--strict]");
  }
  const workspace = await loadWorkspace(root);
  const page = id ? workspace.pageById.get(id) : workspace.pageByKey.get(key);
  if (!page) {
    throw new Error(`page not found: ${id || key}`);
  }
  const { pageById, pageByKey } = workspace;

  const evidence = [];
  const sourceIds = new Set(page.data.evidence_ids || []);
  for (const relation of page.data.relations || []) {
    for (const item of relation.evidence || []) sourceIds.add(item.source);
  }
  const sourceTexts = new Map();
  for (const sourceId of sourceIds) {
    const source = pageById.get(sourceId);
    if (!source) continue;
    sourceTexts.set(sourceId, await rawText(root, source));
  }
  if (!sourceTexts.has(page.id)) {
    const ownText = await rawText(root, page);
    if (ownText) sourceTexts.set(page.id, ownText);
  }
  for (const relation of page.data.relations || []) {
    for (const item of relation.evidence || []) {
      const text = sourceTexts.get(item.source);
      evidence.push({
        source: item.source,
        locator: item.locator || null,
        quote: item.quote || null,
        found: item.quote && text ? normalize(text).includes(normalize(item.quote)) : null
      });
    }
  }

  const body = page.body;
  const claims = [];
  const claimPattern = /(?:["“][^"”]{8,}["”])|(?:\b(?:1[0-9]{3}|20[0-9]{2})\b)|(?:\b\d+(?:[.,]\d+)?\s?(?:%|ms|s|GB|MB|KB|TB|W|kW|MHz|GHz|Hz|K|M|B)\b)/gi;
  for (const match of body.matchAll(claimPattern)) {
    const text = match[0].replace(/^["“]|["”]$/g, "").trim();
    if (!text || claims.some((claim) => claim.text === text)) continue;
    const found = [...sourceTexts.entries()]
      .filter(([, sourceText]) => sourceText)
      .filter(([, sourceText]) =>
        normalize(sourceText).includes(normalize(text))
        || normalize(sourceText).replaceAll(",", "").includes(normalize(text).replaceAll(",", ""))
      )
      .map(([source]) => source);
    claims.push({ text, found: found.length > 0, sources: found });
    if (claims.length >= 50) break;
  }

  // Check synthesis drift if this page is a synthesis
  const synthesisDrift = [];
  if (page.data.page_role === "synthesis") {
    const referencedPages = new Map();
    for (const sourceId of sourceIds) {
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
        synthesisDrift.push({
          id: refPage.id,
          reason: refPage.data.retirement ? "retired" : refPage.data.status
        });
      } else if (refPage.data.updated && page.data.updated && refPage.data.updated > page.data.updated) {
        synthesisDrift.push({
          id: refPage.id,
          reason: `updated (${refPage.data.updated} > ${page.data.updated})`
        });
      }
    }
  }

  const unverified = claims.filter((claim) => !claim.found).length
    + evidence.filter((item) => item.found === false).length
    + synthesisDrift.length;
  const report = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    id: page.id,
    key: page.key,
    title: page.title,
    sources: [...sourceIds],
    evidence,
    claims,
    ...(synthesisDrift.length ? { synthesis_drift: synthesisDrift } : {}),
    unverified
  };

  if (write) {
    await writeJson(path.join(root, "output", "audit", `${page.id}.json`), report);
  }

  return report;
}
