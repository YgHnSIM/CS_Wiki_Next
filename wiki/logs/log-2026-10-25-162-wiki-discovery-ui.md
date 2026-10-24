---
schema_version: 3
id: log-2026-10-25-162
kind: meta
title: "2026-10-25 update | Wiki discovery UI"
aliases: []
summary: 문서 TOC·evidence ledger·상태 badge와 검색 유형/분야/상태/정렬 필터를 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- 문서 heading anchor와 CONTENTS
- EVIDENCE ledger (source/locator/quote)
- stale/disputed/synthesis badge
- `/search/` 필터
  - kind
  - domain
  - status
  - sort
- search index의 updated/status/page_role

## 검증

```text
site 1,020 pages
parity 442 docs / 398 search / 420 sitemap
links 0 broken
search eval Top-1 100% / Top-3 100% / MRR 1.000
npm test 22 pass
```

## 문서

- `docs/architecture/0017-wiki-discovery-ui.md`
