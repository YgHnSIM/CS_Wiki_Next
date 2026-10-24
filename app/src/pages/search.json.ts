import type { APIRoute } from "astro";
import { graph, publicDocuments, withBase } from "../lib/data";

const degree = new Map<string, number>();
for (const statement of graph.statements) {
  degree.set(statement.subject, (degree.get(statement.subject) || 0) + 1);
  degree.set(statement.target, (degree.get(statement.target) || 0) + 1);
}

export const GET: APIRoute = () => {
  const index = publicDocuments.map((document) => ({
    id: document.id,
    title: document.title,
    summary: document.summary,
    url: withBase(document.url),
    kind: document.kind,
    aliases: document.aliases,
    domains: document.domains,
    degree: degree.get(document.key) || 0,
    updated: document.updated,
    status: document.status,
    page_role: document.page_role
  }));
  return new Response(JSON.stringify(index), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
};
