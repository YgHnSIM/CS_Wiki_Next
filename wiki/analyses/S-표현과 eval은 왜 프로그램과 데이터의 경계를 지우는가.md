---
schema_version: 3
id: analysis-mccarthy-eval-symbolic-computation
key: analysis:mccarthy-eval-symbolic-computation
kind: analysis
title: S-표현과 eval은 왜 프로그램과 데이터의 경계를 지우는가
aliases:
  - eval은 왜 프로그램과 데이터의 경계를 지우는가
  - McCarthy eval
  - Lisp eval analysis
summary: McCarthy의 1960년 LISP 논문을 바탕으로, S-표현(Homoiconicity)과 universal function eval이 어떻게 프로그램과 데이터의 경계를 허물고 기호 조작·프로그래밍 가능성·계산 가능성을 하나로 엮었는지 분석한다.
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
    note: S-표현(순서쌍 DAG)과 5대 기본 함수(car/cdr/cons/atom/eq)를 통해 기호 조작을 튜링 완전한 언어 실행 모델로 구체화한다.
    evidence:
      - source: ref-155
        locator: §3 Recursive Functions of Symbolic Expressions
  - predicate: enables
    target: concept:programmability
    note: 프로그램과 데이터를 동일한 S-표현으로 다루는 호모아이코니시티와 eval을 통해 언어가 자기 자신을 입력받아 해석·변형하는 메타 프로그래밍 가능성을 연다.
    evidence:
      - source: ref-155
        locator: §3f The Universal S-Function apply
  - predicate: synthesizes
    target: concept:computability
    note: Universal S-function apply를 통해 보편 튜링 기계(UTM)의 역할을 프로그래밍 언어 인터프리터 수준에서 함수론적으로 재구성한다.
    evidence:
      - source: ref-155
        locator: §1 Introduction & §3f The Universal S-Function apply
---

## 핵심 질문

초기 전자계산기는 폰 노이만의 저장 프로그램 원리에 따라 명령어와 데이터를 물리 메모리에 나란히 담았지만, 포트란이나 초기 어셈블리 언어에서 **프로그램은 문법적으로 작성되어 컴파일러에 의해 기계어로 고정되는 실행 대상**이었고, **데이터는 그 프로그램이 읽고 쓰는 수치 값**이었다.

John McCarthy의 1960년 논문 [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]]은 이 이분법을 무너뜨린다. 프로그램과 데이터의 경계는 어떻게 지워졌는가? 그 핵심은 단순히 동적 실행 함수인 `eval`의 존재가 아니라, **프로그램의 추상 구문을 데이터 구조 그 자체로 일치시킨 S-표현(S-expression)의 발명**과 **이를 값으로 환원하는 보편 평가기(Universal S-Function)**의 결합에 있다.

## 1. 표현의 일치: S-표현과 호모아이코니시티

기호 계산을 다루기 위해 McCarthy는 원자(atomic symbol)와 순서쌍 `(e1 · e2)`으로 구성되는 **S-expression(기호 표현)**을 정의했다. 리스트 `(m1, ..., mn)`은 `NIL`로 종단되는 중첩된 순서쌍이다.

논문은 사람이 읽고 쓰기 쉬운 메타 언어인 **M-expression(메타 표현)**으로 함수를 정의한 뒤, 이를 S-expression 데이터로 변환하는 일대일 번역 규칙($E^*$)을 규정했다:
- 원자 및 변수: 대문자 원자 기호(`CAR`, `X`)
- 함수 호출 $f[e_1; \dots; e_n]$: 리스트 `(f*, e1*, ..., en*)`
- 조건식 $[p_1 \to e_1; \dots]$: `(COND, (p1*, e1*), ...)`
- 람다식 $\lambda[[x_1; \dots]; E]$: `(LAMBDA, (x1*, ...), E*)`
- 재귀 레이블 $\text{label}[a; E]$: `(LABEL, a*, E*)`

이 규칙에 따라 작성된 함수 정의는 특수한 바이너리나 불투명한 기계 명령어가 아니라, **`car`, `cdr`, `cons`로 분해하고 조립할 수 있는 일반적인 리스트 데이터**가 된다. 즉, 프로그램의 문법적 구조와 언어가 다루는 데이터 구조가 완전히 포개어지는 **호모아이코니시티(Homoiconicity, 동형성)**가 확립된다.

## 2. 보편 기계의 구현: apply와 eval

호모아이코니시티가 확립되자, 프로그램 코드를 입력 데이터로 받아 실행하는 보편 함수(Universal S-function)의 도출이 필연적으로 뒤따랐다:

$$\text{apply}[f; \text{args}] = \text{eval}[\text{cons}[f; \text{appq}[\text{args}]]; \text{NIL}]$$

`apply`는 함수를 나타내는 S-표현 $f$와 인자 목록을 결합하여 `eval`에 넘긴다. `eval[e; a]`는 두 개의 인자를 받는다:
1. $e$: 평가할 S-표현 (코드)
2. $a$: 변수와 값의 대응쌍 목록인 **환경(Association List, $a$-list)**

