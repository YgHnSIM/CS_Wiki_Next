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
summary: M.I.T. AI 그룹의 Advice Taker 계획에서 출발해 비엄격 조건식·재귀 정의·S-표현·apply/eval로 기호 계산과 계산 이론을 형식화하고, IBM 704용 가비지 컬렉션과 푸시다운 스택 기반 재귀 컴파일러까지 제시한 McCarthy의 1960년 논문.
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

John McCarthy는 M.I.T. 인공지능 연구 그룹에서 상식적 추론 시스템인 **Advice Taker**(McCarthy 1958) 실험을 위해 개발된 **LISP(LISt Processor)**을 소개한다. 논문은 LISP을 단순한 프로그래밍 언어에 한정하지 않고, 튜링 기계의 수학적 취급 곤란을 보완할 **새로운 계산 이론 체계(vehicle for developing a theory of computation)**로 제시한다.

논문은 수치 계산 위주의 기존 패러다임을 벗어나 **S-expression(기호 표현)**이라는 순서쌍 데이터 구조를 정의하고, 5대 원시 함수(`atom`, `eq`, `car`, `cdr`, `cons`)와 비엄격 조건식, 재귀 정의만으로 모든 계산 가능한 함수(튜링 완전성)를 구성한다. 이어 메타 언어(M-expression)로 작성된 함수 정의 자체를 S-expression 데이터로 일대일 번역하는 **호모아이코니시티(Homoiconicity)**를 확립하고, 이를 해석·평가하는 universal S-function **`apply`와 `eval`**을 유도한다. `apply`는 이론적으로 **보편 튜링 기계(Universal Turing Machine)**이며 실용적으로는 **메타순환 인터프리터**다.

후반부에서는 IBM 704의 36비트 워드(`address`=car, `decrement`=cdr)에 기반한 리스트 물리 메모리 구조, 인류 역사상 최초의 **자동 메모리 회수(Mark & Sweep Garbage Collection)**, 그리고 인터프리터 대비 60배 고속 처리를 가능하게 한 **푸시다운 스택(Pushdown Stack) 기반 재귀 함수 컴파일러**를 상술한다. 마지막으로 명령형 플로우차트와 상호 재귀 함수의 수학적 변환 알고리즘을 증명한다.

## 원문 구조 및 핵심 개념

### 1. 연구 동기와 계산 이론 (§1, §2)
- **두 가지 목표**: 기호 정보를 간결하게 다루는 실용적 프로그래밍 언어이자, 튜링 기계를 대신해 프로그램의 수학적 성질을 증명하고 발전시킬 계산 이론의 기초.
- **부분 함수 (Partial Functions, §2a)**: 계산 절차는 일부 입력에 대해 정지(terminate)하지 않을 수 있으므로, 계산 이론과 언어 모델은 반드시 부분 함수를 포용해야 한다.
- **조건식 (Conditional Expressions, §2c-d)**: `(p1 → e1, ..., pn → en)` 형태로 술어를 왼쪽부터 검사해 최초의 참인 조건 $p_i$의 $e_i$만 선택 평가한다. 이 **비엄격 평가(단락 평가)** 덕분에 $0 \cdot (0 - 1)!$ 같은 미정의/무한 루프에 빠지지 않고 재귀 함수를 정의할 수 있다.
- **함수와 형식의 구분 및 $\lambda$-표기 (§2e)**: Alonzo Church의 표기를 따라 형식(form)과 함수(function)를 엄격히 분리한다.
- **`label` 연산자의 도입 (§2f)**: Church의 $\lambda$-표기만으로는 함수 본체 내부에서 자기 자신을 참조할 이름이 없어 재귀 함수를 닫힌 형태로 명명할 수 없다(N. Rochester가 지적). McCarthy는 `label(a, E)`를 도입해 재귀 함수의 닫힌 명명을 완성한다.

### 2. 기호식과 보편 함수 apply/eval (§3)
- **S-expression (기호식, §3a)**: 원자 기호(atomic symbol) 또는 두 S-expression의 순서쌍 `(e1 · e2)`. 리스트 `(m1, ..., mn)`은 `(m1 · (... · (mn · NIL)...))`의 축약 표기다.
- **5대 원시 함수와 술어 (§3c)**:
  - `atom[x]`: 원자 판별
  - `eq[x; y]`: 원자 동일성 판별
  - `car[x]`: 순서쌍의 첫 번째 요소 추출
  - `cdr[x]`: 순서쌍의 두 번째 요소 추출
  - `cons[x; y]`: 두 요소로 순서쌍 결합
  - 이 5대 연산자와 조건식, 재귀 정의를 결합하면 모든 계산 가능한 함수를 표현할 수 있다.
