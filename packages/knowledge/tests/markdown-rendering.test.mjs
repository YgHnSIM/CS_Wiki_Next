import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderMarkdown } from "../../../app/src/lib/markdown.mjs";
import { extractHeadings } from "../../../app/src/lib/toc.mjs";
import { loadWorkspace } from "../src/registry/workspace.mjs";
import { validatePageMarkdown } from "../src/validate/markdown-render.mjs";

const root = process.cwd();
const resolveStub = (target) => {
  if (target === "이기종 실행 모델") return { url: "/docs/concept-heterogeneous/" };
  if (target === "맹목적 사고와 기호적 인식") return { url: "/docs/concept-cogitatio-caeca/" };
  if (target === "기호 조작") return { url: "/docs/concept-symbolic/" };
  return null;
};
const withBase = (p) => p;

test("renders bold and italic followed by Korean postpositions after punctuation, code, links, and math", () => {
  const md = [
    "실리콘 위에 **육화(Incarnation)**되어 실행된다.",
    "이는 **'외재화된 대사 작용'**의 획득이자 **\"구문 트리의 선택\"**이었다.",
    "보편 S-함수 **`apply`와 `eval[e; a]`**는 메타순환 인터프리터다.",
    "결국 **[[이기종 실행 모델]]**로 수렴하며 **[[맹목적 사고와 기호적 인식|맹목적 사고(Cogitatio Caeca)]]**를 정초했다.",
    "남은 **$2x$**가 기울기이며, *Why Did It Take 1,877 Years to Invent $x^2$?*를 질문으로 삼는다.",
    "**형식(form)**과 **함수(function)**를 엄격히 구분한다."
  ].join("\n\n");

  const html = renderMarkdown(md, resolveStub, withBase);
  assert.ok(!html.includes("**"), `unexpected unparsed bold in: ${html}`);
  assert.match(html, /<strong>육화\(Incarnation\)<\/strong>되어/);
  assert.match(html, /<strong>'외재화된 대사 작용'<\/strong>의/);
  assert.match(html, /<strong>&quot;구문 트리의 선택&quot;<\/strong>이었다/);
  assert.match(html, /<strong><code>apply<\/code>와 <code>eval\[e; a\]<\/code><\/strong>는/);
  assert.match(html, /<strong><a href="\/docs\/concept-heterogeneous\/" class="wiki-link">이기종 실행 모델<\/a><\/strong>로/);
  assert.match(html, /<strong><a href="\/docs\/concept-cogitatio-caeca\/" class="wiki-link">맹목적 사고\(Cogitatio Caeca\)<\/a><\/strong>를/);
  assert.match(html, /<strong><span class="math-inline">[\s\S]*?<\/span><\/strong>가/);
  assert.match(html, /<em>Why Did It Take 1,877 Years to Invent <span class="math-inline">[\s\S]*?<\/span>\?<\/em>를/);
  assert.match(html, /<strong>형식\(form\)<\/strong>과 <strong>함수\(function\)<\/strong>를/);
});

test("renders inline and display LaTeX math with KaTeX without corrupting * or \\\\ into markdown tags", () => {
  const md = [
    "번역 규칙: $f[e_1; \\cdots; e_n] \\implies (f^*, e_1^*, \\cdots, e_n^*)$",
    "",
    "$$\\begin{aligned}",
    "p \\wedge q &= (p \\rightarrow q, T \\rightarrow F) \\\\",
    "p \\vee q &= (p \\rightarrow T, T \\rightarrow q)",
    "\\end{aligned}$$"
  ].join("\n");

  const html = renderMarkdown(md, resolveStub, withBase);
  assert.ok(html.includes("class=\"math-inline\""));
  assert.ok(html.includes("class=\"math-block\""));
  assert.ok(html.includes("class=\"katex\""));
  assert.ok(!html.includes("katex-error"));
  assert.ok(!html.includes("<em>, e_1^</em>"));
});

