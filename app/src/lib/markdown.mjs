import MarkdownIt from "markdown-it";

const PIPE = "\uE000";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function protectBody(body, withBase) {
  const lines = String(body).split("\n");
  let inFence = false;
  return lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    const withImages = line.replace(
      /!\[\[([^\]|#\n]+)(?:#[^\]|\n]*)?(?:\|([^\]\n]*))?\]\]/g,
      (_, target, alt) => {
        const file = String(target).replace(/^\/+/, "");
        return `<img src="${escapeHtml(withBase(`/assets/${encodeURI(file)}`))}" alt="${escapeHtml(alt || file)}" loading="lazy" />`;
      }
    );
    return withImages.replace(/\[\[([^\]\n]+?)\]\]/g, (_, inner) => `[[${inner.replaceAll("|", PIPE)}]]`);
  }).join("\n");
}

export function renderMarkdown(body, resolveDocument, withBase) {
  const markdown = new MarkdownIt({
    html: true,
    linkify: false,
    typographer: false
  });

  markdown.inline.ruler.before("link", "wiki_link", (state, silent) => {
    const start = state.pos;
    if (state.src.slice(start, start + 2) !== "[[") return false;
    if (start > 0 && state.src[start - 1] === "!") return false;
    const end = state.src.indexOf("]]", start + 2);
    if (end < 0) return false;
    const inner = state.src.slice(start + 2, end);
    const pipe = inner.indexOf(PIPE);
    const targetPart = pipe >= 0 ? inner.slice(0, pipe) : inner;
    const label = pipe >= 0 ? inner.slice(pipe + 1) : inner;
    const [target, section] = targetPart.split("#", 2);
    const document = resolveDocument(target);
    if (!document) {
      if (silent) return false;
      const token = state.push("text", "", 0);
      token.content = `[[${inner.replaceAll(PIPE, "|")}]]`;
      state.pos = end + 2;
      return true;
    }
    if (silent) return true;
    const href = `${withBase(document.url)}${section ? `#${encodeURIComponent(section)}` : ""}`;
    const open = state.push("link_open", "a", 1);
    open.attrSet("href", href);
    open.attrSet("class", "wiki-link");
    const text = state.push("text", "", 0);
    text.content = label;
    state.push("link_close", "a", -1);
    state.pos = end + 2;
    return true;
  });

  return markdown.render(protectBody(body, withBase));
}
