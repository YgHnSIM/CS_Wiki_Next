---
schema_version: 3
id: log-2026-10-24-141
kind: meta
title: "2026-10-24 update | 검색 P0 — 공유 랭킹·평가·Command Palette 접근성"
aliases: []
summary: 검색 랭킹을 공유 모듈로 분리하고 32개 쿼리 평가, ?q= URL, Trace/Guide 그룹, Command Palette 포커스 트랩을 적용한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 적용 내용

### 랭킹

- `app/src/lib/search.mjs`의 `rankSearch()`를 검색 페이지와 Command Palette가 공유
- NFKC 정규화, 소문자화, 구두점 제거, 공백 정리
- 제목 > 별칭 > 요약 > 도메인 가중치
- 공백 제거 compact match
- 동의어: cpu↔프로세서, postmortem↔포스트모템, UTM, ASLR
- concept/entity/analysis kind 가중치, degree tie-breaker

### 평가

- `app/scripts/eval-search.mjs`: 32개 쿼리
- 지표: Top-1, Top-3, MRR
- CI 기준: Top-1 ≥ 80%, Top-3 ≥ 90%
- 결과: Top-1 32/32, Top-3 32/32, MRR 1.000

### 검색 UX

- `/search/?q=...` 검색어 공유
- 검색 결과에 관련 Trace/Guide 경로 제안
- 0건일 때 경로 카드 유지
- Command Palette를 `PATHS` / `DOCUMENTS` 그룹으로 분리
- `aria-activedescendant`, `aria-selected`, Tab/Shift+Tab 포커스 트랩, Escape 포커스 복귀

## 검증

- `npm run search:eval`: 32 queries / Top-1 100% / Top-3 100% / MRR 1.000
- `site:parity`: 440 docs / 555 redirects / 397 search / 412 sitemap
- `site:links`: 0 broken
- `npm test`: 5 pass
- CI에 `search:eval` 추가

## 하지 않은 것

- 서버 검색 로그 수집
- 개인화 랭킹
- 본문 전체 인덱싱
