---
schema_version: 3
id: log-2026-10-24-140
kind: meta
title: "2026-10-24 update | Trace 품질 보강 — 연도 4건·근거 1건"
aliases: []
summary: Trace coverage가 지적한 연도 미상·단일 근거를 보강해 단일 근거 step 4→3, 연도 미상 step 14→10으로 줄인 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 적용 내용

### 연도 4건

| 문서 | 대표 연도 | 근거 |
|---|---:|---|
| 처치-튜링 논제 | 1936 | ref-010 |
| 계산 가능성 | 1936 | ref-009 |
| 이식성 | 1978 | ref-021 |
| 장애 감지 | 2004 | ref-119 |

분석 문서는 여러 시대를 비교하므로 한 해로 대표하지 않고 미상으로 유지했다. API는 1968년 컴포넌트 논의를 대표 시점으로 삼기에는 근거가 약해 제외했다.

### 두 번째 근거 1건

- `라이브러리 카탈로그`에 `src-002` (초기 소프트웨어의 탄생) 추가
  - EDSAC 서브루틴·라이브러리·카탈로그를 정리한 기존 소스

## 결과

| 항목 | 이전 | 현재 |
|---|---:|---:|
| Trace 단일 근거 step | 4 | **3** |
| Trace 연도 미상 step | 14 | **10** |
| 전체 연도 미상 공개 문서 | 189 | **185** |
| 전체 단일 근거 공개 지식 | 30 | **29** |

남은 단일 근거 step은 튜링 기계·보편 튜링 기계·정보 은닉이다. 본문에 실제 두 번째 출처가 확인될 때만 보강한다.

## 검증

- `traces:check`: 6 traces, 37 steps, 255 minutes, coverage 15.2%, single 3, undated 10
- `knowledge:quality`: undated 185, single 29, event without evidence 0
- `knowledge:schema`: 440 pages, 0 errors
- `knowledge:sync --check`: 0 pages out of date
