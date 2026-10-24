---
schema_version: 3
id: log-2026-10-25-155
kind: meta
title: "2026-10-25 update | 계산 독서 지도 추가"
aliases: []
summary: 계산 독서 지도(meta-computation-reading-guide)를 새 문서로 registry·search·sitemap에 추가한 기록.
domains: []
publication_visibility: unlisted
graph_visibility: hidden
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers: []
---

## 추가

- `wiki/meta/계산 독서 지도.md`
- `id: meta-computation-reading-guide`
- `key: document:computation-reading-guide`
- public / graph public

## 처리

- `knowledge:seed`로 registry node·alias 생성
- route contract 수정 없이 `/docs/meta-computation-reading-guide/` 자동 생성
- search·sitemap 자동 반영
- schema·sync·build·link 검증

## 결과

```text
pages   1,019
docs      441
search    398
sitemap   420
tests       7 pass
```

## 참고

이 문서는 이전에 빌드 오류를 잘못 처리하면서 삭제됐던 문서다. 사용자가 원문을 복원했고, 이번에는 seed 후 정상 추가했다. 새 페이지의 registry 누락은 삭제가 아니라 `knowledge:seed`로 해결한다.
