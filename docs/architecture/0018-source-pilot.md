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

- LISP와 Advice Taker (프로그래밍 언어와 계산 이론 체계의 동시 확립)
- partial function(정지 문제의 필연성), non-strict conditional expression(단락 평가)
- Church λ-대수의 한계와 `label` 연산자
- S-expression (원자와 순서쌍 DAG), 5대 기본 함수(`car`/`cdr`/`cons`/`atom`/`eq`)와 튜링 완전성
- M-expression → S-expression 번역 (Homoiconicity)
- `apply[f; args] = eval[cons[f; appq[args]]; NIL]` (UTM이자 인터프리터)
- `eval[e; a]`의 environment $a$(속박 변수 충돌 방지)와 고계 함수(`maplist`, `diff`)
- IBM 704 list structure(address/decrement 필드 매핑), association list, free-storage list
- 인류 최초의 Mark & Sweep garbage collection
- 푸시다운 스택(Pushdown Stack) 기반 재귀 컴파일러 (인터프리터 대비 60배 고속화)
- Linear LISP과의 비교 및 flowchart recursion의 수학적 변환 알고리즘

## 결과 문서

- source: `ref-155` (Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I)
- analysis: `analysis-mccarthy-eval-symbolic-computation` (S-표현과 eval은 왜 프로그램과 데이터의 경계를 지우는가)
- 관련 지식 문서 fan-out 통합:
  - `concept:symbolic-manipulation` (기호 조작)
  - `concept:programmability` (프로그래밍 가능성)
  - `concept:computability` (계산 가능성)
  - `concept:page-676372e6` (보편 튜링 기계)
  - `concept:page-26360c8b` (프로그래밍 언어)
  - `concept:page-2a99ca9c` (IBM 704)
  - `concept:page-c297dc5b` (스택)
  - `concept:subroutine` (서브루틴)
  - `concept:compiler` (컴파일러)
  - `concept:page-7cc49c18` (제어 구조)
  - `person:alonzo-church` (알론조 처치)
  - `document:computation-reading-guide` (계산 독서 지도)

source·analysis를 원문 PDF(34쪽, 1995년 저자 주석 포함) 기준으로 작성하고, 관련 개념·인물·독서 지도 문서의 본문·evidence_ids·출처·관련 항목을 함께 갱신했다.

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
