# Catalog

지식 그래프의 전거 파일(authority file)이다.

```text
nodes.yml                 인물·개념·작품·사건 노드
reviews.yml               상위 50개 검토·key/type override
works.yml                 문헌·판본
aliases.yml               제목·별칭·이전 key → key
vocabularies/
  predicates.yml          관계 어휘
  domains.yml             주제 분류
  layers.yml              능력·역사 층위
```

## 원칙

- `key`는 전역에서 유일하다.
- `aliases`는 전역에서 유일하다.
- `status: auto`는 자동 시드, `reviewed`는 사람이 확인한 노드다.
- `auto` 노드가 3개 이상 문서에서 사용되면 수동 검토를 권장한다.
- Registry는 콘텐츠를 대체하지 않는다. 페이지의 제목·본문은 그대로 유지한다.

Phase 1에서 `nodes.yml`과 `aliases.yml`을 자동 시드하고, 상위 50개만 `reviewed`로 승격한다.
