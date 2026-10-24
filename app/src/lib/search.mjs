const normalize = (value) => String(value || "")
  .normalize("NFKC")
  .toLocaleLowerCase("ko-KR")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim()
  .replace(/\s+/g, " ");

const compact = (value) => normalize(value).replace(/\s+/g, "");

const synonyms = {
  cpu: ["프로세서", "processor"],
  processor: ["cpu", "프로세서"],
  프로세서: ["cpu", "processor"],
  postmortem: ["포스트모템"],
  포스트모템: ["postmortem"],
  utm: ["universal turing machine", "보편 튜링 기계"],
  aslr: ["address space layout randomization", "주소 공간 배치 무작위화"]
};

const kindBoost = {
  concept: 600,
  entity: 550,
  analysis: 500,
  source: 0,
  reference: 0,
  meta: 0
};

function scoreTitle(title, query, queryCompact) {
  if (title === query) return 1200;
  if (title.startsWith(query)) return 700;
  if (title.includes(query)) return 420;
  if (queryCompact && compact(title).includes(queryCompact)) return 180;
  return 0;
}

function scoreAliases(aliases, query) {
  let best = 0;
  for (const alias of aliases) {
    if (alias === query) best = Math.max(best, 900);
    else if (alias.startsWith(query)) best = Math.max(best, 500);
    else if (alias.includes(query)) best = Math.max(best, 260);
  }
  return best;
}

function termMatches(haystack, compactHaystack, term) {
  if (haystack.includes(term) || compactHaystack.includes(compact(term))) return true;
  return (synonyms[term] || []).some((alternative) => haystack.includes(normalize(alternative)) || compactHaystack.includes(compact(alternative)));
}

export function rankSearch(items, rawQuery) {
  const query = normalize(rawQuery);
  if (!query) return [];
  const queryCompact = compact(query);
  const terms = query.split(" ");

  return items
    .map((item) => {
      const title = normalize(item.title);
      const aliases = (item.aliases || []).map(normalize);
      const alias = aliases.join(" ");
      const summary = normalize(item.summary);
      const domains = normalize((item.domains || []).join(" "));
      const all = `${title} ${alias} ${summary} ${domains} ${normalize(item.kind)}`;
      const allCompact = compact(all);
      if (!terms.every((term) => termMatches(all, allCompact, term))) return null;

      let score = scoreTitle(title, query, queryCompact) + scoreAliases(aliases, query);
      if (summary.includes(query)) score += 40;
      score += terms.filter((term) => title.includes(term)).length * 50;
      if (title.startsWith(terms[0])) score += 30;
      score += kindBoost[item.kind] || 0;
      score += Math.min(Number(item.degree) || 0, 40) * 0.4;
      return { item, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || (Number(b.item.degree) || 0) - (Number(a.item.degree) || 0) || a.item.title.localeCompare(b.item.title, "ko"));
}

export { normalize, compact };
