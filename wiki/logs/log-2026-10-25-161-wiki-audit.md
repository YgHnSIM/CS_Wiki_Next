---
schema_version: 3
id: log-2026-10-25-161
kind: meta
title: "2026-10-25 update | Wiki audit and semantic lint"
aliases: []
summary: raw 원문 대비 claim literal을 검사하는 wiki:audit와 orphan·stale 표시를 보고하는 semantic lint를 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- `npm run wiki:audit -- --id <id> [--json] [--strict]`
- local raw의 숫자·연도·quote 검사
- `output/audit/<id>.json`
- `npm run wiki:lint -- --semantic`
  - orphan
  - stale index 표시
  - disputed 표시
- CI semantic lint

## 원칙

- audit은 보고만 하고 본문을 수정하지 않는다.
- semantic warning은 exit 1이 아니다.
- `found: false`는 수정 지시가 아니라 agent 검토 후보다.

## 검증

`wiki-audit.test.mjs` 1개 통과. 전체 22개.

## 문서

- `docs/architecture/0016-wiki-audit.md`
