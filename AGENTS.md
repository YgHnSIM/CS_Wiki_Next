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

## 마이그레이션·콘텐츠 규칙

- 기존 440개 URL과 555개 리디렉션은 기본적으로 유지한다. archive/purge 삭제는 `contracts/removed-documents.json`에 명시한다.
- `contracts/migration-baseline.json`은 동결된 역사적 기준이며, 현재 문서 수는 이보다 클 수 있다. 삭제 시에는 `removed-documents`가 기준이다.
- 새 문서는 schema v3과 evidence 규칙을 지키면 추가할 수 있다. route는 `/docs/{id}/`로 자동 생성된다.
- 기존 본문을 대규모로 재작성하지 않는다. 삭제·은퇴는 `content:retire`/`content:delete`를 사용한다.
- 대량 변환은 20~30쪽 배치로 하고, 배치마다 build·schema·sync·link 검사를 통과시킨다.
- 대상 미해결·근거 미해결·generated block 불일치가 있으면 다음 배치로 넘어가지 않는다.

## 검증

```bash
npm run knowledge:check
npm run knowledge:schema
npm run knowledge:report
npm run knowledge:sync -- --check
npm run knowledge:build
npm run knowledge:quality
npm run traces:check
npm test
npm run site:build
npm run site:parity
npm run search:eval
npm run site:links
npm run security:audit
```

기존 문서를 유지하지 않을 때는 삭제 대신 `npm run content:retire -- --id <id> --mode <tombstone|redirect> [--to <id|key>]`를 사용한다. 기존 URL과 route contract는 유지한다.

실제 삭제는 `npm run content:delete -- --id <id> --mode archive`가 기본이다. purge는 `--mode purge --break-url`로만 허용하고 `contracts/removed-documents.json`에 기록한다.

archive 복원은 `npm run content:restore -- --id <id> [--public]`를 사용하고, 이후 `npm run knowledge:seed`를 실행한다. `/archive/`는 retired/archived/purged 목록을 보여준다.

`knowledge:check`는 Registry 정합성, `knowledge:schema`는 전체 페이지 frontmatter 스키마, `knowledge:report`는 전체 관계의 preflight, `knowledge:sync --check`는 generated block 패리티, `knowledge:build`는 정규 그래프와 invariant를 검사한다. `npm test`는 graph invariant와 lifecycle CLI(retire/delete/restore/purge)를 임시 fixture에서 검사한다. `knowledge:quality`는 연도 미상·고아·단일 근거를, `traces:check`는 `catalog/traces.json`의 문서·근거·역할 정합성과 coverage/quality budget을 검사한다. `site:build`는 Astro 사이트를 만들고, `site:parity`는 현재 docs·redirects·search·sitemap의 무결성, `search:eval`은 32개 쿼리의 Top-1/Top-3/MRR, `site:links`는 내부 링크, `security:audit`는 루트·app 의존성 취약점을 검사한다.

## 금지

- 기존 저장소를 수정하거나 덮어쓰지 않는다.
- `raw/`를 수정하지 않는다.
- URL·리디렉션을 바꾸지 않는다. 단 archive는 URL을 유지하고, purge는 `--break-url`과 removed registry로만 예외 처리한다.
- 관계 표를 frontmatter와 별도로 수동 편집하지 않는다.
- 근거 없는 공개 지식 관계를 추가하지 않는다.
