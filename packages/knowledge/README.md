# Knowledge compiler & LLM Wiki engine

기존 Markdown과 frontmatter를 읽어 `Document`, `Node`, `Statement`, `Evidence`의 정규 그래프를 컴파일하고, LLM Wiki의 3대 복리(compounding) 루프(`ingest`, `query`, `lint`/`audit`)와 콘텐츠 수명주기(`retire`, `delete`, `restore`)를 관리한다.

## 원칙

- `raw/`는 불변 원본이며 읽기 전용이다.
- `wiki/`는 합성된 지식 원고이며 frontmatter `relations`가 canonical이다.
- 컴파일 결과는 결정적이어야 하며 사이트(`app/`)는 컴파일된 그래프만 소비한다.
- 스키마 검증·생명주기 불변식·의미 검증은 `validate/` 계층에서 일원화한다.

## 모듈 구조

```text
src/
  shared/      args, today, fs 공통 유틸리티
  parse/       frontmatter, links, relations 파서 및 generated block 렌더러
  registry/    workspace 로더, nodes/aliases 시드 생성기, traces 참조 해석기
  search/      정규화·동의어·가중치 기반 검색 랭킹 엔진 (app과 공유)
  compile/     정규 그래프(graph.json, documents.json, report.json) 컴파일러
  validate/    schema, lifecycle, registry, relations, quality, traces, wiki-lint
  ops/         lifecycle, ingest(수집 + --apply 통합), query, audit, index-doc, log, gaps
  cli/         npm 스크립트용 얇은 CLI 어댑터
```

## 주요 명령

```bash
npm run knowledge:seed
npm run knowledge:check
npm run knowledge:schema
npm run knowledge:report
npm run knowledge:sync -- --check
npm run knowledge:build
npm run knowledge:quality
npm run traces:check
npm run wiki:index
npm run wiki:log
npm run wiki:gaps -- --list
npm run wiki:lint
npm run wiki:ingest -- --source <url|path> --id src-###
npm run wiki:ingest -- --apply output/ingest/src-###.json
npm run wiki:query -- "질문" [--save] [--record-gap]
npm run wiki:audit -- --id <id>
npm test
```
