export const RELATION_KINDS = new Set([
  "broader",
  "narrower",
  "prerequisite_for",
  "enables",
  "constrains",
  "measures",
  "implements",
  "exemplifies",
  "precedes",
  "responds_to",
  "contradicts",
  "synthesizes"
]);

export const relationStart = "<!-- knowledge:relations:start -->";
export const relationEnd = "<!-- knowledge:relations:end -->";

function cleanText(value = "") {
  return String(value)
    .replace(/!?(?:\[\[)([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tableCells(line) {
  const input = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let current = "";
  let wikiDepth = 0;
  let inCode = false;
  for (let index = 0; index < input.length; index += 1) {
    const pair = input.slice(index, index + 2);
    if (!inCode && pair === "[[") {
      wikiDepth += 1;
      current += pair;
      index += 1;
    } else if (!inCode && pair === "]]" && wikiDepth) {
      wikiDepth -= 1;
      current += pair;
      index += 1;
    } else if (input[index] === "`") {
      inCode = !inCode;
      current += input[index];
    } else if (input[index] === "|" && !wikiDepth && !inCode) {
      cells.push(current.trim());
      current = "";
    } else {
      current += input[index];
    }
  }
  cells.push(current.trim());
  return cells;
}

function wikiTargets(value = "") {
  return [...String(value).matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)]
    .map((match) => match[1].trim());
}

export function parseRelations(body = "", { pageTitle = "문서" } = {}) {
  const relations = [];
  const lines = String(body).split(/\r?\n/);
  let inRelationSection = false;
  let inFence = false;
  let columns = null;

  lines.forEach((line, lineIndex) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      inRelationSection = cleanText(heading[1]) === "관계";
      columns = null;
      return;
    }
    if (!inRelationSection || !line.trim().startsWith("|")) return;
    const cells = tableCells(line);
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return;
    if (!columns) {
      const names = cells.map((cell) => cleanText(cell));
      columns = {
        kind: names.indexOf("관계"),
        target: names.indexOf("대상"),
        note: names.indexOf("설명"),
        evidence: names.indexOf("근거")
      };
      if (columns.kind < 0 || columns.target < 0 || columns.note < 0) {
        throw new Error(`Relation table on '${pageTitle}' must contain 관계, 대상, 설명 columns`);
      }
      return;
    }

    const kind = String(cells[columns.kind] || "").replace(/[`*]/g, "").trim().replaceAll("-", "_");
    if (!kind) return;
    if (!RELATION_KINDS.has(kind)) {
      throw new Error(`Unknown curated relation '${kind}' on '${pageTitle}' line ${lineIndex + 1}`);
    }
    const [target] = wikiTargets(cells[columns.target] || "");
    if (!target) {
      throw new Error(`Relation '${kind}' on '${pageTitle}' line ${lineIndex + 1} needs a wiki-link target`);
    }
    const note = cleanText(cells[columns.note] || "");
    if (!note) {
      throw new Error(`Relation '${kind}' on '${pageTitle}' line ${lineIndex + 1} needs an explanation`);
    }
    const evidence = columns.evidence >= 0 ? wikiTargets(cells[columns.evidence] || "") : [];
    if (["responds_to", "enables", "precedes", "constrains"].includes(kind) && evidence.length === 0) {
      throw new Error(`Historical relation '${kind}' on '${pageTitle}' line ${lineIndex + 1} needs direct evidence`);
    }
    relations.push({
      kind,
      target,
      note,
      evidence,
      line: lineIndex + 1
    });
  });
  return relations;
}

function escapeCell(value) {
  return String(value || "").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

export function renderRelations(relations, workspace) {
  if (!relations || !relations.length) return "";
  const rows = relations.map((relation) => {
    const target = workspace.nodeByKey.get(relation.target);
    const targetLabel = target?.labels?.ko || relation.target;
    const evidence = (relation.evidence || [])
      .map((item) => {
        const source = workspace.pages.find((page) => page.id === item.source);
        return source ? `[[${source.title}]]` : item.source;
      })
      .join(", ") || "-";
    return `| ${relation.predicate} | [[${targetLabel}]] | ${escapeCell(relation.note)} | ${evidence} |`;
  });
  return [
    relationStart,
    "| 관계 | 대상 | 설명 | 근거 |",
    "|---|---|---|---|",
    ...rows,
    relationEnd
  ].join("\n");
}

export function replaceRelationSection(body, relations, workspace) {
  const lines = String(body).split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+관계\s*$/.test(line));
  if (start < 0) throw new Error("missing ## 관계 section");
  let end = start + 1;
  while (end < lines.length && !/^##\s+/.test(lines[end])) end += 1;
  const before = lines.slice(0, start + 1);
  const after = lines.slice(end);
  const block = renderRelations(relations, workspace).split("\n");
  return [...before, "", ...block, "", ...after].join("\n");
}

export function updateBody(body, relations, workspace) {
  if (relations && relations.length) return replaceRelationSection(body, relations, workspace);
  return String(body).replace(/\n*<!-- knowledge:relations:start -->[\s\S]*?<!-- knowledge:relations:end -->\n*/g, "\n");
}
