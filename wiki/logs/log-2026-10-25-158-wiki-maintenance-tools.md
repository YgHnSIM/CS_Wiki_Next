---
schema_version: 3
id: log-2026-10-25-158
kind: meta
title: "2026-10-25 update | Wiki lint, index, log, gaps"
aliases: []
summary: LLM Wiki의 index/log/gaps 유지보수 도구와 deterministic wiki:lint를 추가하고 CI에 연결한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- `npm run wiki:index` / `--write`
- `npm run wiki:log` / `--add`
- `npm run wiki:gaps` / `--add` / `--close`
- `npm run wiki:lint` / `--json`
- `wiki/gaps.md` (unlisted hidden)
- CI의 LLM Wiki lint 단계

## 검증

```text
wiki:index 396 public pages, 0 missing
wiki:log   157 listed, 157 files
wiki:lint  442 pages, 0 issues
npm test   19 pass
site       1,020 pages
site:parity 442 docs / 398 search / 420 sitemap
```

## 문서

- `docs/architecture/0013-wiki-maintenance-tools.md`
- `wiki/gaps.md`
