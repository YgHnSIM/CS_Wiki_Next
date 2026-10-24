export function headingSlug(text) {
  return String(text || "")
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
  for (const line of String(body).split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const text = match[2]
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .trim();
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
