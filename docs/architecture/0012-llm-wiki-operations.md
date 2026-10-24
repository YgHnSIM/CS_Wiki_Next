# ADR 0012: LLM Wiki Operations

## 상태

채택 — 2026-10-25

## 배경

LLM Wiki는 UI 기능이 아니라 **컴파일·질의·점검 루프**다. Karpathy의 원문은 `raw/` 불변, `wiki/` 합성, `index.md`/`log.md`, **ingest / query / lint**를 핵심으로 둔다.

CS Wiki Next는 이미 컴파일된 문서·관계·근거는 갖고 있지만, 새 소스가 기존 문서를 갱신하는 **쓰기 경로**가 없다. 이 ADR은 사이트 기능을 늘리는 대신 **에이전트 운영 프로토콜 + deterministic CLI + CI**를 추가한다.

## 원칙

1. **LLM 서비스를 새로 만들지 않는다.** 코딩 에이전트가 LLM 역할을 하고, CLI는 검색·검증·proposal만 담당한다.
2. **기존 typed graph를 유지한다.** `relations` + `evidence`가 canonical이고, markdown link는 탐색용이다.
3. **`raw/`는 불변**, `wiki/`는 합성, build 산출물은 파생이다.
4. **자동 쓰기 금지.** ingest는 proposal을 만들고, 사람이 승인한 뒤 적용한다.
5. **삭제와 지식 대체를 구분한다.**
   - URL retirement: `content:retire` / `content:delete`
   - 지식 대체: `status: stale` + `superseded_by`
   - 질문 답변 축적: `page_role: synthesis`
6. **citation 없는 답변 없음.** query/audit 결과는 문서 URL·key·evidence locator를 포함한다.

## 세 계층

```text
raw/                 불변 원본. 읽기 전용.
wiki/                컴파일된 지식. LLM/에이전트가 유지.
catalog/contracts/   registry, route, lifecycle 계약.
data/build/          build 파생물. 커밋하지 않는다.
```

## 새 schema 필드

`status`:

- `current` (기본)
- `stale` — 새 지식으로 대체됨
- `disputed` — 소스 간 충돌

`page_role`:

- `knowledge` (기본)
- `synthesis` — query 답변을 축적한 페이지

`superseded_by`는 기존 필드를 사용한다. `retirement.superseded_by`는 redirect URL용이므로 지식 대체와 혼용하지 않는다.

## 운영 파일

### `wiki/index.md`

- 사람이 읽는 지식 지도.
- 기존 `<!-- wiki-v2:generated index -->` 블록을 유지한다.
- `wiki:index`는 누락 공개 문서를 찾고, **자동 수정은 명시적 `--write`에서만** 한다.
- index에 `[Stale]`, `[Synthesis]` 접두사를 붙일 수 있다.

### `wiki/log.md`

- append-only 운영 로그.
- 형식:
  ```
  - [YYYY-MM-DD action | title](logs/log-YYYY-MM-DD-NNN-slug.md)
  ```
- action: `ingest`, `query`, `lint`, `audit`, `supersede`, `retire`, `restore`.
- `wiki:log`는 항목 파일과 `log.md` 목록의 수·순서를 검증한다.

### `wiki/gaps.md`

- 지식 공백 등록부.
- frontmatter: `kind: meta`, `graph_visibility: hidden`, `publication_visibility: unlisted`.
- 항목:
  ```
  ### [open] concept-name
  - kind: wanted | question
  - evidence: [[문서]] 또는 query 로그
  - demand: N
  ```
- `wiki:gaps`는 추가·닫기만 하고 자동 삭제하지 않는다.

## 명령 계약

Phase 1:

```bash
npm run wiki:lint
npm run wiki:index [--write]
npm run wiki:log [--check]
npm run wiki:gaps [--add ...]
```

Phase 2:

```bash
npm run wiki:ingest -- --source <url|path> --id src-151
npm run wiki:ingest -- --apply output/ingest/src-151.json
```

Phase 3:

```bash
npm run wiki:query -- "질문"
npm run wiki:query -- "질문" --save
```

Phase 4:

```bash
npm run wiki:audit -- <id>
npm run wiki:lint --semantic
```

## Ingest

`wiki:ingest`의 deterministic 단계:

1. source fetch/copy to `raw/`
2. SHA-256·bytes 기록
3. `wiki/sources/` skeleton
4. index + full-text + alias 검색
5. `output/ingest/<id>.json` proposal

proposal:

```json
{
  "source": "src-151",
  "disposition": "new|update|disputed|no-material",
  "targets": ["concept:..."],
  "relations": [],
  "notes": "..."
}
```

에이전트는 proposal을 검토해:

- 기존 문서 merge/update
- 새 concept/analysis 생성
- conflict는 `status: disputed`
- supersede는 `status: stale`
- index/log 갱신
- `wiki:lint`, build

을 수행한다. **소스 1개가 10~15개 페이지를 건드리는 fan-out**을 목표로 한다.

## Query

1. `wiki/index.md` 읽기
2. full-text + alias 검색
3. relation/backlink 확장
4. evidence locator 수집
5. citation과 함께 답변
6. `--save`일 때만 `page_role: synthesis` 페이지 생성

기본 query는 파일을 쓰지 않는다.

## Lint

### Deterministic

- schema, CRLF/EOF
- index/log 동기화
- raw access path·SHA·bytes
- evidence source·relation target
- internal link
- orphan
- stale/superseded 표시
- gaps 형식

`--fix`는 index/link/format만 수정한다. 사실은 고치지 않는다.

### Judgment

- 문서 간 모순
- 오래된 claim
- supersession 누락
- 누락 cross-reference
- 자주 언급되는 미작성 개념

`wiki:audit`는 raw 원문과 claim을 대조하고, **수정하지 않고 보고**한다.

## 단계

| Phase | 내용 |
|---|---|
| 0 | 이 ADR, schema 필드, 운영 규칙 |
| 1 | `wiki:index`/`log`/`gaps`/`lint` |
| 2 | `wiki:ingest` proposal |
| 3 | `wiki:query` + synthesis |
| 4 | `wiki:audit` + semantic lint |
| 5 | UI: filter/TOC/evidence ledger |

## 하지 않은 것

- LLM_Wiki_v2의 번역·공식 번호 workflow 이식
- 별도 LLM API 서버
- confidence score·decay·vector DB
- background 자동 쓰기
- `/archive/`를 query synthesis와 혼용

## 참고

- [Karpathy llm-wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Karpathy LLM Wiki research report](https://raw.githubusercontent.com/akitaonrails/ai-memory/v1.10.1/docs/research-karpathy-llm-wiki.md)
- [karpathy-llm-wiki SKILL](https://raw.githubusercontent.com/Astro-Han/karpathy-llm-wiki/eafcc77001e496cc43499e4923b663aec722c813/SKILL.md)
