# ADR 0009: Content Retirement

## 상태

채택 — 2026-10-24

## 배경

문서를 추가할 수 있게 된 뒤에도 삭제는 두 종류로 나뉜다.

- 새 문서: 실제로 삭제할 수 있다.
- 기존 440개 문서: `/docs/{id}/` URL 계약을 깨므로 직접 삭제할 수 없다.

기존 문서를 “없는 문서”로 만들면 외부 링크가 404가 되고, migration baseline이 깨진다. 따라서 기존 문서는 **은퇴(retire)** 로 처리한다.

## 결정

`content:retire` CLI를 제공한다.

```bash
npm run content:retire -- --id <id> --mode tombstone [--note "..."]
npm run content:retire -- --key <key> --mode tombstone
npm run content:retire -- --id <id> --mode redirect --to <id|key>
```

### Tombstone

- 기존 URL 유지
- `publication_visibility: unlisted`
- noindex
- 문서 상단에 “은퇴한 문서” 안내
- 본문은 보존
- search·sitemap에서 제외

### Redirect

- 기존 URL 유지
- `publication_visibility: unlisted`
- noindex
- `meta refresh` + 안내 링크로 대상 문서 이동
- 대상은 public·비은퇴 문서여야 함
- 본문은 보존

## Frontmatter

```yaml
retirement:
  mode: tombstone | redirect
  retired_at: 2026-10-24
  superseded_by: concept-target-id   # redirect only
  note: "..."
```

Schema: `schema/wiki-page.schema.json`의 `retirement`.

## URL 계약

- `contracts/routes.json`은 그대로 유지한다.
- `contracts/migration-baseline.json`도 수정하지 않는다.
- 기존 route가 404가 되지 않는다.
- 새 문서를 retire한 뒤 실제로 삭제하는 것은 별도 작업이다.

## 검증

임시 문서 2개로 확인했다.

```text
tombstone: noindex true / 은퇴 안내 true / refresh false
redirect:  noindex true / 은퇴 안내 true / refresh true
site:parity 442 docs / 555 redirects / 397 search / 418 sitemap
```

확인 후 임시 문서와 registry 변경을 제거했다.

## 하지 않은 것

- 기존 문서의 물리 삭제
- retired 본문의 별도 archive 파일 이동
- retirement undo CLI
- 자동 대체 문서 추천
