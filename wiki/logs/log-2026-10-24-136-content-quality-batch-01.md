---
schema_version: 3
id: log-2026-10-24-136
kind: meta
title: "2026-10-24 update | 콘텐츠 품질 배치 01 — 연도·근거 정합성"
aliases: []
summary: 백업에서 근거가 확인된 33개 연도 기록을 재검토해 적용하고, 사건 연도 근거 8건과 관계 근거 12건의 evidence_ids를 보강한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 작업 배경

콘텐츠 품질 감사에서 공개 문서 397개 중 217개가 연도 미상이었고, 사건 연도에 `evidence_id`가 없는 문서 8개, 관계 근거가 `evidence_ids` 밖에 있는 문서 12개가 남아 있었다.

## 적용 내용

### 1. 근거 있는 연도 33건

2026-10-24 백업에 남아 있던 연도 보강 후보를 현재 문서와 대조해, 다음 조건을 만족하는 33건만 적용했다.

- 현재 `history`에 연도가 없을 것
- 백업의 연도에 `evidence_id` 또는 출판 연도 근거가 있을 것
- 대상 문서와 근거 소스가 현재 Registry에 존재할 것

적용 예:

- `ASLR` — 2003, PaX Team 설계 문서 (`ref-137`)
- `캐시 메모리` — 1965, Wilkes 논문 (`ref-043`)
- `앨런 튜링` — 1936–1937, 계산 가능성 논문 (`ref-009`)
- `토머스 홉스` — 1655, *Elementorum* (`ref-143`)

### 2. 사건 연도 evidence 8건

소스 페이지 자체가 그 사건의 근거인 8개 문서에 `history.event.evidence_id`를 자기 ID로 지정했다.

- Manchester Baby (`ref-007`)
- On Computable Numbers (`ref-009`)
- Koomey (`ref-047`)
- IEEE 754 (`ref-051`)
- Handbook of Mathematical Functions (`ref-054`)
- Math Tables Project (`ref-057`)
- SEAC (`ref-059`)
- VisiCalc (`ref-061`)

### 3. 관계 근거 12건

관계 표에는 인용됐지만 `evidence_ids`에 빠져 있던 소스 12건을 해당 문서의 `evidence_ids`에 추가했다.

## 결과

| 항목 | 이전 | 현재 |
|---|---:|---:|
| 연도 미상 공개 문서 | 217 | **189** |
| 사건 연도 근거 없음 | 8 | **0** |
| 관계 근거가 evidence_ids 밖 | 12 | **0** |
| 본문 링크 포함 고아 | 0 | 0 |
| 단일 근거 공개 지식 | 30 | 30 |

`knowledge:quality`의 고아 판정은 relation backlink뿐 아니라 본문 위키링크 유입까지 포함한다.

## 검증

- `knowledge:quality`: 397 public docs, 244 public knowledge, undated 189, event without evidence 0, relation evidence outside 0
- `knowledge:schema`: 440 pages, 0 errors
- `knowledge:sync --check`: 0 pages out of date
- `knowledge:check`: 440 nodes, 2,669 aliases, 79 reviewed
- `npm test`: 5 pass

## 후속

- 남은 연도 미상 189개는 분석 55개, 개념 101개, 인물 24개 등이다. 한 해로 대표하기 어려운 분석·계속 개정되는 명세는 미상으로 둔다.
- 단일 근거 30개는 본문에 두 번째 소스가 실제로 인용될 때만 보강한다.
- 관계 그래프만 기준으로 한 고아는 별도 지표로 추적하되, 본문 링크가 있으면 고아로 보지 않는다.
