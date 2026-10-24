# ADR 0010: Archive Delete and Purge

## 상태

채택 — 2026-10-24

## 배경

기존 정책은 기존 440개 문서의 물리 삭제를 금지했다. 그러나 관리상 오래된 문서를 실제로 정리해야 할 수 있다. URL 계약과 검색·그래프 일관성을 유지하면서 삭제할 수 있는 두 단계가 필요하다.

## 결정

### Archive delete — 기본

```bash
npm run content:delete -- --id <id> --mode archive --reason "..."
```

- 원문을 `archive/removed/{id}.md`로 이동
- wiki 페이지는 tombstone으로 교체
- `publication_visibility: unlisted`
- noindex
- search·sitemap 제외
- 기존 URL 유지
- 관계·Trace 참조는 유지 가능

공개 문서는 먼저 `content:retire`를 거쳐야 한다.

### Purge — 예외

```bash
npm run content:delete -- --id <id> --mode purge --break-url --reason "..."
```

- 원문을 archive에 보존
- wiki 페이지 제거
- registry에서 제거 (`knowledge:seed` 필요)
- `/docs/{id}/` **404**
- 외부 링크가 깨질 수 있음
- `--break-url` 필수

Purge 전 차단 조건:

- public 문서이며 retire하지 않음
- Trace에서 참조
- 들어오는 관계
- 들어오는 위키링크

## Archive restore

```bash
npm run content:restore -- --id <id> [--public]
```

- `archive` entry만 복원
- `archive/removed/{id}.md`를 원래 `wiki/` 경로로 복원
- tombstone 페이지가 있으면 교체
- `--public`이 없으면 unlisted로 복원
- `removed-documents.json`에서 제거
- 실행 후 `npm run knowledge:seed` 필요

## Archive 목록 UI

`/archive/`에서 다음을 보여준다.

- **RETIRED** — retire만 하고 삭제하지 않은 문서
- **ARCHIVED** — archive delete된 문서 (tombstone 링크)
- **PURGED** — purge된 문서 (URL 없음, 기록만)
- Archive count는 사이드바에도 표시

## Removed registry

`contracts/removed-documents.json`

```json
{
  "id": "concept-old",
  "key": "concept:old",
  "title": "Old",
  "kind": "concept",
  "mode": "archive",
  "removed_at": "2026-10-25",
  "replaced_by": null,
  "reason": "중복",
  "break_url": false
}
```

- `archive`: 페이지가 tombstone으로 존재해야 함
- `purge`: 페이지가 없어야 하며 `break_url: true`
- legacy route는 archive/purge registry로 상태를 설명

## CI

- 모든 기존 legacy route는 active / archive / purge 중 하나
- purge는 `break_url: true` 필수
- search records = 현재 public documents
- sitemap = 현재 public documents + static
- 정확한 총 문서 수는 검사하지 않음

## 검증

임시 문서 2개로 확인했다.

```text
public delete guard: 실패 (retire 먼저)
archive: tombstone + noindex + archive 원문
purge: 문서 페이지 없음 + removed registry
site:parity 441 docs / 555 redirects / 397 search / 418 sitemap
npm test 14 pass
```

확인 후 임시 문서·archive·registry를 제거해 현재 441 기준으로 복구했다.

## 하지 않은 것

- purge에 대한 외부 링크 검사 (내부 링크만 차단)
- archive 복원 CLI
- retired/purged 문서의 별도 검색 인덱스
