---
schema_version: 3
id: log-2026-10-25-159
kind: meta
title: "2026-10-25 update | Wiki ingest"
aliases: []
summary: raw 복사·source skeleton·proposal·log를 자동화하는 wiki:ingest를 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- `npm run wiki:ingest -- --source <url|path> --id src-151`
- local raw copy + SHA-256/bytes/media_type
- source page skeleton
- `output/ingest/<id>.json` proposal
- ingest log entry
- `--dry-run`

## 범위

- 본문 요약·relation 작성은 에이전트가 한다.
- `--apply`는 의도적으로 두지 않는다. proposal 검토 후 `knowledge:seed`/`wiki:index --write`/`wiki:lint`로 적용한다.

## 검증

`wiki-ingest.test.mjs` 1개 통과. 전체 20개.

## 문서

- `docs/architecture/0014-wiki-ingest.md`
