---
schema_version: 3
id: log-2026-10-25-157
kind: meta
title: "2026-10-25 update | LLM Wiki 운영 프로토콜"
aliases: []
summary: LLM Wiki의 ingest/query/lint 루프를 CS Wiki Next의 typed graph 위에 적용하는 운영 프로토콜과 schema 필드를 확정한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 결정

- LLM 서비스를 만들지 않고 에이전트-native workflow로 운영
- `raw/` 불변, `wiki/` 합성, `data/build` 파생
- `relations` + evidence를 canonical로 유지
- ingest는 proposal → 승인 → apply
- query는 기본적으로 파일을 쓰지 않고 citation을 붙임
- 지식 대체는 `status: stale` + `superseded_by`
- URL 은퇴는 기존 `content:retire`/`content:delete` 유지

## Schema

- `status`: current | stale | disputed
- `page_role`: knowledge | synthesis
- 기존 문서는 current/knowledge로 해석

## 문서

- `docs/architecture/0012-llm-wiki-operations.md`
- `AGENTS.md`의 LLM Wiki 운영 섹션

## 다음

Phase 1: `wiki:lint`, `wiki:index`, `wiki:log`, `wiki:gaps`
