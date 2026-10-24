# ADR 0015: Wiki Query and Synthesis

## 상태

채택 — 2026-10-25

## 배경

검색은 문서를 찾아주지만, LLM Wiki의 query는 **index → 문서 → 관계/근거**를 읽고 citation과 함께 답을 합성하며, 가치 있는 답을 wiki에 축적한다.

## 결정

### `wiki:query`

```bash
npm run wiki:query -- "질문"
npm run wiki:query -- "질문" --limit 5
npm run wiki:query -- "질문" --json
```

동작:

1. `buildGraph`로 public documents·relations·evidence 로드
2. `rankSearch`로 index/search 랭킹
3. 전체 검색이 0건이면 term별 검색으로 fallback
4. 상위 결과의 summary와 evidence locator를 context packet으로 출력
5. `output/query/YYYY-MM-DD-<hash>.json` 저장
6. 기본적으로 wiki 파일은 쓰지 않음

citation URL은 `SITE_URL` + `SITE_BASE`를 사용한다.

### `--save`

```bash
npm run wiki:query -- "질문" --save
```

- `wiki/syntheses/analysis-synthesis-YYYY-MM-DD-<hash>.md`
- `kind: analysis`
- `page_role: synthesis`
- public, `graph_visibility: hidden`
- evidence source IDs 기록
- `wiki/log.md`에 query 기록
- 이후 `knowledge:seed`, `wiki:index --write`, `wiki:lint` 필요

## Archive와의 구분

- `/archive/` = URL retirement
- `wiki/syntheses/` = 질문 답변 축적
- 서로 다른 생명주기와 목적

## 테스트

`wiki-query.test.mjs`:

- context 결과
- synthesis 파일
- `page_role: synthesis`
- seed/schema 통과

전체 테스트 21개.

## 하지 않은 것

- LLM API 호출
- 자동 citation 검증 (Phase 4 audit)
- synthesis의 자동 stale 추적
- query 결과를 자동으로 index에 반영
