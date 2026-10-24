# Graph contract v1

Phase 2의 컴파일러는 `wiki/`, `catalog/`, `contracts/`를 읽어 정적 그래프를 만든다. 사이트는 이 산출물만 소비한다.

## 입력

```text
wiki/**/*.md              frontmatter + body
catalog/nodes.yml         nodes
catalog/aliases.yml       aliases
catalog/reviews.yml       reviewed/overrides
contracts/routes.json     legacy URL/redirect map
contracts/migration-baseline.json  frozen migration counts
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

## baseline

`contracts/migration-baseline.json`은 2026-10-24 마이그레이션 수용 시점의 스냅샷이다. 현재 산출물은 이 값보다 크거나 같아야 한다.

| 항목 | baseline |
|---|---:|
| documents | 440 |
| relation_documents | 362 |
| statements | 887 |
| redirects | 555 |

새 문서와 새 관계는 허용된다. baseline보다 작아지면 빌드가 실패한다. `contracts/routes.json`은 기존 440개 URL과 555개 redirect의 legacy map이며, 새 문서는 route가 없어도 `/docs/{id}/` URL을 얻는다.

## invariants

빌드가 실패하는 조건:

- target node가 없는 statement
- evidence source가 없는 statement
- source/reference가 아닌 evidence
- self statement
- statement id 형식 오류
- legacy baseline보다 작아진 문서·관계·redirect 수

기존 route가 사라지는 문제는 `site:parity`와 테스트가 별도로 검사한다. 중복 statement는 리포트에 기록하지만, 현재 0건이다.

## 테스트

`npm test`는 다음을 검증한다.

- legacy baseline 하한
- 기존 440 route의 문서 존재
- 모든 문서의 `/docs/{id}/` URL
- 모든 statement의 subject/target 등록
- backlink 존재
- graph invariant 0건
- timeline의 날짜 타입

## 다음 단계

Astro 앱은 `graph.json`과 `documents.json`만 읽는다. Markdown을 다시 파싱하지 않는다. 기존 440개 URL과 555개 redirect는 `contracts/routes.json`으로 보존하고, 새 문서는 현재 `documents.json`에서 자동으로 `/docs/{id}/` URL을 얻는다.
