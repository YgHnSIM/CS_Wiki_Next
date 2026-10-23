# Graph contract v1

Phase 2의 컴파일러는 `wiki/`, `catalog/`, `contracts/`를 읽어 정적 그래프를 만든다. 사이트는 이 산출물만 소비한다.

## 입력

```text
wiki/**/*.md              frontmatter + body
catalog/nodes.yml         nodes
catalog/aliases.yml       aliases
catalog/reviews.yml       reviewed/overrides
contracts/routes.json     URL/redirect contract
contracts/parity.json     expected counts
```

## 출력

```text
data/build/graph.json       nodes, statements, backlinks, timeline, parity
data/build/documents.json   metadata + body + URL
data/build/report.json      counts + issues + generated_at
```

`data/build/`는 생성물이며 커밋하지 않는다.

## graph.json

```json
{
  "schema_version": 1,
  "nodes": [
    {
      "key": "concept:computability",
      "type": "concept",
      "labels": { "ko": "계산 가능성" },
      "aliases": ["Computability"],
      "external_ids": {},
      "status": "reviewed",
      "page_id": "concept-..."
    }
  ],
  "statements": [
    {
      "id": "stmt:concept:a/enables/concept:b",
      "subject": "concept:a",
      "predicate": "enables",
      "target": "concept:b",
      "note": "...",
      "evidence": [
        { "source": "ref-010", "locator": null, "quote": null, "snapshot": null }
      ],
      "confidence": "unspecified",
      "valid_from": null,
      "valid_to": null,
      "document": "concept:a"
    }
  ],
  "backlinks": {
    "concept:b": [
      { "source": "concept:a", "predicate": "enables", "statement": "stmt:..." }
    ]
  },
  "timeline": [
    {
      "document": "concept:a",
      "publication_year": null,
      "event_start": 1936,
      "event_end": null,
      "layer": "theory"
    }
  ],
  "parity": {
    "documents": true,
    "relation_documents": true,
    "statements": true,
    "redirects": true
  }
}
```

### 규칙

- `nodes`·`statements`는 key/id 기준으로 정렬한다.
- `documents`는 `id` 기준으로 정렬한다.
- `statements`의 `subject`는 명시 `subject`가 없으면 페이지 `key`다.
- `evidence`는 `source`가 실제 source/reference 페이지일 때만 포함한다.
- `confidence`가 없으면 `"unspecified"`다. 값을 추정하지 않는다.
- `valid_from`/`valid_to`가 없으면 `null`이다.
- `backlinks`는 `statements`에서 파생된 인덱스다. 별도 원천이 아니다.
- `documents.json`의 `body`는 원문 그대로다. 관계 표는 generated block을 포함한다.
- `graph.json`에는 타임스탬프를 넣지 않는다. `report.json`에만 `generated_at`을 둔다.

## parity

`contracts/parity.json`의 값과 실제 산출물을 비교한다.

| 항목 | 값 |
|---|---:|
| documents | 440 |
| relation_documents | 362 |
| statements | 887 |
| redirects | 555 |

하나라도 다르면 빌드는 실패한다.

## invariants

빌드가 실패하는 조건:

- route가 없는 문서
- target node가 없는 statement
- evidence source가 없는 statement
- source/reference가 아닌 evidence
- self statement
- statement id 형식 오류
- parity 불일치

중복 statement는 리포트에 기록하지만, 현재 0건이다.

## 테스트

`npm test`는 다음을 검증한다.

- 440/362/887/555 parity
- 모든 statement의 subject/target 등록
- backlink 존재
- graph invariant 0건
- timeline의 날짜 타입

## 다음 단계

Astro 앱은 `graph.json`과 `documents.json`만 읽는다. Markdown을 다시 파싱하지 않는다. 440개 URL과 555개 리디렉션은 `contracts/routes.json`을 기준으로 검증한다.
