import { defineConfig } from "astro/config";

const base = process.env.SITE_BASE || "/";
const site = process.env.SITE_URL || "http://localhost:4321";

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory"
  }
});
