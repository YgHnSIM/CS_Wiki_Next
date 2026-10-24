import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const file = path.join(root, "wiki", "gaps.md");
const text = await readFile(file, "utf8");

if (!text.includes("<!-- wiki:gaps:start -->") || !text.includes("<!-- wiki:gaps:end -->")) {
  console.error("wiki/gaps.md is missing the wiki:gaps generated block");
  process.exit(1);
}

const entries = [...text.matchAll(/^### \[(open|closed)\] ([^\n]+)$/gm)].map((match) => ({
  status: match[1],
  key: match[2].trim()
}));

if (args.includes("--list")) {
  for (const entry of entries) console.log(`${entry.status === "open" ? "open" : "closed"}\t${entry.key}`);
  process.exit(0);
}

const add = args.includes("--add");
const close = args.includes("--close");
const key = value("key");
if (!key) {
  console.error("Usage: wiki:gaps --add --kind wanted|question --key <key> [--evidence <text>] [--demand N]");
  console.error("       wiki:gaps --close --key <key> [--resolution <text>]");
  process.exit(1);
}

let output = text;
if (add) {
  const kind = value("kind") || "wanted";
  if (!["wanted", "question"].includes(kind)) {
    console.error("--kind must be wanted or question");
    process.exit(1);
  }
  if (entries.some((entry) => entry.key === key)) {
    console.error(`gap already exists: ${key}`);
    process.exit(1);
  }
  const section = kind === "wanted" ? "## wanted" : "## question";
  const heading = `${section}\n\n### [open] ${key}\n- kind: ${kind}\n- evidence: ${value("evidence") || "none"}\n- demand: ${value("demand") || "1"}\n`;
  const at = output.indexOf(section);
  if (at < 0) {
    console.error(`section not found: ${section}`);
    process.exit(1);
  }
  const next = output.indexOf("\n## ", at + 1);
  output = next >= 0
    ? output.slice(0, next).trimEnd() + "\n\n" + heading + "\n" + output.slice(next)
    : output.trimEnd() + "\n\n" + heading + "\n";
} else if (close) {
  const match = output.match(new RegExp(`^### \\[open\\] ${key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "m"));
  if (!match) {
    console.error(`open gap not found: ${key}`);
    process.exit(1);
  }
  const closeLine = `- resolution: ${value("resolution") || "resolved"}`;
  output = output.replace(match[0], `### [closed] ${key}`);
  const at = output.indexOf(`### [closed] ${key}`);
  const next = output.indexOf("\n### ", at + 1);
  const end = next >= 0 ? next : output.indexOf("\n## closed", at + 1);
  if (end >= 0) output = output.slice(0, end).trimEnd() + "\n" + closeLine + "\n" + output.slice(end);
}

await writeFile(file, output, "utf8");
console.log(`${key} ${add ? "added" : "closed"}`);
