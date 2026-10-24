---
schema_version: 3
id: ref-155
key: source:ref-155
kind: reference
title: "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I"
aliases:
  - McCarthy 1960
  - Recursive Functions of Symbolic Expressions
  - LISP 1960 paper
summary: S-expression·M-expression·조건식·재귀 정의·apply/eval로 기호 계산을 형식화하고, IBM 704용 LISP의 리스트 구조와 garbage collection까지 제시한 McCarthy의 1960년 논문.
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
evidence_ids: []
capability_layers: []
history:
  publication_year: 1960
  layer: software
origin: local
works:
  primary:
    - citation: "McCarthy, Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I, CACM 1960"
      genre: primary-literature
      identifiers:
        - type: doi
          value: 10.1145/367177.367199
      edition: Communications of the ACM, April 1960
  supporting: []
access:
  - kind: local
    role: preservation
    path: "raw/McCarthy-60.pdf"
    sha256: "f13522e30c79e054cd8076b89cef85fe7b3fe1ec0ec60c1c8d4cd70cfb38849b"
    media_type: "application/pdf"
    bytes: 215722
    retrieved: 2026-10-25
  - kind: url
    role: original
    retrieved: 2026-10-25
    url: "https://doi.org/10.1145/367177.367199"
---

## 요약

McCarthy는 IBM 704용 **LISP(LISt Processor)** 을 기호 표현의 계산 체계로 설명한다. 논문은 수치 계산이 아니라 **S-expression**이라는 재귀적 리스트 구조를 대상으로 하고, 조건식과 재귀 정의로 함수를 구성한 뒤, 그 함수 정의 자체를 S-expression으로 표현한다.

핵심은 **`apply`라는 universal S-function** 이다. 함수의 S-expression과 인자 목록이 주어지면 `apply`가 `eval`을 통해 값을 계산하므로, `apply`는 이론적으로 universal Turing machine의 역할을 하고 실제로는 interpreter의 역할을 한다. 논문 후반부는 S-expression과 S-function을 IBM 704의 list structure·association list·free-storage list로 표현하고, 더 이상 접근할 수 없는 register를 회수하는 **garbage collection**을 설명한다.

## 핵심 개념

- **S-expression**: atomic symbol 또는 두 S-expression의 ordered pair. 리스트는 `(m1 · (m2 · ... · NIL))`로 표현한다.
- **M-expression**: 함수 정의를 읽기 쉽게 쓰는 표기. `car`, `cdr`, `cons`, `atom`, `eq`와 조건식·재귀·`label`·`lambda`를 사용한다.
- **conditional expression**: `(p1 → e1, ..., pn → en)` 형태로, 술어를 왼쪽부터 평가해 처음 참인 항의 값을 선택한다.
- **recursive definition**: 조건식과 자기 호출로 partial function을 정의한다.
- **apply / eval**: 함수 정의를 S-expression으로 바꾸고, `apply[f; args]`가 `eval`과 `appq`를 통해 적용한다. `eval[e; a]`의 `a`는 variable binding list로, substitution에서 생기는 bound-variable collision을 피한다.
- **list structure**: S-expression을 car/cdr pointer로 표현하며, circular structure는 허용하지 않는다.
- **free-storage list / garbage collection**: 사용하지 않는 register를 자동으로 회수한다. 회수 비용 때문에 memory를 거의 채우기 전에 동작해야 한다.

## 인용 위치

- §1 Introduction: LISP, Advice Taker, S-expression/S-function.
- §2 Functions and Function Definitions: partial function, conditional expression, recursive definition, `label`, `lambda`.
- §3 Recursive Functions of Symbolic Expressions: S-expression, elementary S-functions, recursive S-functions, `apply`.
- §3f The Universal S-Function apply: `apply[f; args] = eval[cons[f; appq[args]]; NIL]`.
- §4 The LISP Programming System: list structure, association list, free-storage list, garbage collection.
- §5–§6: 다른 형식화와 flowchart recursion.

> 이 페이지는 원문의 구조와 주장을 정리한 것이며, 정확한 수식·구현 세부는 PDF 원문을 직접 확인해야 한다.

## 한계

- `eval`은 강력하지만 성능·정적 검증·보안 비용을 만든다.
- 1960년 IBM 704의 word·register·character 제약을 전제로 한다.
- 논문의 `eval` 정의는 이후 구현·검증 과정에서 수정된 부분이 있으며, 원문 자체도 “이 버전은 완전히 맞지는 않다”는 후대 주석을 포함한다.
