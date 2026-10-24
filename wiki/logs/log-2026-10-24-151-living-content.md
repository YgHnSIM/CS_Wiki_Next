---
schema_version: 3
id: log-2026-10-24-151
kind: meta
title: "2026-10-24 update | Living content baseline 분리"
aliases: []
summary: migration-baseline.json을 분리하고, CI에서 440/887/397/418 절대 총량 검사를 제거해 새 문서 추가를 정상 workflow로 만든 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 변경

- `contracts/parity.json` 제거
- `contracts/migration-baseline.json` 추가
  - 440 documents / 397 public / 43 unlisted / 362 relation docs / 887 statements / 555 redirects
  - 역사적 스냅샷, 현재 콘텐츠의 하한으로만 사용
- `contracts/routes.json`은 legacy 440 URL·555 redirect map으로 유지
- 새 문서는 route entry 없이 `/docs/{id}/` fallback URL을 얻음

## CI

- `graph.test`: 정확한 440/887/555 대신 `>= baseline`
- 기존 440 route의 문서 존재 테스트 추가
- `check-routes`: 현재 `data/build/documents.json` 기준으로 문서 page·search·sitemap 무결성 검사
- search records = 현재 public documents
- sitemap = 현재 public documents + static pages
- 절대 397 search / 418 sitemap 제거

## 새 문서 검증

임시 문서 `concept-living-test`를 추가해 확인:

```text
knowledge:seed     441 pages / 441 nodes
knowledge:build    441 documents / 887 statements
site:build         1,018 pages
site:parity        441 docs / 555 redirects / 398 search / 419 sitemap
npm test           7 pass
```

확인 후 임시 문서와 registry 변경을 제거하고 440 기준으로 복구했다.

## 문서

- `docs/architecture/0008-living-content.md`
- `contracts/README.md`
- `docs/architecture/0002-graph-contract.md`
