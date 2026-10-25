export function stripInternalBlocks(body) {
  return String(body || "").replace(
    /<!--\s*wiki-v2:evidence-start\s*-->[\s\S]*?<!--\s*wiki-v2:evidence-end\s*-->/g,
    ""
  );
}

export function cleanHeadingText(raw) {
  const mathSpans = [];
  const withProtectedMath = String(raw || "")
    .replaceAll("\uE000", "|")
    .replace(/\$([^\s$][^$\n]*?[^\s$]|[^\s$])\$/g, (match) => {
      const token = `\uE001${mathSpans.length}\uE001`;
      mathSpans.push(match);
      return token;
    });

  return withProtectedMath
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\uE001(\d+)\uE001/g, (_, index) => mathSpans[Number(index)] || "")
    .trim();
}

export function headingSlug(text) {
  return cleanHeadingText(text)
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[`*_~[\]()]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "section";
}

export function extractHeadings(body) {
  const headings = [];
  const counts = new Map();
  let inFence = false;
  for (const line of stripInternalBlocks(body).split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const text = cleanHeadingText(match[2]);
    const base = headingSlug(text);
    const count = (counts.get(base) || 0) + 1;
    counts.set(base, count);
    headings.push({
      depth: match[1].length,
      text,
      id: count === 1 ? base : `${base}-${count}`
    });
  }
  return headings;
}
