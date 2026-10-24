# URL and migration contracts

## `routes.json`

기존 사이트의 **legacy route map**이다. 수동으로 수정하지 않는다.

- 440개 문서의 `/docs/{id}/`
- 555개 리디렉션
- 공개 범위(`public`/`unlisted`)

새 문서는 이 파일에 없어도 `/docs/{id}/` URL을 자동으로 얻는다. 기존 route가 사라지면 테스트가 실패한다.

기존 문서를 더 이상 유지하지 않을 때는 삭제하지 않고 `npm run content:retire`로 tombstone 또는 redirect 처리한다. route 파일은 그대로 둔다.

## `migration-baseline.json`

2026-10-24 마이그레이션 수용 시점의 **역사적 스냅샷**이다.

- documents 440
- public 397
- unlisted 43
- statements 887
- redirects 555

현재 콘텐츠는 이 값보다 클 수 있다. CI는 baseline을 **하한**으로만 사용한다.
