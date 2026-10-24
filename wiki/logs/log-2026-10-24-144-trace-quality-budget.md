---
schema_version: 3
id: log-2026-10-24-144
kind: meta
title: "2026-10-24 update | Trace quality budget"
aliases: []
summary: traces:check에 coverage 25%·단일 근거 3·연도 미상 24의 quality budget을 추가해 이후 Trace 확장에서 품질 회귀를 막도록 한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 적용

`traces:check`가 다음 예산을 검사한다.

| 지표 | 기준 |
|---|---:|
| coverage | ≥ 25% |
| single-evidence step | ≤ 3 |
| undated step | ≤ 24 |

현재 값은 모두 통과한다.

```text
10 traces / 63 steps / 430 minutes
62 / 244 public knowledge (25.4%)
single-evidence steps 3
undated steps 24
```

## 이유

Trace를 추가할수록 coverage는 오르지만, 단일 근거·연도 미상 문서도 함께 들어올 수 있다. 예산을 명시해 새 Trace가 기존 품질을 조용히 악화시키지 못하게 한다.

## 후속

- 단일 근거 3건은 실제 두 번째 출처가 확인될 때만 보강
- 연도 미상 24건은 분석·광의 개념을 억지로 채우지 않음
- 기준을 갱신할 때는 근거와 함께 예산을 의도적으로 변경
