import MarkdownIt from "markdown-it";
import katex from "katex";
import { cleanHeadingText, headingSlug, stripInternalBlocks } from "./toc.mjs";

const PIPE = "\uE000";

function isHangulCode(code) {
  return (code >= 0xAC00 && code <= 0xD7A3)
    || (code >= 0x3131 && code <= 0x318E)
    || (code >= 0x1100 && code <= 0x11FF);
}

function isSpaceCode(code) {
  return code === 0x20 || code === 0x09 || code === 0x0A || code === 0x0D;
}

function installHangulDelims(markdown) {
  const proto = markdown.inline.State.prototype;
  if (proto.__csWikiHangulPatched) return;
  const origScanDelims = proto.scanDelims;
  proto.scanDelims = function scanDelimsWithHangul(start, canSplitWord) {
    const res = origScanDelims.call(this, start, canSplitWord);
    if (!canSplitWord) return res;
    const max = this.posMax;
    const lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;
    const end = start + res.length;
    const nextChar = end < max ? this.src.charCodeAt(end) : 0x20;

    if (!isSpaceCode(lastChar) && isHangulCode(nextChar)) {
      res.can_close = true;
    }
    if (isHangulCode(lastChar) && !isSpaceCode(nextChar)) {
      res.can_open = true;
    }
    return res;
  };
  proto.__csWikiHangulPatched = true;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderTex(tex, displayMode) {
  return katex.renderToString(String(tex || "").trim(), {
    displayMode,
    throwOnError: false,
    strict: "ignore"
  });
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
    const codeSpans = [];
    const masked = line.replace(/(`+[^`\n]*?`+)/g, (match) => {
      const token = `\uE002${codeSpans.length}\uE002`;
      codeSpans.push(match);
      return token;
    });
    const withImages = masked.replace(
      /!\[\[([^\]|#\n]+)(?:#[^\]|\n]*)?(?:\|([^\]\n]*))?\]\]/g,
      (_, target, alt) => {
        const file = String(target).replace(/^\/+/, "");
        return `<img src="${escapeHtml(withBase(`/assets/${encodeURI(file)}`))}" alt="${escapeHtml(alt || file)}" loading="lazy" decoding="async" />`;
      }
    );
    const withLinks = withImages.replace(/\[\[([^\]\n]+?)\]\]/g, (_, inner) => `[[${inner.replaceAll("|", PIPE)}]]`);
    return withLinks.replace(/\uE002(\d+)\uE002/g, (_, index) => codeSpans[Number(index)] || "");
  }).join("\n");
}

function findUnescaped(src, needle, fromIndex) {
  let pos = fromIndex;
  while (pos < src.length) {
    const idx = src.indexOf(needle, pos);
    if (idx < 0) return -1;
    let backslashes = 0;
    for (let k = idx - 1; k >= 0 && src.charCodeAt(k) === 0x5C; k--) backslashes++;
    if (backslashes % 2 === 0) return idx;
    pos = idx + needle.length;
  }
  return -1;
}

export function renderMarkdown(body, resolveDocument, withBase) {
  const markdown = new MarkdownIt({
    html: true,
    linkify: false,
    typographer: false
  });
  installHangulDelims(markdown);

  const headingCounts = new Map();
  markdown.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const inline = tokens[idx + 1];
    const text = cleanHeadingText(inline?.content || "");
    const base = headingSlug(text);
    const count = (headingCounts.get(base) || 0) + 1;
    headingCounts.set(base, count);
    tokens[idx].attrSet("id", count === 1 ? base : `${base}-${count}`);
    return self.renderToken(tokens, idx, options);
  };

  markdown.block.ruler.after("fence", "math_block", (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    const maxPos = state.eMarks[startLine];
    if (startPos + 2 > maxPos) return false;
    if (state.src.slice(startPos, startPos + 2) !== "$$") return false;

    const firstLineRest = state.src.slice(startPos + 2, maxPos).trim();
    if (firstLineRest.endsWith("$$") && firstLineRest.length >= 2) {
      const content = firstLineRest.slice(0, -2).trim();
      if (!content) return false;
      if (silent) return true;
      state.line = startLine + 1;
      const token = state.push("math_block", "div", 0);
      token.block = true;
      token.content = content;
      return true;
    }

    let nextLine = startLine;
    let found = false;
    while (++nextLine < endLine) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineEnd = state.eMarks[nextLine];
      const lineText = state.src.slice(lineStart, lineEnd).trim();
      if (lineText.endsWith("$$")) {
        found = true;
        break;
      }
    }
    if (!found) return false;
    if (silent) return true;

    const blockStart = startPos + 2;
    const lastLineEnd = state.eMarks[nextLine];
    const closingIdx = state.src.lastIndexOf("$$", lastLineEnd);
    const content = state.src.slice(blockStart, closingIdx).trim();
    state.line = nextLine + 1;
    const token = state.push("math_block", "div", 0);
    token.block = true;
    token.content = content;
    return true;
  });

  markdown.renderer.rules.math_block = (tokens, idx) =>
    `<div class="math-block">${renderTex(tokens[idx].content, true)}</div>\n`;

  markdown.inline.ruler.before("escape", "math_inline", (state, silent) => {
    const start = state.pos;
    const max = state.posMax;
    if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false;

    if (state.src.startsWith("$$", start)) {
      const end = findUnescaped(state.src, "$$", start + 2);
      if (end < 0 || end >= max) return false;
      const content = state.src.slice(start + 2, end).trim();
      if (!content) return false;
      if (!silent) {
        const token = state.push("math_inline_display", "span", 0);
        token.content = content;
      }
      state.pos = end + 2;
      return true;
    }

    if (start + 2 >= max) return false;
    const afterOpen = state.src.charCodeAt(start + 1);
    if (isSpaceCode(afterOpen) || afterOpen === 0x24) return false;

    let searchPos = start + 1;
    let end = -1;
    while (searchPos < max) {
      const candidate = findUnescaped(state.src, "$", searchPos);
      if (candidate < 0 || candidate >= max) return false;
      const newlineIdx = state.src.indexOf("\n", start + 1);
      if (newlineIdx >= 0 && newlineIdx < candidate) return false;
      if (state.src.charCodeAt(candidate + 1) === 0x24) return false;
      const beforeClose = state.src.charCodeAt(candidate - 1);
      const afterClose = candidate + 1 < max ? state.src.charCodeAt(candidate + 1) : 0x20;
      const isTrailingDigit = afterClose >= 0x30 && afterClose <= 0x39;
      if (!isSpaceCode(beforeClose) && !isTrailingDigit) {
        end = candidate;
        break;
      }
      searchPos = candidate + 1;
    }

    if (end < 0) return false;
    const content = state.src.slice(start + 1, end);
    if (!content) return false;
    if (!silent) {
      const token = state.push("math_inline", "span", 0);
      token.content = content;
    }
    state.pos = end + 1;
    return true;
  });

  markdown.renderer.rules.math_inline = (tokens, idx) =>
    `<span class="math-inline">${renderTex(tokens[idx].content, false)}</span>`;

  markdown.renderer.rules.math_inline_display = (tokens, idx) =>
    `<span class="math-block">${renderTex(tokens[idx].content, true)}</span>`;

  markdown.inline.ruler.before("link", "wiki_link", (state, silent) => {
    const start = state.pos;
    if (state.src.slice(start, start + 2) !== "[[") return false;
    if (start > 0 && state.src[start - 1] === "!") return false;
    const end = state.src.indexOf("]]", start + 2);
    if (end < 0) return false;
    const inner = state.src.slice(start + 2, end);
    const pipe = inner.indexOf(PIPE);
    const targetPart = pipe >= 0 ? inner.slice(0, pipe) : inner;
    const label = (pipe >= 0 ? inner.slice(pipe + 1) : inner).replaceAll(PIPE, "|");
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
    const href = `${withBase(document.url)}${section ? `#${encodeURIComponent(headingSlug(section))}` : ""}`;
    const open = state.push("link_open", "a", 1);
    open.attrSet("href", href);
    open.attrSet("class", "wiki-link");
    if (/[*`_~$]/.test(label)) {
      const children = markdown.parseInline(label, state.env)[0]?.children || [];
      for (const child of children) {
        state.tokens.push(child);
      }
    } else {
      const text = state.push("text", "", 0);
      text.content = label;
    }
    state.push("link_close", "a", -1);
    state.pos = end + 2;
    return true;
  });

  return markdown.render(protectBody(stripInternalBlocks(body), withBase));
}
