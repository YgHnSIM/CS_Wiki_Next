---
schema_version: 3
id: log-2026-10-24-152
kind: meta
title: "2026-10-24 update | Content retirement workflow"
aliases: []
summary: 기존 URL을 유지하는 tombstone/redirect content:retire CLI와 retirement 스키마·문서 페이지 처리를 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 추가

- `npm run content:retire -- --id <id> --mode tombstone`
- `npm run content:retire -- --id <id> --mode redirect --to <id|key>`
- `retirement` frontmatter schema
- retired 문서의 noindex·안내·redirect meta refresh
- 기존 `contracts/routes.json`과 migration baseline은 유지

## 검증

임시 문서 2개로 확인했다.

```text
tombstone: noindex / 은퇴 안내 / refresh 없음
redirect:  noindex / 은퇴 안내 / refresh 있음
site:parity 442 docs / 555 redirects / 397 search / 418 sitemap
```

확인 후 임시 문서와 registry 변경을 제거하고 440 기준으로 복구했다.

## 문서

- `docs/architecture/0009-retirement.md`
- `schema/wiki-page.schema.json`
- `app/src/pages/docs/[id].astro`
