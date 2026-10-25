import { renderMarkdown } from "../../../../app/src/lib/markdown.mjs";
import { extractHeadings } from "../../../../app/src/lib/toc.mjs";
import { resolvePage } from "../registry/workspace.mjs";

export function validatePageMarkdown(page, workspace) {
  const issues = [];
  const resolveDoc = (target) => {
    const resolved = resolvePage(workspace, target);
    return resolved ? { url: `/docs/${resolved.id}/` } : null;
  };
  const html = renderMarkdown(page.body, resolveDoc, (p) => p);

  if (/[\uE000\uE001\uE002]/.test(html)) {
    issues.push({
      code: "markdown.placeholder_leak",
      message: "internal markdown placeholder character leaked into rendered HTML"
    });
  }

  if (html.includes("katex-error")) {
    issues.push({
      code: "markdown.math_error",
      message: "KaTeX failed to render a math expression"
    });
  }

  const textOnly = html
    .replace(/<pre[\s\S]*?<\/pre>/g, "[PRE]")
    .replace(/<code[\s\S]*?<\/code>/g, "[CODE]")
    .replace(/<annotation[\s\S]*?<\/annotation>/g, "[MATH]");

  const unparsedBold = textOnly.match(/\*\*[^*\n]+?\*\*/);
  if (unparsedBold) {
    issues.push({
      code: "markdown.unparsed_bold",
      message: `unparsed bold syntax in rendered HTML: ${unparsedBold[0].slice(0, 60)}`
    });
  }

  const unparsedItalic = textOnly.match(/(?<!\*)\*([^\s*][^*\n]*?[^\s*])\*(?!\*)/);
  if (unparsedItalic) {
    issues.push({
      code: "markdown.unparsed_italic",
      message: `unparsed italic syntax in rendered HTML: ${unparsedItalic[0].slice(0, 60)}`
    });
  }

  const unparsedStrike = textOnly.match(/~~[^~\n]+?~~/);
  if (unparsedStrike) {
    issues.push({
      code: "markdown.unparsed_strike",
      message: `unparsed strikethrough syntax in rendered HTML: ${unparsedStrike[0].slice(0, 60)}`
    });
  }

  const toc = extractHeadings(page.body);
  const renderedHeadings = [...html.matchAll(/<h([23])\s+id="([^"]+)">/g)].map((m) => ({
    depth: Number(m[1]),
    id: m[2]
  }));

  if (toc.length !== renderedHeadings.length) {
    issues.push({
      code: "markdown.toc_mismatch",
      message: `TOC heading count (${toc.length}) does not match rendered h2/h3 count (${renderedHeadings.length})`
    });
  } else {
    for (let i = 0; i < toc.length; i++) {
      if (toc[i].id !== renderedHeadings[i].id || toc[i].depth !== renderedHeadings[i].depth) {
        issues.push({
          code: "markdown.toc_mismatch",
          message: `TOC heading #${toc[i].id} does not match rendered heading #${renderedHeadings[i].id}`
        });
        break;
      }
    }
  }

  return issues;
}
