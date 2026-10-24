import path from "node:path";
import { writeJson } from "../shared/fs.mjs";
import { parseRelations } from "../parse/relations.mjs";
import { loadWorkspace, resolvePage } from "../registry/workspace.mjs";

export async function reportRelations(root = process.cwd(), { write = true } = {}) {
  const workspace = await loadWorkspace(root);
  const { nodes, nodeByKey, pages } = workspace;

  const unresolvedTargets = [];
  const unresolvedEvidence = [];
  const missingEvidence = [];
  const selfRelations = [];
  const duplicateEdges = [];
  const edgeKeys = new Set();
  const degree = new Map();
  const relationErrors = [];
  let pagesWithRelations = 0;
  let totalRelations = 0;

  for (const page of pages) {
    let parsed = [];
    try {
      parsed = parseRelations(page.body, { pageTitle: page.title });
    } catch (error) {
      relationErrors.push({ page: page.id, error: error.message });
      continue;
    }
    if (parsed.length > 0) pagesWithRelations += 1;
    totalRelations += parsed.length;

    for (const relation of parsed) {
      const target = resolvePage(workspace, relation.target);
      if (!target) {
        unresolvedTargets.push({ page: page.id, target: relation.target, line: relation.line });
        continue;
      }
      if (!relation.evidence?.length) missingEvidence.push({ page: page.id, target: relation.target, line: relation.line });
      if (target.id === page.id) selfRelations.push({ page: page.id, target: relation.target, line: relation.line });

      const evidenceIds = [];
      for (const title of relation.evidence || []) {
        const source = resolvePage(workspace, title);
        if (!source) unresolvedEvidence.push({ page: page.id, evidence: title, line: relation.line });
        else evidenceIds.push(source.id);
      }

      const edgeKey = [page.key, relation.kind, target.key, [...evidenceIds].sort().join(",")].join("|");
      if (edgeKeys.has(edgeKey)) duplicateEdges.push({ page: page.id, target: target.id, predicate: relation.kind, line: relation.line });
      edgeKeys.add(edgeKey);

      degree.set(page.key, (degree.get(page.key) || 0) + 1);
      degree.set(target.key, (degree.get(target.key) || 0) + 1);
    }
  }

  const topNodes = [...degree.entries()]
    .map(([nodeKey, value]) => {
      const node = nodeByKey.get(nodeKey);
      return {
        key: nodeKey,
        title: node?.labels?.ko || nodeKey,
        type: node?.type || "unknown",
        degree: value,
        status: node?.status || "unknown"
      };
    })
    .sort((a, b) => b.degree - a.degree || a.key.localeCompare(b.key))
    .slice(0, 50);

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      pages: pages.length,
      pagesWithRelations,
      relations: totalRelations,
      nodes: nodes.length
    },
    issues: {
      relationErrors,
      unresolvedTargets,
      unresolvedEvidence,
      missingEvidence,
      selfRelations,
      duplicateEdges
    },
    topNodes
  };

  if (write) {
    await writeJson(path.join(root, "output", "relations-report.json"), report);
  }

  const hasFatalErrors = Boolean(
    relationErrors.length || unresolvedTargets.length || unresolvedEvidence.length || selfRelations.length
  );

  return { report, hasFatalErrors };
}
