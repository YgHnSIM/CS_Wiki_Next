# Knowledge compiler

기존 Markdown과 frontmatter를 읽어 `Document`, `Node`, `Statement`, `Evidence`의 정규 그래프를 만든다.

## 원칙

- `wiki/`는 읽기 전용 입력이다.
- 컴파일 결과는 결정적이어야 한다.
- 사이트는 컴파일된 그래프만 소비한다.
- 스키마 검증과 의미 검증을 분리한다.

## 예정 모듈

```text
src/
  parse/       frontmatter + Markdown AST
  model/       Document, Node, Statement, Evidence, Time
  registry/    nodes/works/aliases 로더
  compile/     relations/evidence/temporal
  validate/    schema + semantics + graph invariants
  emit/        graph.json, backlinks, timeline, report
  cli/         seed, report, migrate, check, sync
```

Phase 1에서는 `seed`, `report`, `migrate`, `check`, `sync` 순서로 구현한다.

현재 구현: `src/cli/seed.mjs` — 440개 페이지에서 `catalog/nodes.yml`과 `catalog/aliases.yml`을 생성한다.

```bash
npm run knowledge:seed -- --dry-run
npm run knowledge:seed
```
