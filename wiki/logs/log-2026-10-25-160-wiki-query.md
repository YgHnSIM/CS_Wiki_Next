---
schema_version: 3
id: log-2026-10-25-160
kind: meta
title: "2026-10-25 update | Wiki query and synthesis"
aliases: []
summary: index/search/relations/evidence를 묶어 citation context를 만들고 synthesis 페이지로 저장하는 wiki:query를 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- `npm run wiki:query -- "질문" [--limit] [--json] [--save]`
- 전체 검색 실패 시 term별 fallback
- evidence locator context packet
- `output/query/*.json`
- `--save` → `wiki/syntheses/analysis-synthesis-*`
- `page_role: synthesis`
- query log

## 구분

- `/archive/` = URL retirement
- `wiki/syntheses/` = query 답변 축적

## 검증

`wiki-query.test.mjs` 1개 통과. 전체 21개.

## 문서

- `docs/architecture/0015-wiki-query.md`
