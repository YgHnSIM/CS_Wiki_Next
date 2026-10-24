import { readFile } from "node:fs/promises";
import path from "node:path";
import { rankSearch } from "../src/lib/search.mjs";

const root = process.cwd();
const index = JSON.parse(await readFile(path.join(root, "app", "dist", "search.json"), "utf8"));

const queries = [
  ["튜링 기계", ["튜링 기계"]],
  ["Turing Machine", ["튜링 기계"]],
  ["UTM", ["보편 튜링 기계"]],
  ["universal turing machine", ["보편 튜링 기계"]],
  ["보편 튜링 기계", ["보편 튜링 기계"]],
  ["처치-튜링 논제", ["처치-튜링 논제"]],
  ["Church-Turing", ["처치-튜링 논제"]],
  ["가용성과 복구", ["가용성과 복구"]],
  ["장애 감지", ["장애 감지"]],
  ["failure detector", ["장애 감지"]],
  ["비잔틴 장애", ["비잔틴 장애"]],
  ["캐시 메모리", ["캐시 메모리"]],
  ["memory wall", ["메모리 장벽"]],
  ["메모리 장벽", ["메모리 장벽"]],
  ["ASLR", ["ASLR (Address Space Layout Randomization)"]],
  ["address space layout randomization", ["ASLR (Address Space Layout Randomization)"]],
  ["폰노이만", ["폰 노이만 구조"]],
  ["폰 노이만 구조", ["폰 노이만 구조"]],
  ["Unix", ["Unix"]],
  ["C 언어", ["C 언어"]],
  ["이식성", ["이식성"]],
  ["LLM 서빙", ["LLM 서빙에서 처리량과 지연은 왜 함께 움직이는가"]],
  ["KV 캐시", ["KV 캐시"]],
  ["프리필과 디코드", ["프리필과 디코드"]],
  ["정보 은닉", ["정보 은닉"]],
  ["라이브러리 카탈로그", ["라이브러리 카탈로그"]],
  ["서브루틴", ["서브루틴"]],
  ["API", ["API"]],
  ["왜 빠른 CPU", ["더 빠른 프로세서는 왜 더 빠른 프로그램을 보장하지 않는가"]],
  ["PagedAttention", ["Efficient Memory Management for Large Language Model Serving with PagedAttention"]],
  ["Roofline", ["Roofline An Insightful Visual Performance Model"]],
  ["postmortem", ["포스트모템 루틴"]]
];

let top1 = 0;
let top3 = 0;
let reciprocal = 0;
const failures = [];
for (const [query, expected] of queries) {
  const ranked = rankSearch(index, query).map((entry) => entry.item.title);
  const rank = ranked.findIndex((title) => expected.includes(title));
  if (rank === 0) top1 += 1;
  if (rank >= 0 && rank < 3) top3 += 1;
  if (rank >= 0) reciprocal += 1 / (rank + 1);
  if (rank < 0 || rank >= 3) failures.push({ query, expected: expected[0], actual: ranked.slice(0, 3) });
}
const total = queries.length;
const top1Rate = top1 / total;
const top3Rate = top3 / total;
const mrr = reciprocal / total;

console.log(`Search eval: ${total} queries`);
console.log(`Top-1: ${top1}/${total} (${(top1Rate * 100).toFixed(1)}%)`);
console.log(`Top-3: ${top3}/${total} (${(top3Rate * 100).toFixed(1)}%)`);
console.log(`MRR: ${mrr.toFixed(3)}`);
if (failures.length) {
  console.log("Misses:");
  for (const failure of failures) console.log(`- ${failure.query} → ${failure.actual.join(" | ")}`);
}

const minimumTop1 = 0.8;
const minimumTop3 = 0.9;
if (top1Rate < minimumTop1 || top3Rate < minimumTop3) {
  console.error(`Search eval failed: need top-1 >= ${minimumTop1} and top-3 >= ${minimumTop3}`);
  process.exitCode = 1;
}
