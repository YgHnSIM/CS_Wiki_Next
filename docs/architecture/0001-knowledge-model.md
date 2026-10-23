# ADR 0001: 지식 그래프와 메타데이터 아키텍처

- **상태**: 승인 (2026-10-24)
- **범위**: `wiki/` 콘텐츠, 메타데이터, 지식 연결, 정적 사이트
- **관련**: schema v3, `log-2026-10-24-134`, `log-2026-10-24-135`

## 1. 배경

CS Wiki는 440개 문서, 362개 문서의 887개 관계, 164개 소스·참고 자료, 135개 작업 로그를 가진다. 콘텐츠는 Markdown과 YAML frontmatter로 관리되고, 현재 사이트 빌드가 Markdown을 직접 파싱해 그래프와 렌즈를 만든다.

schema v3에서 `review`·`editorial_status`·`private`를 제거하면서 페이지 메타데이터는 단순해졌다. 그러나 다음 문제가 남아 있다.

1. **관계의 원천이 본문 표 하나뿐**이다. `## 관계` 표는 사람이 읽기 좋지만, 시간·신뢰도·인용 위치를 표현하지 못하고 파서에 의존한다.
2. **근거가 여러 곳에 중복**된다. `evidence_ids`, `## 출처`, 관계 표의 근거, 본문 링크가 각각 존재한다.
3. **페이지와 지식 노드가 분리되지 않는다.** 분석 문서는 여러 개념을 다루지만 하나의 페이지 ID로만 식별된다.
4. **147개 페이지 ID가 해시형**이라 지식 연결의 의미 ID로 쓰기 어렵다.
5. **검증이 분산**되어 있다. schema, lint, manifest, site verify가 각자 다른 규칙을 검사한다.
6. **사이트 빌드가 그래프와 결합**되어 있다. UI 변경이 그래프 파싱에 영향을 준다.

## 2. 결정

| 번호 | 결정 | 선택 |
|---|---|---|
| 1 | 관계 메타데이터의 canonical 위치 | **frontmatter `relations`** |
| 2 | 식별자 | **`id`는 URL, `key`는 의미 ID** |
| 3 | 새 사이트 스택 | **Astro + TypeScript** |
| 4 | Registry 범위 | **전체 자동 시드 + 상위 50개 수동 검토** |
| 5 | 본문 관계 표 | **generated block으로 유지** |

핵심 원칙은 다음과 같다.

- `wiki/` Markdown은 계속 원본이다. 콘텐츠를 새로 쓰지 않는다.
- 메타데이터와 지식 연결은 **컴파일 가능한 정규 모델**로 분리한다.
- URL은 `/docs/{id}/` 계약을 유지한다. `id`를 바꾸지 않는다.
- 그래프는 빌드 시 생성되는 파생물이다. 런타임 데이터베이스를 두지 않는다.
- v3에서 v4로 대규모 마이그레이션하지 않는다. `key`, `about`, `relations`는 **가산적·선택적** 필드로 시작한다.

## 3. 목표 아키텍처

```text
wiki/*.md                       원고 (그대로)
    │
    ▼
Document Envelope               페이지 신원·공개 범위·본문
    │
    ├── Node Registry           인물·개념·작품·사건의 정규 ID
    ├── Relation Compiler       frontmatter relations → Statement
    ├── Evidence Resolver       출처·인용·스냅샷 연결
    └── Temporal Normalizer     사건·유효 기간
    │
    ▼
Knowledge Graph                 단일 정규 데이터
    │
    ├── Astro 정적 사이트
    ├── 검색 인덱스
    ├── 역사·근거·연결 렌즈
    └── graph.json / JSON-LD
```

### 3.1 계층

| 계층 | 책임 | 하지 않는 것 |
|---|---|---|
| Content | Markdown 본문, frontmatter | 그래프 계산 |
| Document | 페이지 신원, 공개 범위, 본문 | 지식 노드 정의 |
| Knowledge | 노드, 관계, 근거, 시간 | HTML 렌더링 |
| Projection | 사이트·검색·렌즈·내보내기 | Markdown 직접 파싱 |
| Validation | 스키마·의미·그래프 불변식 | UI 로직 |

### 3.2 Canonical 모델

#### Document

페이지 자체를 나타낸다.

```yaml
id: concept-computability        # URL 계약, 변경 금지
key: concept:computability       # 의미 ID
kind: concept
title: 계산 가능성
aliases: [computability]
about: [concept:computability]
publication_visibility: public
graph_visibility: public
created: 2026-07-01
updated: 2026-10-24
```

- `id`는 `/docs/{id}/`의 URL 키다.
- `key`는 지식 그래프의 노드 키다.
- `about`은 이 문서가 다루는 노드 목록이다. 기본값은 `[key]`다.
- 분석 문서는 여러 `about`을 가질 수 있다.