- **M-expression의 S-expression 번역 (Homoiconicity, §3e)**: 메타 언어의 함수 정의를 `(QUOTE, E)`, `(COND, ...)`, `(LAMBDA, ...)`, `(LABEL, ...)` 등 S-expression 데이터로 변환한다.
- **Universal S-function `apply`와 `eval` (§3f)**:
  - `apply[f; args] = eval[cons[f; appq[args]]; NIL]`
  - 함수 정의가 담긴 S-식과 인자 목록을 받아 값을 평가한다.
  - 치환(substitution) 시 발생하는 구속 변수 충돌(collision of bound variables)을 피하기 위해 **환경 리스트 $a$(Association List)**를 인자로 전달한다.
- **고계 함수(Higher-order functions, §3g)**: `maplist`, `search`, 그리고 기호 미분(`diff`)을 구현해 함수를 인자로 넘기고 조작하는 패러다임을 확립한다.

### 3. IBM 704 시스템 구현과 물리적 최적화 (§4)
- **List Structure (§4a)**: 36-bit 워드의 `address` 필드를 `car`, `decrement` 필드를 `cdr` 포인터로 매핑한다. 순환 리스트(circular structure)는 출력 및 연산 복잡성 문제로 금지하고 방향성 비순환 그래프(DAG) 형태의 부분식 공유만 허용한다.
- **Association List (§4b)**: 원자 기호에 print name, 루틴 포인터, 수치 값 등을 결합하는 구조(후대의 Property List).
- **Free-Storage List와 Garbage Collection (§4c)**:
  - 초기 약 15,000개 레지스터로 구성된 자유 저장 목록(free-storage list)을 운용한다.
  - 메모리가 고갈되면 사용자의 수동 해제 없이 기본 레지스터(base registers)에서 `car`/`cdr` 체인으로 도달 가능한 모든 레지스터를 추적(Mark)하고, 도달 불가능한 고립 레지스터를 자동으로 회수(Sweep)하는 재활용 주기(reclamation cycle)를 실행한다.
- **LISP 컴파일러와 푸시다운 스택 (§4c item 5)**:
  - 인터프리터에 그치지 않고 S-function을 머신 코드로 번역하는 컴파일러를 개발했다.
  - 컴파일된 함수는 **인터프리터 대비 약 60배 빠르게 실행**된다.
  - 재귀 호출 과정에서 이전 레지스터 상태를 보존하기 위해 **푸시다운 스택(Pushdown Stack)**을 구현했다.

### 4. 플로우차트와 재귀의 상호 변환 (§6)
- 컴퓨터의 상태 벡터 $\xi$와 단일 진입/단일 탈출 블록의 사상 $f(\xi)$를 정의한다.
- 임의의 명령형 플로우차트(점프와 조건 분기)를 상호 재귀 함수 체계로 엄밀히 사상하는 변환 알고리즘을 증명하여, 절차적 제어 흐름과 함수형 재귀의 수학적 동치성을 확립한다.

## 인용 위치

- §1 Introduction (pp. 184–185): Advice Taker, LISP의 2대 목표(언어 및 계산 이론).
- §2 Functions and Function Definitions (pp. 185–187): partial functions, conditional expressions, $\lambda$-notation, `label`.
- §3 Recursive Functions of Symbolic Expressions (pp. 187–191): S-expressions, 5대 기본 함수, M-식 번역, `apply`/`eval`, 고계 함수 `maplist`/`diff`.
- §4 The LISP Programming System (pp. 191–194): list structure, association lists, free-storage list, garbage collection, 재귀 컴파일러(60배 고속화, 스택).
- §5 Another Formalism (p. 194): Linear LISP(문자열 기반)과의 비교.
- §6 Flowcharts and Recursion (pp. 194–195): 플로우차트의 재귀 함수 환원 증명.

## 한계와 논점

- **스코핑 결함**: 논문에 제시된 초판 `eval`은 환경 리스트에 단순 누적하는 dynamic scoping 특성을 띠며, 변수 캡처 및 클로저 처리에서 미묘한 결함이 있었다(1995년 저자 각주 및 Herbert Stoyan 1991 참조).
- **초기 하드웨어 제약**: IBM 704의 6비트 문자 코드(47자 인쇄 가능)로 인해 S-표현 표기가 대문자 위주로 제한되었다.
- **해석과 보안 비용**: 코드가 데이터로 취급되고 런타임에 `eval`로 평가되는 유연성은 현대 시스템에서 정적 검증의 곤란과 임의 코드 실행(Arbitrary Code Execution)이라는 보안 공격 표면을 만든다.
