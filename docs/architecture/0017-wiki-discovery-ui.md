# ADR 0017: Wiki Discovery UI

## 상태

채택 — 2026-10-25

## 배경

LLM Wiki 운영 도구가 생겨도 독자가 문서를 탐색할 때 TOC·근거·필터가 없으면 지식이 평평하게 보인다. Phase 5는 **읽기 경로**를 보강한다.

## 결정

### 문서 TOC

- `extractHeadings`가 `##`/`###` heading을 추출
- markdown renderer가 heading에 동일한 `id`를 부여
- 문서 aside에 CONTENTS 목록 표시
- 깊은 heading은 들여쓰기

### Evidence ledger

- 문서 relation evidence를 aside에 표시
- source 문서 링크
- predicate·locator·quote
- 최대 40개

### 상태 badge

- `status: stale|disputed`
- `page_role: synthesis`

### 검색 필터

`/search/`에 다음 필터를 추가한다.

- 유형: concept/entity/analysis/source/reference/meta
- 분야: domains
- 상태: current/stale/disputed
- 정렬: relevance/updated/degree/title

검색 index에 `updated`, `status`, `page_role`을 추가한다. 필터 상태는 URL query에 반영한다.

## 검증

- site build: 1,020 pages
- `site:parity`: 442 docs / 398 search / 420 sitemap
- `site:links`: 0 broken
- `search:eval`: Top-1 100%, Top-3 100%, MRR 1.000
- `npm test`: 22 pass
- TOC heading id와 anchor 일치 확인

## 하지 않은 것

- 브라우저 기반 필터 E2E
- font selector
- graph canvas
- query 결과를 UI에서 직접 합성하는 챗 UI
