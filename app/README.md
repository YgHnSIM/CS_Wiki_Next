# Astro app

공개 사이트: https://yghnsim.github.io/CS_Wiki_Next/

`data/build/graph.json`과 `documents.json`만 읽어 정적 사이트를 만든다. Markdown을 다시 파싱하지 않는다.

## 디자인

- 홈·문서 페이지: 기존 CS Wiki의 터미널 스타일(D2Coding, green/amber, article rail·prose, hero circuit)을 복원
- 색인·검색: 단순한 새 UI 유지
- 홈은 `home-page`·`legacy-home.css`, 문서는 `legacy-page`·`legacy-doc.css`로 테마를 분리

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
| `/docs/{id}/` | 440개 문서 |
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
- `app/scripts/check-routes.mjs`: 440/555/397 parity
- `app/scripts/check-links.mjs`: 내부 링크 검사

## 현재 범위

Phase 3 코어다. 문서·색인·검색·기본 렌즈·리디렉션은 동작한다. 기존 사이트의 그래프 캔버스·연결 경로 탐색기·학습 경로는 Phase 3.1에서 그래프 위에 다시 구현한다.
