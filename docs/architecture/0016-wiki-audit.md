# ADR 0016: Wiki Audit and Semantic Lint

## 상태

채택 — 2026-10-25

## 배경

deterministic lint는 구조를 검사하지만, 문서의 숫자·날짜·인용이 raw 원문에 실제로 있는지, 고아 문서·stale 표시·모순이 있는지는 별도 검사가 필요하다.

## 결정

### `wiki:lint --semantic`

기본 lint에 다음 report-only 검사를 추가한다.

- public knowledge 중 incoming relation이 없는 orphan
- `status: stale`인데 index에 `[Stale]` 표시가 없는 문서
- `status: disputed` 문서의 conflict note 필요 표시

semantic warning은 **exit code를 실패로 만들지 않는다.** deterministic error만 실패한다.

### `wiki:audit`

```bash
npm run wiki:audit -- --id src-151
npm run wiki:audit -- --id concept-... --json
npm run wiki:audit -- --id concept-... --strict
```

- 문서의 relation evidence source를 수집
- local raw access가 있으면 원문을 읽음
- evidence quote가 원문에 있는지 검사
- 본문의 숫자·연도·따옴표 literal을 추출해 raw에 있는지 표시
- `output/audit/<id>.json`
- **문서 본문을 수정하지 않는다**
- `--strict`일 때만 unverified가 exit 1

PDF·이미지 등 텍스트가 아닌 raw는 `null`로 건너뛴다. 이 경우 agent가 별도로 확인한다.

## Claim 판정

- `found: true` — raw에서 literal을 찾음
- `found: false` — raw에서 찾지 못함
- `found: null` — raw를 읽을 수 없거나 quote가 없음

`false`는 “틀렸다”가 아니라 **agent가 확인해야 할 후보**다.

## 테스트

`wiki-audit.test.mjs`:

- local raw access
- 1965 literal 검증
- strict 통과

전체 22개.

## 하지 않은 것

- LLM이 claim을 자동 재작성
- PDF OCR
- 외부 URL 실시간 검증
- contradiction 자동 판정
