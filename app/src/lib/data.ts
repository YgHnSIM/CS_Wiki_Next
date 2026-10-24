import { readFileSync } from "node:fs";
import path from "node:path";

export type Statement = {
  id: string;
  subject: string;
  predicate: string;
  target: string;
  note: string;
  evidence: Array<{ source: string; locator: string | null; quote: string | null; snapshot: string | null }>;
  confidence: string;
  valid_from: number | null;
  valid_to: number | null;
  document: string;
};

export type Document = {
  id: string;
  key: string;
  kind: string;
  title: string;
  aliases: string[];
  summary: string;
  domains: string[];
  publication_visibility: "public" | "unlisted";
  graph_visibility: string;
  status: "current" | "stale" | "disputed";
  page_role: "knowledge" | "synthesis";
  created: string;
  updated: string;
  url: string;
  redirects: string[];
  about: string[];
  retirement: null | {
    mode: "tombstone" | "redirect";
    retired_at: string;
    superseded_by?: string;
    note?: string;
  };
  history: null | {
    publication_year?: number | null;
    event?: { start?: number; end?: number | null; basis?: string; evidence_id?: string | null };
    note?: string;
    layer?: string;
  };
  body: string;
};

type Graph = {
  schema_version: number;
  nodes: Array<{
    key: string;
    type: string;
    labels: Record<string, string>;
    aliases: string[];
    external_ids: Record<string, string>;
    status: string;
    page_id: string;
  }>;
  statements: Statement[];
  backlinks: Record<string, Array<{ source: string; predicate: string; statement: string }>>;
  timeline: Array<{
    document: string;
    publication_year: number | null;
    event_start: number | null;
    event_end: number | null;
    layer: string | null;
  }>;
  parity: Record<string, boolean>;
};

type Routes = {
  pages: Array<{ id: string; url: string; kind: string; publicationVisibility: string; legacyUrls: string[] }>;
  redirects: Record<string, string>;
};

const appRoot = process.cwd();
const repoRoot = path.basename(appRoot) === "app" ? path.dirname(appRoot) : appRoot;
const dataDir = path.join(repoRoot, "data", "build");

export const graph: Graph = JSON.parse(readFileSync(path.join(dataDir, "graph.json"), "utf8"));
export const documents: Document[] = JSON.parse(readFileSync(path.join(dataDir, "documents.json"), "utf8"));
export const routes: Routes = JSON.parse(readFileSync(path.join(repoRoot, "contracts", "routes.json"), "utf8"));

export const docsById = new Map(documents.map((document) => [document.id, document]));
export const docsByKey = new Map(documents.map((document) => [document.key, document]));
export const nodesByKey = new Map(graph.nodes.map((node) => [node.key, node]));
export const publicDocuments = documents.filter((document) => document.publication_visibility === "public");

const base = import.meta.env.BASE_URL || "/";
const aliasMap = new Map<string, string>();

function normalize(value: string) {
  return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

function register(name: string, id: string) {
  const key = normalize(name);
  if (!key || aliasMap.has(key)) return;
  aliasMap.set(key, id);
}

for (const document of documents) {
  register(document.id, document.id);
  register(document.title, document.id);
  for (const alias of document.aliases) register(alias, document.id);
}
for (const node of graph.nodes) {
  if (!node.page_id) continue;
  register(node.key, node.page_id);
  for (const label of Object.values(node.labels || {})) register(label, node.page_id);
  for (const alias of node.aliases) register(alias, node.page_id);
}

export function resolveDocument(name: string): Document | null {
  const target = String(name || "").split("#", 1)[0];
  const id = aliasMap.get(normalize(target));
  return id ? docsById.get(id) || null : null;
}

export function withBase(pathname: string) {
  if (/^https?:\/\//.test(pathname)) return pathname;
  return `${base.replace(/\/$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function documentUrl(document: Document) {
  return withBase(document.url);
}

export function nodeDocument(key: string) {
  const node = nodesByKey.get(key);
  return node ? docsById.get(node.page_id) || null : null;
}

export function outgoing(document: Document) {
  return graph.statements.filter((statement) => statement.document === document.key);
}

export function incoming(document: Document) {
  return graph.backlinks[document.key] || [];
}

export function evidenceSources(statement: Statement) {
  return statement.evidence
    .map((item) => docsById.get(item.source))
    .filter((document): document is Document => Boolean(document));
}
