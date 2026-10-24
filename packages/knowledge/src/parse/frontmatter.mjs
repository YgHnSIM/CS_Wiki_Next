import YAML from "yaml";

const FRONTMATTER_DOC_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
const FRONTMATTER_HEAD_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

export function parseDocument(text, file = "<memory>") {
  const match = String(text).match(FRONTMATTER_DOC_RE);
  if (!match) throw new Error(`missing frontmatter: ${file}`);
  const data = YAML.parse(match[1]);
  if (!data || typeof data !== "object") throw new Error(`invalid frontmatter: ${file}`);
  return { data, body: match[2] };
}

export function parseFrontmatter(text, file = "<memory>") {
  const match = String(text).match(FRONTMATTER_HEAD_RE);
  if (!match) throw new Error(`missing frontmatter: ${file}`);
  const data = YAML.parse(match[1]);
  if (!data || typeof data !== "object") throw new Error(`invalid frontmatter: ${file}`);
  return data;
}

export function renderPage(data, body) {
  const frontmatter = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
  const cleanBody = String(body || "").replace(/^\n+/, "").replace(/\s*$/, "\n");
  return `---\n${frontmatter}\n---\n\n${cleanBody}`;
}

export function checkTextEndings(rawText) {
  const text = String(rawText);
  return {
    hasCrlf: text.includes("\r\n"),
    hasFinalNewline: text.endsWith("\n")
  };
}
