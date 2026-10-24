# ADR 0018: Single-Source Ingest — McCarthy 1960

## 상태

채택 — 2026-10-25

## 배경

이전 시도에서는 SEDA를 사용자가 제공하지 않은 추가 소스로 넣고, source·analysis를 먼저 커밋한 뒤 concept 통합을 별도 커밋으로 나눴다. 이는 LLM Wiki의 “소스 1개를 읽고 기존 지식에 한 번에 통합한다”는 절차와 맞지 않았다.

또한 `wiki:ingest`는 **document id 충돌만 검사**하고 URL·DOI·raw SHA 중복은 검사하지 않았다. 그래서 같은 소스를 새 ID로 다시 넣을 수 있었다.

## 결정

### 1. 단일 소스만 처리

- 사용자가 제공한 `raw/McCarthy-60.pdf`만 소스로 사용
- SEDA는 취소
- source·analysis·concept 통합을 **한 작업 단위**로 처리
- 중간 커밋 없이 한 번에 검증 후 커밋

### 2. Ingest 중복 검사

`wiki:ingest`는 새 소스를 만들기 전에 기존 source/reference와 다음을 비교한다.

- access URL 정규화
- DOI identifier
- local raw SHA-256

중복이면:

```text
source already ingested as <id> (<title>); update that source instead
```

### 3. 논문 정독

`raw/McCarthy-60.pdf`에서 확인한 내용:

- LISP와 Advice Taker
- partial function, conditional expression, recursive definition
- `label`, `lambda`
- S-expression, `car`/`cdr`/`cons`/`atom`/`eq`
- M-expression → S-expression 번역
- `apply[f; args] = eval[cons[f; appq[args]]; NIL]`
- `eval[e; a]`의 environment
- IBM 704 list structure, association list, free-storage list
- garbage collection
- flowchart recursion

## 결과 문서

- source: `ref-155`
- analysis: `analysis-mccarthy-eval-symbolic-computation`
- concept: `concept:symbolic-manipulation`
- concept: `concept:programmability`

source·analysis는 새로 추가하고, 두 concept는 본문·evidence_ids·관련 항목을 갱신했다.

## 결과

```text
pages   1,022
docs      444
search    400
sitemap   422
tests      22 pass
wiki:lint  444 pages, 0 issues
```

## 하지 않은 것

- SEDA 처리
- source와 analysis의 분리 커밋
- PDF OCR 자동화
- LLM API 기반 요약
