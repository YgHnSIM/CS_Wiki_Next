# ADR 0014: Wiki Ingest

## 상태

채택 — 2026-10-25

## 배경

새 소스를 추가하려면 지금까지 Markdown frontmatter와 raw 복사를 수동으로 했다. LLM Wiki의 ingest는 소스를 raw에 넣고, 기존 지식과 비교해 여러 문서를 갱신하는 쓰기 경로다.

## 결정

`wiki:ingest`는 **deterministic 수집 단계**만 수행한다.

```bash
npm run wiki:ingest -- --source <url|path> --id src-151 --title "..."
```

동작:

1. local 파일을 `raw/ingested/YYYY-MM-DD-slug.ext`로 복사
2. SHA-256·bytes·media_type 기록
3. `wiki/sources/<title>.md` skeleton 생성
4. `output/ingest/<id>.json` proposal 생성
5. `wiki/log.md`에 ingest 기록
6. 다음 단계 안내

### 생성되는 source page

- `kind: source|reference`
- `origin: local|external`
- `works.primary`
- `access` (local 또는 url)
- `status: current`, `page_role: knowledge`
- 본문은 요약/인용 위치 placeholder

### Proposal

```json
{
  "source": "src-151",
  "disposition": "new|update-or-new",
  "raw": "raw/ingested/...",
  "candidates": [
    { "id": "concept-...", "key": "concept:...", "score": 2 }
  ],
  "notes": "..."
}
```

`candidates`는 제목·alias token 일치 후보일 뿐, 자동 relation이 아니다.

### Apply

**본문 합성과 relation 적용은 에이전트가 한다.**

1. proposal의 candidates 검토
2. 기존 문서 merge/update
3. relation/evidence 작성
4. `npm run knowledge:seed`
5. `npm run wiki:index -- --write`
6. `npm run wiki:lint`
7. `npm run knowledge:build`, `site:build`

`--dry-run`은 파일을 쓰지 않고 proposal만 계산한다.

## 하지 않은 것

- LLM API로 요약 자동 생성
- PDF/HTML 변환
- proposal 자동 apply
- 10~15개 문서 fan-out 자동화 (에이전트 판단)

## 검증

`wiki-ingest.test.mjs`:

- raw 복사
- source page frontmatter
- proposal 생성
- log 기록
- seed/schema 통과

## 다음

Phase 3 query, Phase 4 audit.
