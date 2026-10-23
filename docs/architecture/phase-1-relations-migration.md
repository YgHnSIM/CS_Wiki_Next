# Phase 1: relations frontmatter 마이그레이션 설계

- **상태**: 설계 초안 (2026-10-24)
- **전제**: ADR 0001의 1B/2A/3A/4A/5B 결정
- **목표**: 기존 440쪽의 본문 문장을 바꾸지 않고, `## 관계` 표를 frontmatter `relations`로 옮기고 generated block으로 유지한다.

## 1. 기준선

현재 매니페스트에서 확인한 값이다.

| 항목 | 값 |
|---|---:|
| 문서 | 440 |
| 관계가 있는 문서 | 362 |
| 전체 관계 | **887** |
| 관계 대상 미해결 | 0 |
| 근거 없는 관계 | 1 (`ref-137`) |
| 소스·참고 자료 | 164 |
| 해시형 ID | 147 |

`ref-137`의 관계는 출처 페이지 자체가 근거이므로 `evidence: []` 예외로 둔다. 공개 지식 문서의 관계는 evidence 1개 이상을 요구한다.

## 2. Frontmatter 계약

### 2.1 페이지 예

```yaml
---
schema_version: 3
id: concept-computability
key: concept:computability
kind: concept
title: 계산 가능성
aliases: [computability]
about: [concept:computability]
publication_visibility: public
graph_visibility: public
created: 2026-07-01
updated: 2026-10-24
evidence_ids: [ref-010]
capability_layers: [computability]
relations:
  - predicate: enables
    target: concept:turing-machine
    note: 계산 가능성 개념이 튜링 기계라는 형식 모델을 가능하게 했다.
    evidence:
      - source: ref-010
        locator: p. 230
    confidence: established
    valid_from: 1936
---
```

### 2.2 `relations` 항목

| 필드 | 필수 | 타입 | 의미 |
|---|---|---|---|
| `predicate` | 예 | enum | 통제 어휘의 관계 종류 |
| `target` | 예 | key | 대상 노드의 의미 ID |
| `subject` | 아니오 | key | 기본값은 페이지 `key` |
| `note` | 아니오 | string(≤300) | 사람이 읽는 설명 |
| `evidence` | 권장 | EvidenceRef[] | 관계 근거 |
| `confidence` | 아니오 | enum | `established·probable·disputed·unknown` |
| `valid_from` | 아니오 | integer/null | 관계 유효 시작 연도 |
| `valid_to` | 아니오 | integer/null | 관계 유효 끝 연도 |
| `id` | 아니오 | `stmt:*` | 고정 Statement ID |

### 2.3 EvidenceRef

```yaml
evidence:
  - source: ref-010
    locator: p. 230
    quote: "..."
    snapshot: sha256:...
```

- `source`는 `src-*`/`ref-*` 페이지 ID다.
- `locator`·`quote`·`snapshot`은 선택이다.
- `evidence`가 비어 있는 것은 source/reference 페이지의 자기 근거 관계에만 허용한다.

### 2.4 Key 규칙

```text
type:slug
```

- type: `person | organization | concept | entity | work | event | place | artifact | analysis | document | source`
- slug: 소문자 ASCII, 숫자, 하이픈
- 예: `person:alan-turing`, `concept:turing-machine`, `source:ref-010`
- 페이지의 `id`는 URL용으로 유지한다.
- `key`는 URL이 아니다. `/docs/{id}/`와 독립적이다.

해시형 ID의 초기 key:

```text
concept-2ff6633d43e61407
  → concept:page-2ff6633d43e61407   # auto
  → concept:api                    # 상위 50개 수동 검토 후
```

- 초기에는 `page-<hash8>`을 허용한다.
- 수동 검토 시 읽기 쉬운 key로 바꾸고, 이전 key를 `aliases`에 남긴다.
- key 변경은 URL을 바꾸지 않는다.

### 2.5 `about`

```yaml
about: [concept:computability]
```

- 기본값은 `[key]`다.
- 분석 문서는 여러 노드를 가질 수 있다.
- `about`은 관계의 `subject` 기본값과 다르다. 관계의 subject는 기본적으로 페이지 `key`다.

## 3. Generated block 계약