이 구조에서 `apply`/`eval`은 두 가지 층위의 의미를 동시에 갖는다:
- **이론적 의미 (보편 튜링 기계)**: 앨런 튜링이 테이프 위에 임의의 기계 기술 번호(description number)를 적어 모사했던 보편 튜링 기계(UTM)의 역할을, 람다 계산과 재귀 함수론 위에서 함수 형태로 온전히 실현했다.
- **실용적 의미 (메타순환 인터프리터)**: 프로그래밍 언어의 실행기를 그 언어 자신의 원시 연산자(`atom`, `eq`, `car`, `cdr`, `cons`, `cond`)로 간결하게 기술할 수 있음을 입증했다.

또한 McCarthy는 람다 대수의 단순 치환(substitution)이 유발하는 구속 변수 충돌(collision of bound variables) 문제를 파악하고, 명시적인 바인딩 환경 $a$를 인자로 전달하는 방식을 택해 이름 충돌을 회피했다.

## 3. 재귀와 비엄격 평가의 수학적 필연성

기호 계산이 튜링 완전한 계산 모델로 서기 위해 McCarthy는 두 가지 수학적 장치를 도입했다:
1. **`label` 연산자**: Church의 람다 표기는 함수 본체에서 자기 자신을 지칭할 이름이 없기 때문에 재귀 함수를 닫힌 형태로 표현할 수 없었다. McCarthy는 $\text{label}(a, E)$를 고안해 $E$ 내부의 $a$가 $E$ 전체를 재귀적으로 가리키도록 바인딩했다.
2. **조건식의 비엄격성 (Non-strict Evaluation)**: 조건식 `(p1 -> e1, ..., pn -> en)`은 왼쪽부터 술어를 검사해 최초로 참이 되는 항만 평가하고 나머지는 평가하지 않는다(단락 평가). 만약 모든 항을 미리 평가하는 엄격한 방식을 취했다면, 팩토리얼 계산 등에서 $0 \cdot (0-1)!$ 같은 발산/오류 분기를 피할 수 없어 재귀적 계산 모델 자체가 성립할 수 없었다.

## 4. 물리적 구현: 가비지 컬렉션과 컴파일러의 이중성

프로그램이 런타임에 데이터 리스트를 자유롭게 생성하고, 함수 정의 자체가 메모리에 동적으로 적재되는 환경은 컴퓨터 하드웨어에 전례 없는 요구를 제기했다:
- **메모리 단편화와 회수**: 고정된 블록 할당으로는 임의의 크기를 갖는 기호 리스트를 감당할 수 없었다. McCarthy는 사용 가능한 워드를 **자유 저장 목록(free-storage list)**으로 엮고, 가용 워드가 고갈되면 베이스 레지스터에서 도달 가능한 노드를 추적하여 고립된 워드를 자동으로 수거하는 **최초의 가비지 컬렉션(Mark & Sweep Garbage Collection)**을 구현했다.
- **인터프리터와 컴파일러의 공존**: 동적 평가기 `eval`은 유연하지만 기계어 대비 느렸다. 논문은 S-function을 머신 코드로 번역하는 LISP 컴파일러를 제시했으며, **컴파일된 함수가 인터프리터보다 약 60배 빠르게 실행**됨을 보였다. 특히 재귀 호출 시 임시 레지스터 값을 보존하기 위해 **푸시다운 스택(Pushdown Stack)** 메커니즘을 시스템에 정착시켰다.

## 5. 개념적 결론과 현대적 한계

`S-표현`과 `eval`은 프로그램을 '컴파일러가 기계어로 번역하고 버리는 일회성 텍스트'에서 **'프로그램 자신이 직접 읽고, 변형하고, 생성할 수 있는 일급 데이터(First-class Data)'**로 탈바꿈시켰다. 이는 훗날 매크로 시스템, 코드 생성, 도메인 특화 언어(DSL), 메타 프로그래밍의 원천이 되었다.

그러나 이 경계의 해체는 현대 컴퓨팅에서 무거운 대가를 요구한다:
1. **동적 스코핑의 혼란**: 논문의 초기 `eval`은 환경 $a$에 바인딩을 누적하는 방식을 취해 동적 스코핑(dynamic scoping)을 낳았고, 이는 클로저의 어휘적 유효범위(lexical scope)가 정립되기 전까지 미묘한 버그를 유발했다.
2. **정적 검증과 최적화의 곤란**: 데이터가 언제든 코드로 실행될 수 있다는 가능성은 컴파일 시점의 정적 타입 검증과 사전 최적화를 극도로 어렵게 만든다.
3. **보안 공격 표면**: "신뢰할 수 없는 데이터가 코드로 평가되는 경계"는 SQL 인젝션, 원격 코드 실행(RCE), 동적 스크립트 삽입 등 현대 시스템 취약점의 가장 핵심적인 근원이 되었다.

## 관계

<!-- knowledge:relations:start -->
| 관계 | 대상 | 설명 | 근거 |
|---|---|---|---|
| implements | [[기호 조작]] | S-표현(순서쌍 DAG)과 5대 기본 함수(car/cdr/cons/atom/eq)를 통해 기호 조작을 튜링 완전한 언어 실행 모델로 구체화한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
| enables | [[프로그래밍 가능성]] | 프로그램과 데이터를 동일한 S-표현으로 다루는 호모아이코니시티와 eval을 통해 언어가 자기 자신을 입력받아 해석·변형하는 메타 프로그래밍 가능성을 연다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
| synthesizes | [[계산 가능성]] | Universal S-function apply를 통해 보편 튜링 기계(UTM)의 역할을 프로그래밍 언어 인터프리터 수준에서 함수론적으로 재구성한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
<!-- knowledge:relations:end -->
