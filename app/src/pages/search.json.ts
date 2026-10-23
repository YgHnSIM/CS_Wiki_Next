import type { APIRoute } from "astro";
import { publicDocuments, withBase } from "../lib/data";

export const GET: APIRoute = () => {
  const index = publicDocuments.map((document) => ({
    title: document.title,
    summary: document.summary,
    url: withBase(document.url),
    kind: document.kind,
    aliases: document.aliases,
    domains: document.domains
  }));
  return new Response(JSON.stringify(index), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
};
