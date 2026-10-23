# CS_Wiki Next 작업 규칙

## 범위

이 저장소는 기존 CS Wiki의 콘텐츠를 유지하면서 메타데이터·지식 연결·사이트 도구를 새로 구성한다. 기존 저장소 `C:\Vault\CS_Wiki`는 백업/참조용이며 수정하지 않는다.

## 구조

```text
wiki/                 기존 Markdown 콘텐츠
raw/                  불변 원본
schema/               페이지 스키마 + knowledge 스키마 초안
docs/architecture/    ADR·마이그레이션 설계
catalog/              노드·작품·어휘 Registry
contracts/            URL·리디렉션 계약
packages/knowledge/   지식 컴파일러
app/                  Astro 사이트
```

## 문서 계약

- `id`는 `/docs/{id}/` URL 계약이다. 변경하지 않는다.
- `key`는 `type:slug` 형식의 의미 ID다. URL과 독립적이다.
- `relations`는 frontmatter가 canonical이다.
- 본문 `## 관계` 표는 `<!-- knowledge:relations:start -->` generated block만 허용한다.
- `publication_visibility`는 `public`/`unlisted`만 지원한다.
- 공개 지식 문서(`concept`·`entity`·`analysis`)의 관계는 evidence 1개 이상을 요구한다.
- `raw/`는 수정하지 않는다. LF/UTF-8을 사용한다.
- 과거 `wiki/logs/` 기록은 당시 형식을 보존한다. 새 로그는 schema v3을 따른다.

## 마이그레이션 규칙

- 440개 URL과 555개 리디렉션을 유지한다.
- 콘텐츠 본문을 새로 쓰지 않는다. 관계 메타데이터만 재배치한다.
- 20~30쪽 배치로 변환하고, 배치마다 parity를 확인한다.
- 대상 미해결·근거 미해결·generated block 불일치가 있으면 다음 배치로 넘어가지 않는다.
- 각 배치 후 `contracts/routes.json`과 페이지·관계 수를 비교한다.

## 검증

```bash
npm run knowledge:check
npm run knowledge:schema
npm run knowledge:report
npm run knowledge:sync -- --check
npm run knowledge:build
npm test
npm run site:build
npm run site:parity
npm run site:links
```

`knowledge:check`는 Registry 정합성, `knowledge:schema`는 440쪽 frontmatter 스키마, `knowledge:report`는 887개 관계의 preflight, `knowledge:sync --check`는 generated block 패리티, `knowledge:build`는 정규 그래프와 parity를 검사한다. `site:build`는 Astro 사이트를 만들고, `site:parity`는 440 docs/555 redirects/397 search records, `site:links`는 내부 링크를 검사한다.

## 금지

- 기존 저장소를 수정하거나 덮어쓰지 않는다.
- `raw/`를 수정하지 않는다.
- URL·리디렉션을 바꾸지 않는다.
- 관계 표를 frontmatter와 별도로 수동 편집하지 않는다.
- 근거 없는 공개 지식 관계를 추가하지 않는다.
