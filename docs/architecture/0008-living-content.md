# ADR 0008: Living Content after Migration

## 상태

채택 — 2026-10-24

## 배경

2026-10-24 마이그레이션은 완료됐다. 기존 440개 문서와 555개 리디렉션은 보존됐고, `relations` canonical 전환과 schema v3도 끝났다.

그러나 `contracts/parity.json`과 테스트가 **정확한 총량**을 계속 요구해, 새 문서를 추가하면 CI가 실패했다. 이는 마이그레이션 검증 기준이 향후 콘텐츠 성장까지 막는 상태였다.

## 결정

### 1. Migration baseline 동결

`contracts/migration-baseline.json`은 2026-10-24 시점의 **역사적 스냅샷**이다.

- documents: 440
- public: 397
- unlisted: 43
- relation_documents: 362
- statements: 887
- redirects: 555

현재 콘텐츠 수는 이 값보다 크거나 같을 수 있다. 빌드는 baseline 대비 **하한**만 검사한다.

### 2. 기존 route contract는 보존

`contracts/routes.json`은 기존 440개 URL과 555개 리디렉션의 **legacy route map**으로 유지한다.

- 기존 route의 `id`·`url`·redirects는 바꾸지 않는다.
- 새 문서는 route map에 없어도 `/docs/{id}/` fallback URL을 얻는다.
- 기존 route가 사라지면 테스트와 `site:parity`가 실패한다.

### 3. CI는 절대 총량이 아니라 무결성을 검사

- 모든 built document에 `/docs/{id}/` 페이지가 있는가
- 기존 440 route가 모두 document로 존재하는가
- 기존 555 redirect가 모두 빌드됐는가
- search records 수가 **현재 public documents**와 일치하는가
- 모든 public document가 search와 sitemap에 있는가
- unlisted 문서에 noindex가 있는가

총 문서 수·statement 수·sitemap 수의 **정확한 절대값은 검사하지 않는다.**

### 4. 새 문서 추가 workflow

1. `wiki/{kind}/{title}.md` 추가
2. `npm run knowledge:seed`
3. `npm run knowledge:build`
4. `npm run site:build`
5. 필요하면 Trace·Guide 연결
6. `npm run site:parity`, `npm run site:links`, `npm test`

새 문서의 URL은 `id`에서 자동 생성된다.

삭제는 [ADR 0010](0010-archive-purge.md)을 따른다. 공개 문서는 retire 후 archive가 기본이며, purge는 `--break-url` 예외다.

## 결과

- 새 문서 추가가 더 이상 parity 위반이 아님
- 기존 440 URL·555 redirect는 계속 보존
- migration baseline은 불변
- 문서 수는 현재 build/report에서 계산

## 하지 않은 것

- `content:add` 생성기 (필요해지면 추가)
- 기존 440 route의 자동 재생성
- 새 문서에 대한 route 수동 편집 강제