#### Node

인물·개념·작품·사건·장소·조직·분석을 페이지와 독립적으로 표현한다.

```yaml
key: person:alan-turing
type: person
labels:
  ko: 앨런 튜링
  en: Alan Turing
aliases: [Turing, A. M. Turing, 앨런 매티슨 튜링]
external_ids:
  wikidata: Q7251
same_as: []
status: reviewed
page_id: entity-...              # 페이지가 있는 경우
```

- `key`는 `type:slug` 형식이며 전역에서 유일하다.
- `status`는 `auto | reviewed | deprecated`다.
- `auto` 노드가 3개 이상 문서에서 사용되면 린트가 수동 검토를 권고한다.
- `page_id`는 페이지와 노드를 연결하지만, 노드가 페이지에 종속되지는 않는다.

#### Statement

관계를 정규화한 단위다.

```yaml
id: stmt:concept:computability/enables/concept:turing-machine
subject: concept:computability
predicate: enables
target: concept:turing-machine
note: 계산 가능성 개념이 튜링 기계라는 형식 모델을 가능하게 했다.
evidence:
  - source: ref-010
    locator: p. 230
    quote: "..."
confidence: established
valid_from: 1936
valid_to: null
```

- `subject`를 생략하면 페이지의 `key`가 기본값이다.
- `predicate`는 통제 어휘다.
- `evidence`는 관계 단위로 붙는다.
- `confidence`는 `established | probable | disputed | unknown`이다.
- `valid_from`/`valid_to`는 연도 단위로 시작하고, 필요하면 월·일·범위로 확장한다.

#### EvidenceRef

```yaml
source: ref-010
locator: p. 230
quote: "..."
snapshot: sha256:...
```

- `source`는 `src-*`/`ref-*` 페이지 ID다.
- `locator`와 `quote`는 선택이지만, 인용 주장에는 강하게 권장한다.
- 기존 `<!-- wiki-v2:quote-locator ... -->` 주석을 인용 앵커로 승격할 수 있다.

### 3.3 Registry

```text
catalog/
  nodes.yml
  works.yml
  vocabularies/
    predicates.yml
    domains.yml
    layers.yml
  aliases.yml
```

Registry는 **전거 통제(authority control)** 역할을 한다. 같은 인물·작품을 페이지마다 다르게 표기하지 않도록 정규 레코드를 둔다.

- 1차 마이그레이션에서 440개 페이지와 887개 관계의 대상에서 자동 시드한다.
- 상위 50개 고연결 노드만 수동 검토한다.
- 나머지는 `status: auto`로 두고, 사용 빈도가 높아지면 승격한다.
- `works.yml`은 소스 페이지의 `works.primary`에서 자동 시드하고, 인용 중복을 줄인다.

### 3.4 관계 표와 generated block

`relations`가 canonical이다. 본문 표는 표시용이다.

```md
## 관계

<!-- knowledge:relations:start -->
| 관계 | 대상 | 설명 | 근거 |
|---|---|---|---|
| enables | [[튜링 기계]] | 계산 가능성 개념이 ... | [[On Computable Numbers]] |
<!-- knowledge:relations:end -->
```

- `npm run knowledge:sync`가 frontmatter에서 표를 생성한다.
- `npm run knowledge:sync -- --check`는 표가 오래됐는지 검사한다.
- 생성 블록 안의 수동 수정은 린트 오류다.
- 블록 밖에는 관계 표를 두지 않는다.

## 4. 컴파일 파이프라인

```text
1. Discover      wiki/**/*.md
2. Parse         frontmatter + Markdown AST
3. Envelope      Document 생성
4. Resolve       위키링크·별칭 → Node key
5. Compile       relations → Statement
6. Attach        Evidence / Source / Work
7. Normalize     시간·공개 범위·그래프 노출
8. Validate      schema + semantics + graph invariants
9. Emit          graph.json, documents.json, backlinks, timeline
10. Build        Astro는 graph만 소비
```

- 그래프 생성은 결정적이어야 한다. 입력이 같으면 출력이 같아야 한다.
- 440개 규모에서는 JSON과 인메모리 인덱스로 충분하다.
- SQLite는 선택 사항이며, 빌드 산출물로만 사용한다.

## 5. 디렉터리

```text
wiki/                         # 기존 Markdown
raw/                          # 기존 원본
catalog/
  nodes.yml
  works.yml
  vocabularies/
    predicates.yml
    domains.yml
    layers.yml
  aliases.yml
packages/
  knowledge/
    src/
      parse/
      model/
      compile/
      validate/
      emit/
    tests/
app/                          # Astro
  src/pages/docs/[id].astro
  src/lib/graph.ts
data/build/                   # 생성물, gitignore
```

