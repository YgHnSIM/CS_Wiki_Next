---
schema_version: 3
id: log-2026-10-25-153
kind: meta
title: "2026-10-25 update | Archive delete와 purge 예외"
aliases: []
summary: content:delete archive/purge, removed-documents registry, retire/delete Trace 가드, legacy route archive/purge 검사를 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- `npm run content:delete -- --id <id> --mode archive`
- `npm run content:delete -- --id <id> --mode purge --break-url`
- `contracts/removed-documents.json`
- `archive/removed/{id}.md` 원문 보존
- `content:retire`의 Trace 참조 차단
- purge의 incoming relation·wiki link 차단
- legacy route active/archive/purge 검사

## 정책

- 공개 문서: retire 후 archive
- archive: URL 유지, tombstone, noindex, search/sitemap 제외
- purge: URL 404, `--break-url` 필수, removed registry 기록
- 공개 상태에서 바로 delete 금지

## 검증

임시 문서 2개로 확인했다.

```text
public delete guard: 실패 (retire first)
archive: tombstone + noindex + archive 원문
purge: 문서 페이지 없음 + removed registry
site:parity 441 docs / 555 redirects / 397 search / 418 sitemap
npm test 7 pass
```

확인 후 임시 문서·archive·registry를 제거해 440 기준으로 복구했다.

## 문서

- `docs/architecture/0010-archive-purge.md`
- `contracts/README.md`
- `schema/wiki-page.schema.json`
- `schema/removed-documents.schema.json`