test("supports inline formatting inside wiki-link labels and protects [[A|B]] inside inline code", () => {
  const md = "링크 [[기호 조작#한계와 논점|`eval` 기반 *기호* **조작**]] 및 인라인 코드 `[[A|B]]` 테스트.";
  const html = renderMarkdown(md, resolveStub, withBase);

  assert.ok(!html.includes("\uE000"), "PIPE placeholder should not leak into HTML");
  assert.match(html, /<code>\[\[A\|B\]\]<\/code>/);
  assert.match(
    html,
    /<a href="\/docs\/concept-symbolic\/#%ED%95%9C%EA%B3%84%EC%99%80-%EB%85%BC%EC%A0%90" class="wiki-link"><code>eval<\/code> 기반 <em>기호<\/em> <strong>조작<\/strong><\/a>/
  );
});

test("extractHeadings strips internal evidence blocks, preserves math symbols, and matches rendered heading IDs", () => {
  const md = [
    "## 1. 개요와 [[기호 조작|기호 조작]]",
    "### a. `apply`와 `eval[e; a]`의 작동 (§3f)",
    "### b. 번역 규칙 $\\mathcal{E}^*$와 $(p_1 \\rightarrow e_1)$",
    "<!-- wiki-v2:evidence-start -->",
    "### 근거 ID",
    "- `src-001`",
    "<!-- wiki-v2:evidence-end -->",
    "## 관련 항목"
  ].join("\n\n");

  const toc = extractHeadings(md);
  const html = renderMarkdown(md, resolveStub, withBase);
  const renderedIds = [...html.matchAll(/<h[23]\s+id="([^"]+)">/g)].map((m) => m[1]);

  assert.equal(toc.some((item) => item.text === "근거 ID"), false);
  assert.equal(toc[2].text, "b. 번역 규칙 $\\mathcal{E}^*$와 $(p_1 \\rightarrow e_1)$");
  assert.deepEqual(toc.map((item) => item.id), renderedIds);
});

test("CSS and Base layout preserve font-effect visibility in dark and print modes", async () => {
  const css = await readFile(path.join(root, "app", "src", "styles", "global.css"), "utf8");
  const baseAstro = await readFile(path.join(root, "app", "src", "layouts", "Base.astro"), "utf8");

  assert.match(baseAstro, /katex\/dist\/katex\.min\.css/);
  assert.match(baseAstro, /IBM\+Plex\+Mono:ital,wght@/);
  assert.match(css, /\.prose blockquote p,\s*\.prose blockquote li\s*\{\s*color:\s*inherit;\s*\}/);

  const printBlock = css.slice(css.indexOf("@media print"));
  assert.match(printBlock, /\.prose strong/);
  assert.match(printBlock, /\.prose em/);
});

test("validatePageMarkdown detects broken emphasis and strikethrough markers for wiki:lint", async () => {
  const workspace = await loadWorkspace(root);
  const brokenPage = {
    id: "concept-broken-test",
    body: "## 개요\n\n이 문장은 **\"볼드\"**ab, *\"이탤릭\"*ab, ~~\"취소선\"~~ab 오류를 포함한다.\n"
  };
  const issues = validatePageMarkdown(brokenPage, workspace);
  const codes = issues.map((item) => item.code);
  assert.ok(codes.includes("markdown.unparsed_bold"));
  assert.ok(codes.includes("markdown.unparsed_italic"));
  assert.ok(codes.includes("markdown.unparsed_strike"));
});

test("all 444 wiki documents render with zero unparsed font effects, math errors, or TOC mismatches", async () => {
  const workspace = await loadWorkspace(root);
  const failures = [];

  for (const page of workspace.pages) {
    const issues = validatePageMarkdown(page, workspace);
    if (issues.length > 0) {
      failures.push({ id: page.id, issues });
    }
  }

  assert.deepEqual(failures, []);
});
