# Knowledge schema v1

Phase 1 지식 그래프의 **초안 스키마**다. 아직 `schema/wiki-page.schema.json`에 연결되지 않았고, 마이그레이션 도구가 이 계약을 사용할 예정이다.

| 파일 | 대상 |
|---|---|
| `relations.schema.json` | 페이지 frontmatter의 `relations` 배열 |
| `registry.schema.json` | `catalog/nodes.yml`의 노드 전거 레코드 |

## 관계 예

```yaml
relations:
  - predicate: enables
    target: concept:turing-machine
    note: 계산 가능성 개념이 튜링 기계라는 형식 모델을 가능하게 했다.
    evidence:
      - source: ref-010
        locator: p. 230
```

## Registry 예

```yaml
schema_version: 1
nodes:
  - key: person:alan-turing
    type: person
    labels:
      ko: 앨런 튜링
      en: Alan Turing
    aliases: [Turing, A. M. Turing]
    external_ids:
      wikidata: Q7251
    status: reviewed
```

## 주의

- `relations`는 아직 page schema의 required/allowed 필드가 아니다. Phase 1 마이그레이션에서 `schema/wiki-page.schema.json`에 선택 필드로 추가한다.
- `evidence` 배열은 스키마상 0개를 허용하지만, 공개 지식 문서의 관계는 의미 검증에서 1개 이상을 요구한다.
- `key` 접두사와 `type`의 일치, alias 유일성, 대상 존재 여부는 JSON Schema가 아니라 `knowledge:check`의 의미 검증에서 확인한다.
- `works.yml`, 시간 범위, `confidence` 기본값은 Phase 2에서 확장한다.
