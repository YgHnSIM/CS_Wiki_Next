import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { exists, readJson, toPosixRelative, writeJson } from "../shared/fs.mjs";
import { today } from "../shared/today.mjs";
import { renderPage } from "../parse/frontmatter.mjs";
import { updateBody } from "../parse/relations.mjs";
import { loadWorkspace, resolvePage } from "../registry/workspace.mjs";
import { seedRegistry } from "../registry/seed.mjs";
import { rankSearch } from "../search/rank.mjs";
import { createPageSchemaValidator } from "../validate/schema.mjs";
import { appendLog } from "./log.mjs";
import { checkOrSyncWikiIndex } from "./index-doc.mjs";
import { closeWikiGap, parseWikiGaps } from "./gaps.mjs";

const MEDIA_TYPES = {
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".html": "text/html",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const KIND_DIRS = {
  concept: "concepts",
  entity: "entities",
  analysis: "analyses",
  source: "sources",
  reference: "references",
  meta: "meta"
};

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return String(value || "").replace(/\/$/, "").toLowerCase();
  }
}

function extractDoi(value) {
  return String(value || "").match(/10\.\d{4,9}\/[^\s"<>]+/i)?.[0]?.replace(/[.,;]+$/, "").toLowerCase() || null;
}

export async function ingestSource(root = process.cwd(), {
  sourceArg,
  id,
  title: rawTitle,
  kind: rawKind,
  visibility = "public",
  summary: rawSummary,
  domain,
  url: extraUrl,
  citation: rawCitation,
  doi: explicitDoi,
  year: rawYear,
  genre: rawGenre,
  dryRun = false
} = {}) {
  if (!sourceArg || !id) {
    throw new Error("Usage: npm run wiki:ingest -- --source <url|path> --id <src-###|ref-###> [--title ...] [--kind source|reference] [--summary ...] [--domain ...] [--url ...] [--doi ...] [--year YYYY] [--genre ...] [--dry-run]");
  }
  if (!/^(src|ref)-[0-9]{3,}$/.test(id)) {
    throw new Error("source id must look like src-151 or ref-151");
  }
  const isUrl = /^https?:\/\//i.test(sourceArg);
  const kind = rawKind || (id.startsWith("ref-") ? "reference" : "source");
  if (!["source", "reference"].includes(kind)) {
    throw new Error("--kind must be source or reference");
  }
  const title = rawTitle || (isUrl
    ? decodeURIComponent(new URL(sourceArg).pathname.split("/").filter(Boolean).pop() || id)
    : path.basename(sourceArg, path.extname(sourceArg)));
  const summary = rawSummary || `${title}의 원문과 인용 위치를 확인하기 위해 수집한 ${kind === "source" ? "1차 소스" : "참고 자료"}.`;
  const date = today();
  const workspace = await loadWorkspace(root);
  if (workspace.pageById.has(id)) {
    throw new Error(`document id already exists: ${id}`);
  }

  const sourceUrl = isUrl ? sourceArg : extraUrl;
  const sourceDoi = extractDoi(explicitDoi || sourceUrl || sourceArg);
  let localBuffer = null;
  let localSha = null;
  let localExt = null;
  let localTextPreview = "";
  if (!isUrl) {
    const absolute = path.resolve(root, sourceArg);
    localBuffer = await readFile(absolute);
    localExt = path.extname(absolute).toLowerCase();
    localSha = createHash("sha256").update(localBuffer).digest("hex");
    if ([".md", ".txt", ".html"].includes(localExt)) {
      localTextPreview = localBuffer.toString("utf8").slice(0, 4000);
    }
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
    throw new Error(`source already ingested as ${duplicate.id} (${duplicate.title}); update that source instead`);
  }

  const citations = rawCitation || title;
  const genre = rawGenre || "other";
  const identifiers = sourceDoi ? [{ type: "doi", value: sourceDoi }] : [];
  const publicationYear = rawYear !== undefined && rawYear !== null && rawYear !== "" ? Number.parseInt(String(rawYear), 10) : null;
  const access = [];
  let origin;
  let rawPath = null;

  if (isUrl) {
    origin = "external";
    access.push({ kind: "url", role: "canonical", url: sourceArg, retrieved: date });
  } else {
    origin = "local";
    const absolute = path.resolve(root, sourceArg);
    const relativeToRoot = toPosixRelative(root, absolute);
    const insideRaw = relativeToRoot.startsWith("raw/");
    if (insideRaw) {
      rawPath = relativeToRoot;
    } else {
      const slug = title.toLowerCase().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 70) || id;
      rawPath = `raw/ingested/${date}-${slug}${localExt}`;
      if (!dryRun) {
        await mkdir(path.dirname(path.join(root, rawPath)), { recursive: true });
        await copyFile(absolute, path.join(root, rawPath));
      }
    }
    access.push({
      kind: "local",
      role: "preservation",
      path: rawPath,
      sha256: localSha,
      media_type: MEDIA_TYPES[localExt] || "application/octet-stream",
      bytes: localBuffer.length,
      retrieved: date
    });
    if (extraUrl) access.push({ kind: "url", role: "original", url: extraUrl, retrieved: date });
  }

  const pagePath = path.join(root, "wiki", "sources", `${title.replace(/[\\/:*?"<>|]/g, "-")}.md`);
  const data = {
    schema_version: 3,
    id,
    key: `source:${id}`,
    kind,
    title,
    aliases: [title],
    summary: summary.slice(0, 200),
    domains: domain ? [domain] : [],
    publication_visibility: visibility,
    graph_visibility: "public",
    status: "current",
    page_role: "knowledge",
    created: date,
    updated: date,
    evidence_ids: [],
    capability_layers: [],
    ...(Number.isInteger(publicationYear) ? { history: { publication_year: publicationYear } } : {}),
    origin,
    works: {
      primary: [
        {
          citation: citations,
          genre,
          identifiers,
          edition: null
        }
      ],
      supporting: []
    },
    access
  };
  const body = `## 요약\n\n${summary}\n\n## 인용 위치\n\n- 아직 정리하지 않음.\n`;

  // Multi-signal candidate discovery (rankSearch + token matching + 1-hop graph fan-out + open gaps)
  const searchable = workspace.pages
    .filter((page) => page.data.publication_visibility === "public" && page.kind !== "meta")
    .map((page) => ({
      id: page.id,
      key: page.key,
      title: page.title,
      summary: page.data.summary || "",
      kind: page.kind,
      aliases: page.aliases,
      domains: page.data.domains || []
    }));

  const candidateScores = new Map();
  const addCandidate = (page, delta) => {
    if (!page || page.id === id) return;
    const prev = candidateScores.get(page.id) || { id: page.id, key: page.key, title: page.title, kind: page.kind, score: 0 };
    prev.score = Number((prev.score + delta).toFixed(2));
    candidateScores.set(page.id, prev);
  };

  for (const hit of rankSearch(searchable, title).slice(0, 8)) {
    addCandidate(hit.item, Math.max(1, Math.round(hit.score / 200)));
  }

  const queryTokens = `${title} ${summary} ${localTextPreview.slice(0, 600)}`
    .toLowerCase()
    .split(/[\s,.;:()[\]{}"'/-]+/)
    .filter((token) => token.length > 1);
  const uniqueTokens = [...new Set(queryTokens)].slice(0, 40);

  for (const page of workspace.pages) {
    if (page.kind === "meta") continue;
    const haystack = `${page.title} ${(page.data.aliases || []).join(" ")} ${page.data.summary || ""}`.toLowerCase();
    const tokenHits = uniqueTokens.filter((token) => haystack.includes(token)).length;
    if (tokenHits > 0) addCandidate(page, tokenHits);
  }

  const candidates = [...candidateScores.values()]
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ko"))
    .slice(0, 8);

  // 1-hop fan-out candidates from top direct candidates
  const directKeys = new Set(candidates.map((c) => c.key));
  const fanoutMap = new Map();
  for (const candidate of candidates.slice(0, 5)) {
    const candidatePage = workspace.pageByKey.get(candidate.key);
    for (const rel of candidatePage?.data?.relations || []) {
      if (directKeys.has(rel.target)) continue;
      const targetPage = workspace.pageByKey.get(rel.target);
      if (targetPage && targetPage.data.publication_visibility === "public") {
        fanoutMap.set(targetPage.key, {
          id: targetPage.id,
          key: targetPage.key,
          title: targetPage.title,
          kind: targetPage.kind,
          via: candidate.key,
          predicate: rel.predicate
        });
      }
    }
  }
  for (const page of workspace.pages) {
    if (directKeys.has(page.key) || page.data.publication_visibility !== "public") continue;
    const incomingToCandidate = (page.data.relations || []).find((rel) => directKeys.has(rel.target));
    if (incomingToCandidate && !fanoutMap.has(page.key)) {
      fanoutMap.set(page.key, {
        id: page.id,
        key: page.key,
        title: page.title,
        kind: page.kind,
        via: incomingToCandidate.target,
        predicate: incomingToCandidate.predicate
      });
    }
  }
  const fanoutCandidates = [...fanoutMap.values()].slice(0, 12);

  // Match open gaps in wiki/gaps.md
  const parsedGaps = await parseWikiGaps(root);
  const matchedGaps = parsedGaps.entries
    .filter((entry) => entry.status === "open")
    .filter((entry) => {
      const gapTokens = `${entry.key} ${entry.evidence}`.toLowerCase();
      return uniqueTokens.some((token) => token.length > 2 && gapTokens.includes(token));
    })
    .map((entry) => ({ key: entry.key, kind: entry.kind, demand: entry.demand }));

  const proposal = {
    schema_version: 1,
    source: id,
    title,
    disposition: candidates.length ? "update-or-new" : "new",
    raw: rawPath,
    candidates,
    fanout_candidates: fanoutCandidates,
    matched_gaps: matchedGaps,
    integration: {
      create_pages: [],
      update_pages: [],
      close_gaps: []
    },
    notes: "Source skeleton only. Review candidates/fanout, populate integration (create_pages/update_pages/close_gaps) and run wiki:ingest -- --apply, or edit pages then run knowledge:seed and wiki:lint."
  };

  if (!dryRun) {
    await mkdir(path.dirname(pagePath), { recursive: true });
    await writeFile(pagePath, renderPage(data, body), "utf8");
    await writeJson(path.join(root, "output", "ingest", `${id}.json`), proposal);
    await appendLog(root, {
      action: "ingest",
      title,
      summary: `${title} 소스를 수집한 기록.`,
      filenameSlug: `ingest-${id}`,
      body: `## 수집\n\n- source: ${isUrl ? sourceArg : rawPath}\n- id: ${id}\n- proposal: output/ingest/${id}.json\n`
    });
  }

  return {
    id,
    title,
    rawPath: rawPath || sourceArg,
    pagePath,
    proposal,
    dryRun
  };
}

export async function applyIngestProposal(root = process.cwd(), { proposalPath, dryRun = false } = {}) {
  if (!proposalPath) {
    throw new Error("Usage: npm run wiki:ingest -- --apply <output/ingest/src-###.json> [--dry-run]");
  }
  const absoluteProposal = path.resolve(root, proposalPath);
  const proposal = await readJson(absoluteProposal);
  const sourceId = proposal.source;
  const integration = proposal.integration || {};
  const createPages = Array.isArray(integration.create_pages) ? integration.create_pages : [];
  const updatePages = Array.isArray(integration.update_pages) ? integration.update_pages : [];
  const closeGaps = Array.isArray(integration.close_gaps) ? integration.close_gaps : [];

  if (!createPages.length && !updatePages.length && !closeGaps.length) {
    throw new Error(`proposal ${proposalPath} has no integration operations (create_pages, update_pages, close_gaps)`);
  }

  const date = today();
  const validateSchema = await createPageSchemaValidator(root);
  const createdIds = [];
  const updatedIds = [];
  const closedGapKeys = [];

  // 1. Validate & stage create_pages
  const stagedCreates = [];
  for (const spec of createPages) {
    const kind = spec.kind || "concept";
    const id = spec.id;
    const title = spec.title;
    if (!id || !title) throw new Error("create_pages item requires id and title");
    const targetRelPath = spec.path || `wiki/${KIND_DIRS[kind] || "concepts"}/${title.replace(/[\\/:*?"<>|]/g, "-")}.md`;
    const filePath = path.join(root, targetRelPath);
    const data = {
      schema_version: 3,
      id,
      ...(spec.key ? { key: spec.key } : {}),
      kind,
      title,
      aliases: spec.aliases || [title],
      summary: spec.summary || `${title}에 대한 지식 문서.`,
      domains: spec.domains || [],
      publication_visibility: spec.publication_visibility || "public",
      graph_visibility: spec.graph_visibility || "public",
      status: spec.status || "current",
      page_role: spec.page_role || "knowledge",
      created: spec.created || date,
      updated: date,
      evidence_ids: spec.evidence_ids || (sourceId ? [sourceId] : []),
      capability_layers: spec.capability_layers || [],
      ...(spec.history ? { history: spec.history } : {}),
      ...(spec.relations ? { relations: spec.relations } : {})
    };
    if (!validateSchema(data)) {
      const msg = (validateSchema.errors || []).map((e) => `${e.instancePath} ${e.message}`).join("; ");
      throw new Error(`invalid schema for create_pages ${id}: ${msg}`);
    }
    let body = spec.body || `## 개요\n\n${data.summary}\n`;
    if (Array.isArray(data.relations) && data.relations.length > 0 && !/^##\s+관계\s*$/m.test(body)) {
      body = `${body.trimEnd()}\n\n## 관계\n`;
    }
    stagedCreates.push({ id, filePath, data, body });
  }

  if (!dryRun && stagedCreates.length > 0) {
    for (const item of stagedCreates) {
      await mkdir(path.dirname(item.filePath), { recursive: true });
      await writeFile(item.filePath, renderPage(item.data, item.body), "utf8");
      createdIds.push(item.id);
    }
    await seedRegistry(root);
  } else {
    for (const item of stagedCreates) createdIds.push(item.id);
  }

  // 2. Load workspace (including any newly seeded nodes) and validate/apply update_pages
  const workspace = await loadWorkspace(root);
  const stagedUpdates = [];

  for (const spec of updatePages) {
    const page = spec.id ? workspace.pageById.get(spec.id) : workspace.pageByKey.get(spec.key);
    if (!page) {
      throw new Error(`update_pages target not found: ${spec.id || spec.key}`);
    }
    const nextData = structuredClone(page.data);
    const addEvidence = spec.add_evidence_ids || spec.evidence_ids || (sourceId ? [sourceId] : []);
    nextData.evidence_ids = [...new Set([...(nextData.evidence_ids || []), ...addEvidence])];

    const addRelations = spec.add_relations || spec.relations || [];
    if (addRelations.length > 0) {
      const existingRelations = Array.isArray(nextData.relations) ? [...nextData.relations] : [];
      for (const rel of addRelations) {
        if (!workspace.nodeByKey.has(rel.target) && !stagedCreates.some((c) => c.data.key === rel.target)) {
          throw new Error(`unresolved relation target '${rel.target}' in update_pages for ${page.id}`);
        }
        const rawEvidence = rel.evidence || (sourceId ? [{ source: sourceId }] : []);
        const existingIdx = existingRelations.findIndex(
          (item) => (item.subject || page.key) === (rel.subject || page.key) && item.predicate === rel.predicate && item.target === rel.target
        );
        if (existingIdx >= 0) {
          const currentEv = existingRelations[existingIdx].evidence || [];
          const mergedEv = [...currentEv];
          for (const ev of rawEvidence) {
            if (!mergedEv.some((item) => item.source === ev.source && (item.locator || null) === (ev.locator || null))) {
              mergedEv.push(ev);
            }
          }
          existingRelations[existingIdx] = {
            ...existingRelations[existingIdx],
            note: rel.note || existingRelations[existingIdx].note,
            evidence: mergedEv
          };
        } else {
          existingRelations.push({
            ...(rel.subject ? { subject: rel.subject } : {}),
            predicate: rel.predicate,
            target: rel.target,
            note: rel.note || `${rel.predicate} ${rel.target}`,
            evidence: rawEvidence
          });
        }
      }
      nextData.relations = existingRelations;
    }

    if (spec.status) nextData.status = spec.status;
    if (spec.superseded_by) nextData.superseded_by = spec.superseded_by;
    nextData.updated = date;

    if (!validateSchema(nextData)) {
      const msg = (validateSchema.errors || []).map((e) => `${e.instancePath} ${e.message}`).join("; ");
      throw new Error(`invalid schema for update_pages ${page.id}: ${msg}`);
    }

    let nextBody = spec.body !== undefined ? spec.body : page.body;
    if (Array.isArray(nextData.relations) && nextData.relations.length > 0) {
      if (!/^##\s+관계\s*$/m.test(nextBody)) {
        const sourceHeadingIdx = nextBody.indexOf("\n## 출처");
        nextBody = sourceHeadingIdx >= 0
          ? `${nextBody.slice(0, sourceHeadingIdx).trimEnd()}\n\n## 관계\n\n${nextBody.slice(sourceHeadingIdx + 1)}`
          : `${nextBody.trimEnd()}\n\n## 관계\n`;
      }
      nextBody = updateBody(nextBody, nextData.relations, workspace);
    }

    stagedUpdates.push({ page, nextData, nextBody });
  }

  // Also sync relations on newly created pages if they had relations
  if (!dryRun) {
    for (const item of stagedCreates) {
      if (Array.isArray(item.data.relations) && item.data.relations.length > 0) {
        const syncedBody = updateBody(item.body, item.data.relations, workspace);
        await writeFile(item.filePath, renderPage(item.data, syncedBody), "utf8");
      }
    }
    for (const item of stagedUpdates) {
      await writeFile(item.page.filePath, renderPage(item.nextData, item.nextBody), "utf8");
      updatedIds.push(item.page.id);
    }
    for (const gap of closeGaps) {
      const gapKey = typeof gap === "string" ? gap : gap.key;
      const resolution = (typeof gap === "object" && gap.resolution) || `resolved by ${sourceId || "ingest apply"}`;
      await closeWikiGap(root, { key: gapKey, resolution });
      closedGapKeys.push(gapKey);
    }
    await seedRegistry(root);
    await checkOrSyncWikiIndex(root, { write: true });
    await appendLog(root, {
      action: "ingest",
      title: `Apply ${sourceId || path.basename(proposalPath)}`,
      summary: `${sourceId || "소스"} 통합 반영 (${createdIds.length} 생성, ${updatedIds.length} 갱신).`,
      filenameSlug: `apply-${sourceId || "ingest"}`,
      body: `## 통합 반영\n\n- source: ${sourceId || proposalPath}\n- created: ${createdIds.join(", ") || "none"}\n- updated: ${updatedIds.join(", ") || "none"}\n- closed_gaps: ${closedGapKeys.join(", ") || "none"}\n`
    });
  } else {
    for (const item of stagedUpdates) updatedIds.push(item.page.id);
    for (const gap of closeGaps) closedGapKeys.push(typeof gap === "string" ? gap : gap.key);
  }

  return {
    source: sourceId,
    created: createdIds,
    updated: updatedIds,
    closedGaps: closedGapKeys,
    dryRun
  };
}
