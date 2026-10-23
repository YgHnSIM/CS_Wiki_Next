import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const source = path.join(repoRoot, "raw", "assets");
const target = path.join(repoRoot, "app", "public", "assets");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log(`assets: ${source} -> ${target}`);
