# ADR 0013: Wiki Maintenance Tools

## 상태

채택 — 2026-10-25

## 배경

LLM Wiki 운영에는 `index.md`, append-only `log.md`, gaps register, deterministic lint가 필요하다. 기존에는 `knowledge:quality`, `site:links`가 있었지만 index/log/raw/gaps를 한 번에 검사하지 못했다.

## 결정

### `wiki:index`

```bash
npm run wiki:index
npm run wiki:index -- --write
```

- `wiki/index.md`의 `[[link]]`를 실제 문서로 resolve
- public 문서 중 index에 없는 항목 보고
- `--write`일 때만 누락 항목 추가
- `meta-index`, `meta-log`, `meta-gaps`는 제외

### `wiki:log`

```bash
npm run wiki:log
npm run wiki:log -- --add --action ingest --title "..."
```

- `wiki/log.md` 목록과 `wiki/logs/*.md` 파일 수·존재·순서 검사
- `--add`는 log entry 파일과 목록 line을 함께 생성
- 날짜는 Asia/Seoul 기준

### `wiki:gaps`

```bash
npm run wiki:gaps -- --list
npm run wiki:gaps -- --add --kind wanted --key concept:...
npm run wiki:gaps -- --close --key concept:... --resolution ...
```

- `wiki/gaps.md`는 unlisted/hidden meta 페이지
- `wanted`/`question`/`closed` 섹션
- 항목은 삭제하지 않고 `[closed]`로 전환

### `wiki:lint`

```bash
npm run wiki:lint
npm run wiki:lint -- --json
```

검사:

- CRLF·final newline
- local raw path·SHA-256·bytes
- relation target
- evidence source 존재·kind
- internal wiki link
- stale + `superseded_by`
- index 누락
- log 누락·순서
- gaps marker·중복

`wiki-lint.json`을 `output/`에 쓴다. **사실은 수정하지 않는다.**

## CI

```bash
npm run wiki:index
npm run wiki:log
npm run wiki:lint
```

`site:build` 전에 실행한다.

## 테스트

`wiki-tools.test.mjs`는 임시 fixture에서 index/log/gaps/lint를 검증한다. 총 테스트는 21개다.

## 결과

- `wiki:lint`: 442 pages, 0 issues
- `wiki:index`: 396 public pages, 0 missing
- `wiki:log`: 157 listed / 157 files
- `wiki/gaps`: empty register 생성

## 하지 않은 것

- semantic contradiction 검사 (Phase 4)
- index `[Stale]`/`[Synthesis]` prefix 자동 갱신 (Phase 3)
- log write 전체 재생성
