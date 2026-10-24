# Astro app

공개 사이트: https://yghnsim.github.io/CS_Wiki_Next/

`data/build/graph.json`과 `documents.json`만 읽어 정적 사이트를 만든다. Markdown을 다시 파싱하지 않는다.

## 디자인

- “VS Code Workbench” 셸: activity bar, explorer, tabs, breadcrumb, status bar
- 문서 본문은 man page 스타일: `CSWIKI(1)` 헤더, `##`/`###` 프리픽스, RELATIONS/BACKLINKS rail
- 검색은 `Ctrl/Cmd+K` command palette와 `/search/` 페이지를 함께 사용
- 검색 랭킹은 `src/lib/search.mjs`를 공유하며, `npm run search:eval`이 Top-1/Top-3/MRR을 검사
- `/search/?q=...`로 검색어를 공유하고, 결과에 Trace/Guide 경로를 함께 제안
- Reading Trace: `catalog/traces.json`을 읽어 `/traces/`와 `/traces/{id}/`를 생성하고, 진도는 localStorage에만 저장
- `npm run traces:review`가 70개 체크포인트 검수용 `output/trace-checkpoints.md`를 생성
- `npm run traces:gaps`가 Trace step에 없는 고연결 문서 목록을 생성
- Guides: `/guides/reading/`과 `/guides/evidence/`에서 문서 층위와 근거 읽기 안내
- 색인은 explorer형 compact file list
- Command Palette·Trace 진행률은 키보드/스크린리더용 ARIA를 갖추고, 인쇄 시 Workbench chrome을 숨김
- IBM Plex Mono / Noto Sans KR 사용, VS Code Dark+ 계열 팔레트

## 실행

루트에서 실행한다.

```bash
npm run knowledge:build
npm run site:build
npm run site:parity
npm run site:links
```

- `site:build`: 그래프 생성 → `raw/assets` 복사 → `astro build`
- 결과: `app/dist`
- 기본 URL: `http://localhost:4321`
- 기본 base: `/`

배포 경로를 바꿀 때:

```powershell
$env:SITE_BASE="/CS_Wiki_Next"
$env:SITE_URL="https://yghnsim.github.io"
npm run site:build
npm run site:parity
npm run site:links
```

## 라우트

| 경로 | 내용 |
|---|---|
| `/` | 홈 |
| `/index/` | 공개 문서 색인 |
| `/docs/{id}/` | 현재 build의 모든 문서 |
| `/history/` | 역사 렌즈 |
| `/evidence/` | 근거 렌즈 |
| `/search/` | 검색 |
| `/search.json` | 검색 인덱스 |
| `/sitemap.xml` | 공개 URL sitemap |
| `/robots.txt` | robots |
| 기존 555개 URL | meta refresh 리디렉션 |
| `/404.html` | 404 |

## 데이터

- `app/src/lib/data.ts`: graph/documents/routes 로더
- `app/src/lib/markdown.mjs`: Markdown + `[[wiki link]]` + `![[asset]]` 렌더러
- `app/src/pages/docs/[id].astro`: 문서 페이지
- `app/src/pages/[...legacy].astro`: 기존 URL 리디렉션
- `app/scripts/check-routes.mjs`: 현재 docs/search/sitemap 무결성과 legacy redirect 검사
- `content:retire`: 기존 URL을 유지한 tombstone/redirect 은퇴 처리
- `app/scripts/check-links.mjs`: 내부 링크 검사

## 현재 범위

Phase 3 코어다. 문서·색인·검색·기본 렌즈·리디렉션은 동작한다. 기존 사이트의 그래프 캔버스·연결 경로 탐색기·학습 경로는 Phase 3.1에서 그래프 위에 다시 구현한다.