기존 `site/`는 새 앱이 parity를 넘을 때까지 reference로 유지한다.

## 6. 검증

`npm run knowledge:check` 하나로 다음을 검사한다.

### Schema

- frontmatter 타입·필수 필드·enum
- `relations` 항목 구조
- Registry 노드 구조

### Semantics

- `key`·alias·external ID 유일성
- 관계 대상 존재
- predicate의 domain/range
- 자기 참조·중복 간선·inverse 불일치
- 공개 지식의 관계 evidence 최소선
- `superseded_by` 순환·대상 unlisted
- 시간 구간 유효성
- generated block과 frontmatter의 패리티

### Graph invariants

- 역관계 일관성
- 이행 관계의 순환
- 고아·단일 근거·연도 미상·근거 없는 관계
- 모순 관계
- 공개 그래프와 unlisted 경계

### Output

- `graph-report.json`
- `dist/verify`의 URL·리디렉션·검색·사이트맵·noindex
- 변경 문서 + 영향받는 그래프만 검사하는 증분 모드

## 7. 마이그레이션 원칙

1. **콘텐츠 재작성 금지**: 본문 문장은 건드리지 않는다.
2. **URL 불변**: `/docs/{id}/`와 `redirect_from`을 유지한다.
3. **점진적**: 440쪽을 한 번에 바꾸지 않고 20~30쪽 배치로 커밋한다.
4. **parity 우선**: 새 모델의 페이지·관계·역링크·연도 수가 기존과 같아야 한다.
5. **실패 시 중단**: 대상 미해결·근거 미해결·표 패리티 실패 시 다음 배치로 넘어가지 않는다.
6. **로그 기록**: 각 배치마다 작업 로그와 롤백 지점을 남긴다.

## 8. 하지 않는 것

- 440쪽 본문을 새로 쓰지 않는다.
- URL을 바꾸지 않는다.
- 그래프를 런타임 DB로 만들지 않는다.
- 관계를 임베딩·유사도로 자동 확정하지 않는다. 추천은 가능하지만 공개 사실로 승격하지 않는다.
- `relations`와 본문 표를 둘 다 canonical로 두지 않는다.
- v4 대규모 마이그레이션을 다시 하지 않는다.

## 9. 결과

### 긍정적 결과

- 메타데이터의 단일 원천이 생긴다.
- 관계에 근거·시간·신뢰도를 붙일 수 있다.
- 페이지와 지식 노드를 분리해 분석 문서의 다주제 연결이 가능해진다.
- 사이트와 그래프를 독립적으로 변경할 수 있다.
- 검증 규칙이 한 곳으로 모인다.

### 비용과 위험

- 887개 관계를 frontmatter로 옮기는 마이그레이션이 필요하다.
- `relations`가 커지면 frontmatter가 길어진다. 페이지당 관계 수가 많은 문서는 분할을 검토한다.
- Obsidian은 frontmatter를 표로 렌더링하지 않으므로 generated block이 필요하다.
- Registry 자동 시드에는 중복·별칭 노이즈가 있다.
- Astro 전환은 URL·검색·렌즈 parity를 확인해야 한다.

## 10. 단계

| 단계 | 내용 | 콘텐츠 변경 |
|---|---|---|
| Phase 0 | 기준선 고정, 태그, 라우트 계약 | 없음 |
| Phase 1 | Registry 시드 + relations 마이그레이션 + generated block | 메타데이터 재배치 |
| Phase 2 | `knowledge` 컴파일러 + parity 테스트 | 없음 |
| Phase 3 | Astro 앱 병행 구축·cutover | 없음 |
| Phase 4 | 새 문서부터 `relations`/`about` 저작 | 신규만 |

## 11. 성공 지표

- 440/440 문서 파싱
- 887/887 관계 보존 (허용된 예외 제외)
- 대상 미해결 0
- generated block 패리티 100%
- 440개 URL·리디렉션 보존
- 공개 지식 관계 evidence 커버리지 100%
- 빌드 시간·출력 크기 기존 대비 악화 없음
- `knowledge:check`가 변경 문서만 검사

## 12. 열린 결정

- 작품(`works.yml`)을 Phase 1에서 필수로 할지, Phase 2로 미룰지
- 사건을 독립 Node로 승격할지, 페이지 `history`에 둘지
- 검색을 기존 커스텀 인덱스로 유지할지, Pagefind로 교체할지
- 해시형 147개 페이지의 `key`를 어디까지 사람이 읽을 수 있게 정리할지
- 분석 문서의 관계 `subject`를 문서 노드로 둘지, `about` 노드로 둘지
