---
schema_version: 3
id: log-2026-10-24-150
kind: meta
title: "2026-10-24 update | LLM 서비스 운영 Trace와 gap report"
aliases: []
summary: LLM 서비스 운영 Trace를 추가해 coverage를 31.1%로 올리고, Trace step에 없는 고연결 문서 gap report를 생성한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 추가한 Trace

`llm-service-operations` — “LLM 서비스는 무엇을 최적화해야 하는가?”

- MLPerf Inference → LLM 서비스 지표 → 대기열과 부하 제어 → 꼬리 지연 → 연속 배칭 → 에너지 지표 → 에너지 비례 컴퓨팅
- 7단계 / 50분
- 모든 step이 dated·multi-evidence라 single/undated 예산을 유지했다.

## Gap report

`npm run traces:gaps`가 `output/trace-gaps.json`·`output/trace-gaps.md`를 생성한다.

- Trace step에 없는 공개 지식: 185
- 상위 gap: 컴퓨팅 능력(19, prerequisite), 프로그래밍 가능성(17), 컴파일러(13), 결함 허용(12), 라이브러리(12), 병렬 확장성(12), 저장 프로그램 컴퓨터(12)

## Coverage

```text
12 traces / 77 steps / 525 minutes
76 / 244 public knowledge (31.1%)
111 referenced documents
single-evidence steps 3
undated steps 24
```

## 검증

- `traces:check`: 12 traces / 77 steps / coverage 31.1% / budget pass
- `site:parity`: 440 docs / 555 redirects / 397 search / 418 sitemap
- `site:links`: 0 broken
- `search:eval`: Top-1 100% / Top-3 100% / MRR 1.000
- 페이지 1,016 → 1,017
- sitemap 417 → 418
