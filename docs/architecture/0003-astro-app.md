# Astro app contract

공개 배포: https://yghnsim.github.io/CS_Wiki_Next/

Phase 3의 정적 사이트는 `packages/knowledge`가 만든 그래프만 소비한다.

## 입력

```text
data/build/graph.json
data/build/documents.json
data/build/report.json
contracts/routes.json
raw/assets/
```

## 출력

```text
app/dist/
  index.html
  index/index.html
  docs/{id}/index.html          현재 문서 수
  history/index.html
  evidence/index.html
  search/index.html
  search.json                   현재 public 문서 수
  sitemap.xml                   현재 public 문서 + static
  robots.txt
  {legacy}/index.html           555 redirects
  404.html
  assets/                       copied raw assets
  _astro/                       CSS/JS
```

## URL 계약

- 문서 URL은 `/docs/{id}/`다.
- 기존 유형별 URL 555개는 meta refresh + canonical로 이동한다.
- `SITE_BASE`가 `/CS_Wiki_Next`이면 링크·자산·canonical에 base를 붙인다.
- `SITE_URL`은 canonical origin으로 사용한다.

## 디자인 경계

- “VS Code Workbench” 셸을 사용한다: activity bar, explorer, tabs, breadcrumb, status bar.
- 문서 본문은 man page 스타일: `CSWIKI(1)` 헤더, `##`/`###` 프리픽스, RELATIONS/BACKLINKS rail.
- 검색은 `Ctrl/Cmd+K` command palette와 `/search/` 페이지를 함께 제공한다.
- 색인은 explorer형 compact file list.
- 다크 팔레트와 IBM Plex Mono/Noto Sans KR을 사용하며, 색·타이포·간격은 `app/src/styles/global.css` 한 곳에서 관리한다.

## 데이터 경계

- 앱은 Markdown 파일을 직접 읽지 않는다.
- `documents.json`의 `body`만 Markdown으로 렌더링한다.
- `[[title]]`은 `documents`/`nodes`의 alias로 `/docs/{id}/`에 해석한다.
- `![[file]]`은 `raw/assets`를 `/assets`로 복사해 렌더링한다.
- 관계·역링크·연도·근거는 `graph.json`에서 읽는다.

## 검증

```bash
npm run site:parity
npm run site:links
```

`site:parity`는 다음을 확인한다.

- 현재 build의 모든 document page
- 기존 440 legacy route의 document 존재
- 기존 555 redirect page
- search records 수와 현재 public 문서 수의 일치
- 모든 public 문서의 search·sitemap 포함
- unlisted 문서의 noindex

총 문서 수·sitemap 수의 정확한 절대값은 검사하지 않는다. 새 문서는 추가할 수 있고, migration baseline은 `contracts/migration-baseline.json`에 동결되어 있다.

`site:links`는 HTML의 내부 `href`/`src`가 실제 파일로 해석되는지 확인한다. raw asset HTML 스냅샷은 검사 대상에서 제외한다.

## 아직 하지 않은 것

- 그래프 캔버스
- 연결 경로 탐색기
- 검색 랭킹·한국어 형태소 분석
- 기존 사이트와의 픽셀/컴포넌트 parity

이들은 **필수 기능이 아니므로** 채택하지 않았다. 사용 수요가 확인되면 Phase 3.1 이후에 검토한다. sitemap·robots·기본 검색·색인·리디렉션은 필수 범위로 포함했다.
