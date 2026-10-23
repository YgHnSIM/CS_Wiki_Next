# Astro app contract

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
  docs/{id}/index.html          440
  history/index.html
  evidence/index.html
  search/index.html
  search.json                   397
  sitemap.xml                   402
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

- 440 docs
- 555 redirects
- 397 search records
- unlisted 43개 noindex

`site:links`는 HTML의 내부 `href`/`src`가 실제 파일로 해석되는지 확인한다. raw asset HTML 스냅샷은 검사 대상에서 제외한다.

## 아직 하지 않은 것

- 그래프 캔버스
- 연결 경로 탐색기
- 학습 경로/노선도
- 검색 랭킹·한국어 형태소 분석
- 기존 사이트와의 픽셀/컴포넌트 parity

이들은 **필수 기능이 아니므로** 채택하지 않았다. 사용 수요가 확인되면 Phase 3.1 이후에 검토한다. sitemap·robots·기본 검색·색인·리디렉션은 필수 범위로 포함했다.
