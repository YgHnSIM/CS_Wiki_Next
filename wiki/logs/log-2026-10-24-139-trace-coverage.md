---
schema_version: 3
id: log-2026-10-24-139
kind: meta
title: "2026-10-24 update | Reading Trace 3개 추가와 coverage 리포트"
aliases: []
summary: 장애와 복구, LLM 서빙, 소프트웨어 재사용 Trace를 추가하고, traces:check에 public knowledge coverage·단일 근거·연도 미상 리포트를 붙인 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 추가한 Trace

| ID | 질문 | 단계 | 시간 |
|---|---|---:|---:|
| `failure-recovery` | 장애는 왜 감지와 복구 사이에서 더 어려워지는가? | 6 | 45분 |
| `llm-serving` | LLM 서빙 비용은 왜 GPU 연산량만으로 설명되지 않는가? | 6 | 50분 |
| `software-reuse` | 소프트웨어 재사용은 왜 라이브러리 복사에서 인터페이스 문제가 되었는가? | 7 | 40분 |

## Coverage

`npm run traces:check`가 `output/trace-coverage.json`을 생성한다.

- traces: 6
- steps: 37
- minutes: 255
- public knowledge: 244
- unique step documents: 37 (15.2%)
- referenced documents: 57
- roles: source 13 / concept 15 / analysis 9
- single-evidence steps: 4
- undated steps: 14

## UI

- `/traces/` 상단에 coverage bar와 `single-evidence`·`undated` 카운트 표시
- 사이드바 Trace 제목을 한 줄로 줄이고 title tooltip 유지
- 6개 Trace 카드와 홈 trace strip

## 라우트·검증

- 페이지 1,008 → **1,011**
- sitemap 409 → **412**
- search records 397 유지
- `traces:check`: 6 traces / 37 steps / 255 minutes / coverage 15.2%
- `site:parity`: 440 docs / 555 redirects / 397 search / 412 sitemap
- `site:links`: 0 broken
- `npm test`: 5 pass

## 후속

- `single-evidence steps` 4건의 두 번째 근거 확인
- `undated steps` 14건 중 근거 있는 연도만 보강
- 동적 경로 탐색은 정적 Trace 품질 확인 후
