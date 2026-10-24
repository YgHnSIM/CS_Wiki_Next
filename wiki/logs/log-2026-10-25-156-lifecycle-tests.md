---
schema_version: 3
id: log-2026-10-25-156
kind: meta
title: "2026-10-25 update | Lifecycle integration tests"
aliases: []
summary: retire/delete/restore/purge CLI를 임시 fixture에서 검증하는 lifecycle 통합 테스트를 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- `packages/knowledge/tests/lifecycle.test.mjs`
- 임시 디렉터리에서 실제 CLI 실행
- 실제 repository는 변경하지 않음

## 검사

- public 문서 delete 거부
- retire metadata
- archive delete + tombstone + 원문 보존
- restore + tombstone 교체 + removed 제거
- Trace 참조 retire 거부
- `--break-url` 없는 purge 거부
- purge 후 페이지 제거

## 결과

```text
npm test
tests 14
pass 14
```

graph 7 + lifecycle 7.

## 문서

- `docs/architecture/0011-lifecycle-tests.md`
- `docs/architecture/0002-graph-contract.md`
