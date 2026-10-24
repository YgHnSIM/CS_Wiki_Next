# ADR 0006: Search Quality

## 상태

채택 — 2026-10-24

## 배경

Command Palette가 주 탐색이 되면서 검색 품질이 사이트 전체 경험을 좌우하게 되었다. 기존 검색은 `search.json`을 단순 substring으로 필터링해 문서 순서에 따라 결과가 달라졌고, 품질을 측정하는 기준도 없었다.

## 결정

### 1. 공유 랭킹 모듈

`app/src/lib/search.mjs`의 `rankSearch()`를 검색 페이지와 Command Palette가 함께 사용한다.

- NFKC 정규화, 소문자화, 구두점 제거, 공백 정리
- 제목 > 별칭 > 요약 > 도메인 순 가중치
- 공백을 제거한 compact match
- 동의어: `cpu ↔ 프로세서`, `postmortem ↔ 포스트모템`, `utm`, `aslr`
- concept/entity/analysis에 kind 가중치
- degree를 tie-breaker로 사용

### 2. 검색 평가 세트

`app/scripts/eval-search.mjs`가 32개 쿼리의 Top-1, Top-3, MRR을 측정한다.

- 한국어 제목
- 영어 제목·별칭 (`Turing Machine`, `UTM`, `RTL`)
- 띄어쓰기 변형 (`폰노이만`)
- 질문형 (`왜 빠른 CPU`)
- 동의어 (`failure detector`, `postmortem`)
- CI 기준: Top-1 ≥ 80%, Top-3 ≥ 90%

`npm run search:eval`은 `site:build` 후 실행한다.

### 3. URL·결과 그룹

- `/search/?q=...`로 검색어를 공유할 수 있다.
- 검색 페이지는 문서 결과와 **관련 경로(Trace/Guide)** 를 함께 보여준다.
- Command Palette는 `PATHS`와 `DOCUMENTS` 그룹으로 나눈다.
- 결과가 없어도 관련 Trace/Guide가 있으면 경로를 제안한다.

### 4. 접근성

- Command Palette는 `role="dialog"`, `aria-modal`, `aria-activedescendant`를 사용한다.
- 방향키로 결과를 이동하고 Enter로 연다.
- Tab/Shift+Tab은 palette 내부에서 순환한다.
- Escape로 닫으면 이전 포커스로 돌아간다.

## 결과

```text
Search eval: 32 queries
Top-1: 32/32 (100.0%)
Top-3: 32/32 (100.0%)
MRR: 1.000
```

## 하지 않은 것

- 서버 검색 로그 수집
- 개인화·세션 기반 랭킹
- 검색 결과 광고·추천
- 본문 전체 인덱싱 (search.json은 제목·요약·별칭·도메인만 사용)