`## 관계` 제목 아래에 다음 블록을 둔다.

```md
## 관계

<!-- knowledge:relations:start -->
| 관계 | 대상 | 설명 | 근거 |
|---|---|---|---|
| enables | [[튜링 기계]] | 계산 가능성 개념이 ... | [[On Computable Numbers]] |
<!-- knowledge:relations:end -->
```

규칙:

- `npm run knowledge:sync`가 frontmatter에서 블록을 생성한다.
- `npm run knowledge:sync -- --check`는 블록이 최신인지 검사한다.
- 블록 안을 직접 수정하면 린트 오류다.
- 블록 밖에 관계 표를 두지 않는다.
- 대상·근거는 Registry/소스 제목으로 사람이 읽을 수 있는 위키링크로 렌더링한다.
- `note`의 `|`는 이스케이프한다.
- 관계가 없으면 블록을 제거하고 `## 관계` 제목도 남기지 않는다.

## 4. Registry 시드

### 4.1 Nodes

```yaml
# catalog/nodes.yml
schema_version: 1
nodes:
  - key: person:alan-turing
    type: person
    labels:
      ko: 앨런 튜링
      en: Alan Turing
    aliases: [Turing, A. M. Turing, 앨런 매티슨 튜링]
    external_ids:
      wikidata: Q7251
    same_as: []
    status: reviewed
    page_id: entity-...
```

- 440쪽의 title/aliases에서 자동 생성한다.
- 페이지가 있는 노드는 `page_id`로 연결한다.
- 상위 50개(degree 기준)만 `status: reviewed`.
- `status: auto` 노드가 3개 이상 문서에서 사용되면 `knowledge:check`가 경고한다.
- alias 충돌은 오류다. 자동 시드 단계에서는 충돌 후보를 리포트만 하고, 수동 검토에서 병합한다.

### 4.2 Works

```yaml
# catalog/works.yml
schema_version: 1
works:
  - key: work:on-computable-numbers
    title: On Computable Numbers, with an Application to the Entscheidungsproblem
    authors: [person:alan-turing]
    year: 1936
    identifiers:
      doi: 10.1112/plms/s2-42.1.230
    editions: []
```

- 소스 페이지의 `works.primary`에서 자동 시드한다.
- Phase 1에서는 관계 대상으로 쓰지 않아도 된다. 인용 중복 제거는 Phase 2에서 적용한다.

### 4.3 Aliases

```yaml
# catalog/aliases.yml
aliases:
  "concept-2ff6633d43e61407": concept:api
  "API": concept:api
  "응용 프로그래밍 인터페이스": concept:api
```

- 이전 key·해시 ID·제목·별칭을 key로 해석한다.
- alias는 전역 유일해야 한다.

## 5. 마이그레이션 알고리즘

### Phase 0 — 기준선

1. 현재 미커밋 연도 보강 작업을 별도 커밋/브랜치로 정리한다.
2. 로그 `id: log-2026-10-24-135` 중복을 136으로 재번호한다.
3. `legacy-2026-10-24` 태그를 만든다.
4. `contracts/routes.json`에 440개 URL과 리디렉션을 고정한다.

### Phase 1 — Registry 시드

```bash
npm run knowledge:seed -- --dry-run
npm run knowledge:seed
npm run knowledge:check -- --registry-only
```

산출물:

- `catalog/nodes.yml`
- `catalog/aliases.yml`
- `output/registry-report.json`
  - 노드 수, alias 충돌, 해시 key, 페이지 미연결

### Phase 2 — 관계 추출 dry-run

기존 `## 관계` 표를 파싱해 다음 리포트를 만든다.

```json
{
  "pages": 440,
  "pagesWithRelations": 362,
  "relations": 887,
  "unresolvedTargets": [],
  "missingEvidence": ["ref-137"],
  "unknownPredicates": [],
  "duplicateEdges": []
}
```

- 대상은 페이지 제목/별칭 → key로 해석한다.
- 근거는 소스 제목/별칭 → `src-*`/`ref-*`로 해석한다.
- 해석 실패가 1건이라도 있으면 쓰기 단계로 넘어가지 않는다.

### Phase 3 — 배치 변환

