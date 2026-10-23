import type { APIRoute } from "astro";
import { withBase } from "../lib/data";

export const GET: APIRoute = ({ site }) => {
  const origin = site || new URL("http://localhost:4321");
  const sitemap = new URL(withBase("/sitemap.xml"), origin).href;
  const body = [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${sitemap}`,
    ""
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
};
