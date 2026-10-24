const WIKI_LINK_RE = /!?\[\[([^\]|#\n]+)(?:#([^\]|\n]+))?(?:\|([^\]\n]+))?\]\]/g;
const ASSET_EXT_RE = /\.[a-z0-9]{2,5}([?#].*)?$/i;

export function extractWikiLinks(text = "", { includeEmbeds = false, includeAssets = false } = {}) {
  const links = [];
  for (const match of String(text).matchAll(WIKI_LINK_RE)) {
    const raw = match[0];
    const isEmbed = raw.startsWith("![[");
    if (isEmbed && !includeEmbeds) continue;
    const target = match[1].trim();
    if (!target) continue;
    if (!includeAssets && ASSET_EXT_RE.test(target)) continue;
    links.push({
      raw,
      target,
      section: match[2]?.trim() || null,
      label: match[3]?.trim() || target,
      isEmbed
    });
  }
  return links;
}

export function extractWikiLinkTargets(text = "", options = {}) {
  return extractWikiLinks(text, options).map((link) => link.target);
}
