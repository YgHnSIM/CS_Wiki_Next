import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { exists } from "../shared/fs.mjs";

export async function parseWikiGaps(root = process.cwd()) {
  const file = path.join(root, "wiki", "gaps.md");
  if (!(await exists(file))) {
    return { exists: false, hasMarkers: false, entries: [] };
  }
  const text = await readFile(file, "utf8");
  const hasMarkers = text.includes("<!-- wiki:gaps:start -->") && text.includes("<!-- wiki:gaps:end -->");
  const entries = [];
  const lines = text.split(/\r?\n/);
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^### \[(open|closed)\] ([^\n]+)$/);
    if (heading) {
      if (current) entries.push(current);
      current = {
        status: heading[1],
        key: heading[2].trim(),
        kind: "wanted",
        evidence: "none",
        demand: 1,
        resolution: null
      };
      continue;
    }
    if (current && line.startsWith("- ")) {
      const kv = line.match(/^- ([a-z_]+):\s*(.+)$/);
      if (kv) {
        const [, field, val] = kv;
        if (field === "kind") current.kind = val.trim();
        else if (field === "evidence") current.evidence = val.trim();
        else if (field === "demand") current.demand = Number.parseInt(val.trim(), 10) || 1;
        else if (field === "resolution") current.resolution = val.trim();
      }
    } else if (/^##\s+/.test(line) && current) {
      entries.push(current);
      current = null;
    }
  }
  if (current) entries.push(current);

  return { exists: true, hasMarkers, text, entries };
}

export async function addWikiGap(root, { kind = "wanted", key, evidence = "none", demand = "1", bumpIfOpen = false }) {
  const file = path.join(root, "wiki", "gaps.md");
  const parsed = await parseWikiGaps(root);
  if (!parsed.exists || !parsed.hasMarkers) {
    throw new Error("wiki/gaps.md is missing the wiki:gaps generated block");
  }
  if (!["wanted", "question"].includes(kind)) {
    throw new Error("--kind must be wanted or question");
  }

  const existing = parsed.entries.find((entry) => entry.key === key);
  if (existing) {
    if (bumpIfOpen && existing.status === "open") {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const blockRe = new RegExp(`(^### \\[open\\] ${escapedKey}[\\s\\S]*?- demand:\\s*)(\\d+)`, "m");
      const nextText = parsed.text.replace(blockRe, (_, prefix, count) => `${prefix}${Number(count) + 1}`);
      await writeFile(file, nextText, "utf8");
      return { action: "bumped", key };
    }
    throw new Error(`gap already exists: ${key}`);
  }

  const section = kind === "wanted" ? "## wanted" : "## question";
  const heading = `${section}\n\n### [open] ${key}\n- kind: ${kind}\n- evidence: ${evidence || "none"}\n- demand: ${demand || "1"}\n`;
  const at = parsed.text.indexOf(section);
  if (at < 0) {
    throw new Error(`section not found: ${section}`);
  }
  const next = parsed.text.indexOf("\n## ", at + 1);
  const output = next >= 0
    ? parsed.text.slice(0, next).trimEnd() + "\n\n" + heading + "\n" + parsed.text.slice(next)
    : parsed.text.trimEnd() + "\n\n" + heading + "\n";

  await writeFile(file, output, "utf8");
  return { action: "added", key };
}

export async function closeWikiGap(root, { key, resolution = "resolved" }) {
  const file = path.join(root, "wiki", "gaps.md");
  const parsed = await parseWikiGaps(root);
  if (!parsed.exists || !parsed.hasMarkers) {
    throw new Error("wiki/gaps.md is missing the wiki:gaps generated block");
  }
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = parsed.text.match(new RegExp(`^### \\[open\\] ${escapedKey}$`, "m"));
  if (!match) {
    throw new Error(`open gap not found: ${key}`);
  }
  const closeLine = `- resolution: ${resolution || "resolved"}`;
  let output = parsed.text.replace(match[0], `### [closed] ${key}`);
  const at = output.indexOf(`### [closed] ${key}`);
  const next = output.indexOf("\n### ", at + 1);
  const end = next >= 0 ? next : output.indexOf("\n## closed", at + 1);
  if (end >= 0) {
    output = output.slice(0, end).trimEnd() + "\n" + closeLine + "\n" + output.slice(end);
  }
  await writeFile(file, output, "utf8");
  return { action: "closed", key };
}