20~30쪽 단위로 다음을 수행한다.

1. `relations` frontmatter 추가.
2. `key`/`about` 추가.
3. 기존 `## 관계` 표를 generated block으로 교체.
4. `npm run knowledge:sync`.
5. `npm run knowledge:sync -- --check`.
6. `npm run knowledge:check`.
7. 로그 기록 후 커밋.

권장 배치:

| 배치 | 대상 | 목적 |
|---|---|---|
| 1 | concept 10쪽 | 가장 단순한 관계 표 검증 |
| 2 | entity 10쪽 | 인물·조직 key 검증 |
| 3 | analysis 10쪽 | 다주제 `about` 검증 |
| 4 | reference 10쪽 | evidence 없는 자기 관계 검증 |
| 5+ | 나머지 | 자동 + 표본 검토 |

### Phase 4 — 패리티 검증

전체 변환 후 다음을 비교한다.

- 440/440 문서
- 887/887 관계
- 대상 key 해석 100%
- generated block 100% 최신
- 페이지별 backlink 수
- 역사 렌즈 문서·연도 수
- 440개 URL과 리디렉션
- 내부 링크 0 broken

### Phase 5 — 정리

- 기존 관계 파서를 legacy adapter로 격리.
- `knowledge` 컴파일러를 유일한 파서로 전환.
- 새 문서는 처음부터 `relations`와 generated block을 사용.

## 6. 검증 규칙

### Schema

- `relations` 항목의 필수 필드와 타입
- `predicate` enum
- `key` 패턴
- `valid_from <= valid_to`
- `note` 길이

### Semantics

- `target`이 Registry에 존재
- `predicate`의 domain/range
- `subject`가 페이지 `key` 또는 명시 key
- `evidence.source`가 실제 소스 페이지
- 공개 지식 관계 evidence ≥ 1
- 중복 `(subject, predicate, target, evidence)` 금지
- 자기 참조 금지
- inverse 관계 일관성
- `superseded_by` 순환 금지

### Generated block

- 블록이 정확히 하나
- frontmatter와 렌더링 결과가 일치
- 수동 편집 흔적(`knowledge:relations:start` 밖의 관계 표) 금지

### Parity

- 기존 파서의 edge set과 새 컴파일러의 edge set이 동일
- backlink map 동일
- 페이지 수·연도 수 동일
- URL·리디렉션 동일

## 7. 실패·롤백

- 배치 단위 커밋으로 롤백 지점을 남긴다.
- `knowledge:check` 실패 시 다음 배치로 넘어가지 않는다.
- 변환 중 발견된 대상 미해결은 `output/relations-unresolved.json`에 기록한다.
- generated block은 frontmatter에서 재생성 가능하므로, 블록만 롤백해도 된다.
- 새 사이트 cutover 전까지 기존 파서를 fallback으로 유지한다.

## 8. 수용 기준

- [ ] 440/440 문서에 `key`가 있다.
- [ ] 887/887 관계가 frontmatter에 있다.
- [ ] 대상 미해결 0.
- [ ] 근거 없는 공개 지식 관계 0.
- [ ] 362/362 관계 문서의 generated block이 최신이다.
- [ ] `knowledge:check` 0 errors.
- [ ] 440개 URL·리디렉션 보존.
- [ ] 내부 링크 0 broken.
- [ ] 기존 158개 테스트 + 신규 그래프 테스트 통과.
- [ ] 배치별 작업 로그와 롤백 커밋이 있다.

## 9. 리스크

| 리스크 | 완화 |
|---|---|
| 887개 관계 변환 중 대상 오해 | dry-run 리포트, 0 unresolved 게이트 |
| YAML 이스케이프 오류 | YAML serializer 사용, lint |
| frontmatter 비대화 | 페이지당 관계 수 상한 경고, 분할 검토 |
| Obsidian에서 표가 안 보임 | generated block 유지 |
| Registry alias 충돌 | 자동 리포트 + 수동 병합 |
| 해시 key가 그대로 남음 | 상위 50개 우선 review, 나머지 auto |
| 기존 사이트 회귀 | parity + 병행 사이트 |
| `updated` 재상승 | 이미 2026-10-24이면 날짜를 다시 올리지 않음 |
