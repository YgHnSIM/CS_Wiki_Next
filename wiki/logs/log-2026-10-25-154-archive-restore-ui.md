---
schema_version: 3
id: log-2026-10-25-154
kind: meta
title: "2026-10-25 update | Archive restore와 Archive 목록 UI"
aliases: []
summary: archive 원문 복원 CLI와 /archive/ retired/archived/purged 목록 UI를 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- `npm run content:restore -- --id <id> [--public]`
  - archive 원문을 원래 wiki 경로로 복원
  - tombstone 페이지를 교체
  - removed registry에서 제거
- `/archive/`
  - RETIRED
  - ARCHIVED
  - PURGED
- 사이드바 Archive 링크와 개수
- sitemap `/archive/`

## 검증

임시 문서로 archive → restore를 확인했다.

```text
archive: tombstone + noindex + archive 원문
restore: tombstone 교체 + retirement 제거 + archive 삭제 + registry 제거
site:parity 441 docs / 555 redirects / 397 search / 419 sitemap
npm test 7 pass
```

확인 후 임시 문서·registry·removed entry를 제거했다.

## 문서

- `docs/architecture/0010-archive-purge.md`
- `app/src/pages/archive.astro`
- `packages/knowledge/src/cli/restore.mjs`
