---
schema_version: 3
id: log-2026-10-24-145
kind: meta
title: "2026-10-24 update | 접근성·성능 점검"
aliases: []
summary: Command Palette·Trace 진행률 ARIA, 인쇄 스타일, 대비 조정, 이미지 decoding, 색인 content-visibility를 적용하고 HTML·CSS·검색 인덱스 크기를 측정한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-24
updated: 2026-10-24
evidence_ids: []
capability_layers: []
---

## 접근성

- Command Palette: dialog label, `aria-controls`, `aria-activedescendant`, group role, `aria-expanded`, focus trap, Escape 복귀
- Trace: progressbar role와 `aria-valuenow`/`aria-valuetext`, 읽음 버튼 label
- 문서 관계 rail label, 검색 입력 label
- muted 대비 `#858585` → `#9a9a9a`
- 인쇄 시 Workbench chrome 숨김
- Markdown 이미지 `decoding="async"`

## 성능

| 항목 | 값 |
|---|---:|
| HTML | 1,022 files / 16.64 MB / avg 16.7 KB |
| CSS | 27 KB |
| Base JS | 2.6 KB |
| search.json | 181 KB |

- 검색 인덱스는 Command Palette 최초 open 시에만 fetch
- 색인 행에 `content-visibility:auto`
- 이미지 lazy loading 유지

## 검증

- 390px 뷰포트 7개 대표 페이지 가로 overflow 0
- alt 없는 이미지 0
- 접근 가능한 이름 없는 버튼·링크 0
- 중복 id 0
- print media에서 sidebar `display:none`, editor overflow `visible`
- `site:parity`: 440 docs / 555 redirects / 397 search / 416 sitemap
- `search:eval`: Top-1 100% / Top-3 100% / MRR 1.000

## 남은 것

- Google Fonts 의존
- 실제 스크린리더 수동 테스트
- Lighthouse CI 도입 여부
