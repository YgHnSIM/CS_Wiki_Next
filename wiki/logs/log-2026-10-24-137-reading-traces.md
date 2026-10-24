---
schema_version: 3
id: log-2026-10-24-137
kind: meta
title: "2026-10-24 update | Reading Trace 3개와 Workbench 경로 UI"
aliases: []
summary: 질문에서 출발해 원본·개념·분석을 잇는 Reading Trace 3개를 추가하고, /traces/ 페이지·사이드바·command palette·문서 역링크·localStorage 진도를 연결한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 배경

기존 “학습 경로”는 문서 목록을 난이도별로 나누는 방식에 가까웠다. CS Wiki의 콘텐츠 구조는 질문 → 원본 → 개념 → 분석의 연결이므로, 정적 목록 대신 **Reading Trace**를 도입했다.

## 추가한 Trace

| ID | 질문 | 단계 | 시간 |
|---|---|---:|---:|
| `computation` | 기계가 계산한다는 말은 무엇을 보장하는가? | 6 | 40분 |
| `performance` | 왜 빠른 CPU가 빠른 프로그램을 보장하지 않는가? | 6 | 45분 |
| `unix-legacy` | Unix와 C는 왜 오래 살아남았는가? | 6 | 35분 |

## 데이터 계약

- canonical: `catalog/traces.json`
- JSON Schema: `schema/trace.schema.json`
- 검증: `npm run traces:check`
- 각 trace: 질문, 결과, 대상, 시간, 선행 문서, 3~8단계, 분기
- 각 단계: 문서 key, 역할, 읽는 이유, 체크포인트(질문·답·근거)
- 모든 문서·근거는 public이고 Registry에 존재해야 한다.

## UI

- `/traces/` 인덱스와 `/traces/{id}/` 상세
- Workbench 사이드바 `TRACES`
- Command Palette의 `Trace: ...` 항목
- 홈 `읽기 트레이스` strip
- 문서 페이지 `TRACES` 역링크
- 단계별 `읽음` 버튼과 localStorage 진도
- 체크포인트 접기/펼치기

## 라우트·검증

- 페이지 1,001 → **1,005**
- sitemap 402 → **406**
- search records 397 유지
- `traces:check`: 3 traces, 18 steps, 120 minutes
- `site:parity`: 440 docs / 555 redirects / 397 search / 406 sitemap
- `site:links`: 0 broken
- `npm test`: 5 pass
- CI에 `traces:check` 추가

## 후속

- Trace 추가: 장애·복구, LLM 서빙 비용, 소프트웨어 재사용
- 그래프 기반 동적 경로 탐색
- 체크포인트 답안의 접근성·인쇄 스타일 점검
