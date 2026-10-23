import type { APIRoute } from "astro";
import { publicDocuments, withBase } from "../lib/data";

const staticPaths = ["/", "/index/", "/history/", "/evidence/", "/search/"];

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const GET: APIRoute = ({ site }) => {
  const origin = site || new URL("http://localhost:4321");
  const entries = [
    ...publicDocuments.map((document) => ({
      loc: new URL(withBase(document.url), origin).href,
      lastmod: document.updated
    })),
    ...staticPaths.map((path) => ({
      loc: new URL(withBase(path), origin).href,
      lastmod: null
    }))
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => [
      "<url>",
      `<loc>${escapeXml(entry.loc)}</loc>`,
      entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "",
      "</url>"
    ].filter(Boolean).join("")),
    "</urlset>"
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" }
  });
};
