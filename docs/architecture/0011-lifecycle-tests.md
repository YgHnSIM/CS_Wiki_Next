# ADR 0011: Lifecycle Integration Tests

## 상태

채택 — 2026-10-25

## 배경

`content:retire`, `content:delete`, `content:restore`는 실제 파일을 옮기고 frontmatter·registry·archive를 바꾼다. 수동 검증만으로는 회귀를 막기 어렵다.

## 결정

`packages/knowledge/tests/lifecycle.test.mjs`에서 임시 디렉터리 fixture를 만들고 CLI를 실제로 실행한다.

검사 항목:

- public 문서는 retire 전 delete 거부
- retire가 `retirement`·unlisted를 기록
- archive delete가 URL을 유지하고 tombstone·archive 원문을 생성
- restore가 tombstone을 교체하고 removed entry를 제거
- Trace 참조 시 retire 거부
- purge는 `--break-url` 없이는 거부
- purge 후 문서 페이지·registry entry 제거

## fixture

- 임시 `wiki/meta/Lifecycle Test.md`
- 빈 `catalog/traces.json`
- 빈 `contracts/removed-documents.json`
- `seed.mjs`로 registry 생성
- CLI는 `node <absolute script>` + `cwd=temp`로 실행

실제 repository는 건드리지 않는다.

## 결과

```text
npm test
tests 19
pass 19
```

graph 7 + lifecycle 7 + wiki tools 5.

graph 테스트 7개 + lifecycle 테스트 7개.

## 하지 않은 것

- Astro build까지 포함한 브라우저 통합 테스트
- archive 복원 후 search/sitemap E2E
- purge의 외부 링크 검사
