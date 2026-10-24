---
schema_version: 3
id: analysis-mccarthy-eval-symbolic-computation
key: analysis:mccarthy-eval-symbolic-computation
kind: analysis
title: eval은 왜 프로그램과 데이터의 경계를 지우는가
aliases:
  - McCarthy eval
  - Lisp eval analysis
summary: McCarthy의 S-expression·apply·eval이 프로그램과 데이터를 같은 표현으로 만들어 기호 조작과 프로그래밍 가능성을 어떻게 연결하는지, list structure와 garbage collection까지 함께 분석한다.
domains:
  - programming-languages
  - computer-science
  - computer-history
publication_visibility: public
graph_visibility: public
status: current
page_role: knowledge
created: 2026-10-25
updated: 2026-10-25
evidence_ids:
  - ref-155
capability_layers:
  - computability
  - programmability
history:
  layer: software
relations:
  - predicate: implements
    target: concept:symbolic-manipulation
    evidence:
      - source: ref-155
        locator: §3 S-expressions
  - predicate: enables
    target: concept:programmability
    evidence:
      - source: ref-155
        locator: §3f Universal S-Function apply
---

## 문제

초기 컴퓨터는 수치 계산을 중심으로 설계됐다. 그러나 기호·목록·함수 정의를 계산 대상으로 삼으려면, 프로그램을 어떤 표현으로 쓰고 그것을 어떤 규칙으로 평가할지 정해야 한다. McCarthy는 이 문제를 S-expression과 재귀 함수, 그리고 `apply`/`eval`로 구성한다.

## S-expression과 M-expression

S-expression은 atomic symbol 또는 두 S-expression의 ordered pair다. 리스트는 `NIL`로 끝나는 cons 체인으로 표현된다. 함수 정의는 `car`, `cdr`, `cons`, `atom`, `eq`와 조건식·재귀·`label`·`lambda`를 사용하는 M-expression으로 쓰고, 이를 다시 S-expression으로 번역한다.

이 번역이 핵심이다. **함수 정의 자체가 S-expression이 되므로**, 함수의 표현과 함수가 처리하는 데이터가 같은 형식을 공유한다.

## apply와 eval

`apply[f; args]`는 함수의 S-expression `f`와 인자 목록 `args`를 받아 `eval`로 값을 계산한다. `eval[e; a]`에서 `a`는 variable binding list이며, substitution 대신 environment를 사용해 bound-variable collision을 피한다.

이 구조에서 `apply`는 universal S-function이다. 함수 정의를 입력으로 받아 실행할 수 있다는 점에서 이론적으로 universal Turing machine의 역할을 하고, 실제로는 interpreter의 역할을 한다.

## 프로그램과 데이터의 경계

- 프로그램은 데이터처럼 전달·저장·변환될 수 있다.
- `eval`은 프로그램을 입력으로 받아 평가하는 보편적 평가기다.
- 메타순환 평가기는 언어가 자기 자신을 기술하는 경로를 연다.
- 그러나 유연성은 성능·정적 검증·보안 비용을 만든다.

## 기계 표현

논문은 S-expression을 IBM 704의 list structure로 표현한다. 각 word의 address/decrement field가 car/cdr pointer가 되고, atomic symbol은 association list로 표현한다. Circular structure는 허용하지 않는다.

동적 할당은 **free-storage list**로 관리한다. 사용하지 않는 register는 자동으로 회수되며, 이 과정이 garbage collection이다. 회수는 공짜가 아니므로 memory를 거의 채우기 전에 동작해야 한다. 이는 `eval`의 언어적 유연성과 기계적 비용이 분리되지 않는다는 점을 보여준다.

## 읽는 법

- **기호 조작**: S-expression은 기호를 데이터로 다루는 표현 형식이다.
- **프로그래밍 가능성**: 프로그램과 데이터의 동일 표현은 언어가 자기 자신을 다루는 기반이 된다.
- **저장 프로그램 컴퓨터**: 명령과 데이터를 같은 저장소에 두는 원리가 언어 수준에서 반복된다.
- **자원 효율**: list structure와 garbage collection은 기호 계산의 숨은 비용을 드러낸다.

## 한계

`eval` 중심 모델은 강력하지만, 성능·정적 검증·보안 측면에서는 별도 설계가 필요하다. 1960년 논문의 `eval` 정의는 이후 구현·검증에서 수정된 부분이 있고, 원문도 후대 주석에서 그 한계를 인정한다. McCarthy의 논문은 계산 모델과 초기 구현을 제시한 것이지, 현대 Lisp 구현의 모든 특성을 정의한 것은 아니다.

## 관계

<!-- knowledge:relations:start -->
| 관계 | 대상 | 설명 | 근거 |
|---|---|---|---|
| implements | [[기호 조작]] |  | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
| enables | [[프로그래밍 가능성]] |  | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
<!-- knowledge:relations:end -->
