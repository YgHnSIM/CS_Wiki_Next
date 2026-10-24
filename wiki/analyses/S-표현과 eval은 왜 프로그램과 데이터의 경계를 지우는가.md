---
schema_version: 3
id: analysis-mccarthy-eval-symbolic-computation
key: analysis:mccarthy-eval-symbolic-computation
kind: analysis
title: S-표현과 eval은 왜 프로그램과 데이터의 경계를 지우는가
aliases:
  - eval은 왜 프로그램과 데이터의 경계를 지우는가
  - S-표현과 eval은 어떻게 프로그램과 데이터의 경계를 지웠는가
  - McCarthy eval
  - Lisp eval analysis
  - 호모아이코니시티와 메타순환 평가기
summary: 존 매카시의 1960년 LISP 논문을 바탕으로, 상식 추론(Advice Taker)과 함수 계산을 위해 고안된 S-표현(호모아이코니시티)과 보편 함수 apply/eval이 어떻게 추상 구문과 런타임 데이터의 경계를 허물고, 가비지 컬렉션·푸시다운 스택 재귀 컴파일러·해석 경계의 보안 문제까지 필연적으로 낳았는지 분석한다.
domains:
  - programming-languages
  - computer-science
  - computer-history
  - computer-architecture
  - software-engineering
publication_visibility: public
graph_visibility: public
status: current
page_role: knowledge
created: 2026-10-25
updated: 2026-10-25
evidence_ids:
  - ref-155
  - ref-009
  - ref-010
  - ref-006
  - ref-016
  - src-004
  - ref-011
  - ref-090
capability_layers:
  - computability
  - programmability
  - realized-performance
  - reliable-results
history:
  layer: software
relations:
  - predicate: implements
    target: concept:symbolic-manipulation
    note: S-표현(원자 기호와 순서쌍 DAG)과 5대 원시 함수(atom, eq, car, cdr, cons)를 통해 기호 조작을 O(1) 포인터 역참조 기반의 튜링 완전한 실행 모델로 구체화한다.
    evidence:
      - source: ref-155
        locator: "§3 Recursive Functions of Symbolic Expressions & §5 Another Formalism"
  - predicate: enables
    target: concept:programmability
    note: M-표현 함수 정의를 S-표현 리스트로 일대일 번역하는 호모아이코니시티와 apply/eval 및 고계 함수(maplist, diff)를 통해 언어가 자기 자신을 합성·변형·실행하는 메타프로그래밍 가능성을 연다.
    evidence:
      - source: ref-155
        locator: "§3e–§3g & §4f Status of the LISP Programming System"
  - predicate: synthesizes
    target: concept:computability
    note: 부분 함수, 비엄격 조건식, label 재귀, 보편 S-함수 apply, 플로우차트-재귀 환원 정리를 통해 처치의 람다 대수와 튜링의 보편 기계를 하나의 함수적 계산 이론 체계로 통합한다.
    evidence:
      - source: ref-155
        locator: "§1, §2, §3f, §6 Flowcharts and Recursion"
      - source: ref-009
      - source: ref-010
  - predicate: synthesizes
    target: concept:page-676372e6
    note: 튜링의 1차원 테이프 상태표 부호화를 구조화된 S-표현 추상 구문과 반 페이지 분량의 메타순환 인터프리터 apply/eval로 재구성한다.
    evidence:
      - source: ref-155
        locator: "§1 Introduction & §3f The Universal S-Function apply"
      - source: ref-009
  - predicate: synthesizes
    target: concept:compiler
    note: 인터프리터(APPLY)의 유연성과 푸시다운 스택(SAVE/UNSAVE) 기반 기계어 컴파일러의 60배 실행 속도 및 자동 메모리 회수(Mark & Sweep GC)가 하나의 시스템 안에서 분업하는 런타임 구조를 규명한다.
    evidence:
      - source: ref-155
        locator: "§4c Free-Storage List, §4e Representation of S-Functions by Programs, §4f"
      - source: ref-016
---

## 핵심 주장

[[S-표현과 eval은 왜 프로그램과 데이터의 경계를 지우는가]]는 존 매카시(John McCarthy)의 1960년 논문 [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]](`ref-155`)이 왜 프로그램 코드와 데이터를 동일한 기호 리스트(S-expression)로 통합해야 했으며, 그 통합이 어떻게 계산 이론·프로그래밍 언어·하드웨어 런타임·보안 경계 전반의 지형을 바꾸었는지 추적하는 분석이다.

흔히 "프로그램과 데이터를 같게 다룬다"는 발상을 1936년 [[앨런 튜링]]의 [[보편 튜링 기계]](`ref-009`)나 1945년 폰 노이만의 [[저장 프로그램 컴퓨터]](`ref-006`)와 동일시하곤 한다. 그러나 세 체계가 경계를 허문 층위는 근본적으로 다르다:
1. **튜링의 보편 기계(1936)**는 다른 기계의 전이 규칙표를 1차원 테이프 위의 '표준 기술 번호(문자열)'로 부호화해 **계산 가능성의 원리적 보편성**을 증명했으나, 사람이 읽고 조합할 수 있는 고수준 추상 구문을 제공하지는 않았다.
2. **폰 노이만의 저장 프로그램(1945)과 Fortran(1957, `ref-016`)**은 기계어 명령과 수치 데이터를 같은 물리 메모리에 적재했으나, 고급 언어 차원에서는 **컴파일러가 기계어로 번역하고 버리는 정적 텍스트(프로그램)**와 **실행 중 읽고 쓰는 부동소수점 수치(데이터)**가 철저히 분리되어 있었다.
3. **매카시의 LISP(1960)**는 상식 추론 시스템 **Advice Taker**(1958)에서 기계가 선언적·명령적 문장을 연역하고, 수식을 기호 미분(`diff`)하며, 새로운 함수 절차를 합성해 실행해야 한다는 요구에서 출발했다. 프로그램이 다른 프로그램의 내부 구조를 분석·변형·생성하려면, **프로그램의 추상 구문 트리(AST) 자체가 언어가 기본으로 조작하는 일급 데이터 구조와 정확히 일치(호모아이코니시티, Homoiconicity)**해야만 했다.

이 분석은 매카시가 이 요구를 해결하기 위해 세운 다섯 가지 인과적 기둥을 규명한다:
- 첫째, 계산의 비종료성을 포용하는 **부분 함수(partial functions)**, 무한 재귀를 차단하는 **비엄격 조건식 $(p_1 \rightarrow e_1, \dots)$**, 그리고 [[알론조 처치]]의 $\lambda$-표기에 빠진 자기참조 고리를 닫는 **`label` 연산자**로 재귀 함수론을 재정립했다(§2).
- 둘째, 원자 기호와 순서쌍 `(e1 · e2)`로 이루어진 **S-표현**과 5대 원시 함수(`atom`, `eq`, `car`, `cdr`, `cons`) 위에 메타 언어(M-표현)의 함수 정의를 일대일로 사상하는 번역 규칙 $\mathcal{E} \mapsto \mathcal{E}^*$를 세워 구문과 데이터의 동형성을 완성했다(§3a–3e).
- 셋째, 번역된 함수 S-표현을 입력받아 값을 계산하는 **보편 S-함수 `apply`와 `eval[e; a]`**를 자기 자신의 원시 연산자만으로 정의함으로써, 보편 튜링 기계를 반 페이지짜리 **메타순환 인터프리터(metacircular interpreter)**로 압축하고 환경 리스트 $a$로 속박 변수 충돌을 해결했다(§3f).
- 넷째, 프로그램이 실행 중 예측 불가능한 크기의 기호 트리를 끊임없이 생성·폐기하는 대가로 발생한 물리적 병목을 해결하기 위해, [[IBM 704]]의 36비트 워드 위에서 인류 최초의 **Mark & Sweep 가비지 컬렉션(`reclamation cycle`)**과 인터프리터 대비 **60배 고속화**를 달성한 **공용 푸시다운 리스트(`public push-down list`, [[스택]]) 기반 재귀 컴파일러**를 발명했다(§4).
- 다섯째, 명령형 플로우차트($\xi' = f(\xi)$)와 상호 재귀 함수의 수학적 동치성(§6)을 증명하는 한편, 코드와 데이터의 경계를 허문 유연성이 현대 컴퓨팅에서 동적 스코핑 결함(Funarg 문제), 정적 분석의 한계, 그리고 **신뢰할 수 없는 데이터가 코드로 실행되는 보안 경계 파괴**([[입력을 해석하는 경계는 왜 보안 경계인가]])라는 구조적 대가를 남겼음을 밝힌다.

---

## 1. 세 가지 보편성의 비교: 테이프 부호화, 저장 프로그램, 구문-데이터 동형성

프로그램을 데이터처럼 다룬다는 생각이 역사적으로 어떻게 진화했는지 비교하면 매카시의 1960년 논문이 차지하는 고유한 위치가 선명하게 드러난다.

| 비교 축 | 보편 튜링 기계 (Turing 1936, `ref-009`) | 저장 프로그램 컴퓨터 (EDVAC 1945, `ref-006`) | FORTRAN 자동 코딩 (Backus 1957, `ref-016`) | LISP S-표현과 `apply`/`eval` (McCarthy 1960, `ref-155`) |
|---|---|---|---|---|
| **프로그램의 표현** | 1차원 테이프 위의 상태 전이표 기술 문자열 ($D.N.$) | 선형 메모리 번지에 저장된 이진 기계어 워드 | 수학식 형태의 포트란 [[소스 프로그램]] 텍스트 | 중첩된 순서쌍 리스트로 번역된 **S-표현($\mathcal{E}^*$)** |
| **데이터의 표현** | 1차원 테이프 위의 `0`/`1` 기호열 | 선형 메모리 번지에 저장된 이진 수치 워드 | 고정 크기 배열과 부동소수점 수치 | 원자 기호와 순서쌍으로 구성된 **S-표현** |
| **코드와 데이터의 관계** | 동일한 테이프 위에 기호열로 공존 (구문 계층 없음) | 물리 메모리 워드 수준에서만 동형 (기계어 자기 수정) | 컴파일 시점 이후 완전히 분리 (런타임에 소스 구조 소멸) | **추상 구문 구조와 런타임 자료구조가 1:1 동형 (호모아이코니시티)** |
| **보편 실행 메커니즘** | 테이프를 왕복하며 현재 상태와 기호를 대조하는 추상 헤드 | 프로그램 카운터(PC)와 명령 해독기 하드웨어 사이클 | 사전 번역기([[컴파일러]])가 생성한 IBM 704 [[목적 프로그램]] | 5대 원시 함수와 `COND`로 정의된 **보편 함수 `apply`/`eval`** (및 60배속 컴파일러) |
| **런타임 코드 합성·변형** | 이론적으로만 가능 (인간이 직접 조작하기 불가능) | `Initial Orders`·[[Wheeler Jump]] 등 저수준 주소 패치에 국한 | 불가능 (수식 결과를 다시 코드로 실행할 수단 없음) | `cons`/`car`/`cdr`/`subst`로 **함수 S-표현을 직접 조립·미분·평가 가능** |

왜 매카시에게는 포트란 방식의 '소스 텍스트 $\rightarrow$ 기계어 일방통행 번역'이 불충분했는가? §1(PDF p. 1)과 §4(PDF p. 22)가 밝히듯, 매카시의 목표는 **Advice Taker**와 형식 논리 증명기, 그리고 기호 미분·적분 시스템이었다.

예를 들어 §3g(PDF p. 21)의 기호 편미분 함수 `diff[y; x]`를 보자. 수치 계산 프로그램(Fortran)에서 미분은 특정 수치 $x = 2.0$에서 미분계수의 근삿값을 구하는 일이다. 그러나 기호 계산에서 대수식 $X(X + A)Y$를 미분한다는 것은, 입력 수식 `(TIMES, X, (PLUS, X, A), Y)`라는 **프로그램/수식 트리 자체를 분해(`car`, `cdr`)하여 도함수 수식 트리 `(PLUS, (TIMES, ONE, ...), ...)`를 새로 조립(`cons`, `maplist`)해 내는 작업**이다. 생성된 도함수 식은 그 자체로 출력 데이터이면서, 동시에 특정 값을 대입해 `eval`로 즉시 실행하거나 컴파일러로 기계어화할 수 있는 **살아있는 프로그램**이어야 했다. 바로 이 지점에서 "프로그램 구문 = 데이터 구조"라는 호모아이코니시티의 필연성이 탄생했다.

---

## 2. 수학적 전제: 부분 함수, 비엄격 조건식, 그리고 `label`

매카시는 기호식을 기계에 올리기 전에, 기존 수학 표기법이 "계산 절차로서의 함수"를 기술하는 데 왜 실패하는지를 §2(PDF pp. 2–8)에서 세 가지로 비판하고 교정한다.

### a. 부분성(Partiality)의 수용: 계산은 멈추지 않거나 정의되지 않을 수 있다 (§2a, §3c)

고전 수학은 흔히 정의역의 모든 원소에 값이 정의된 전 함수(total function)를 기본으로 가정한다. 그러나 계산 절차로 정의되는 함수는 특정 입력에서 계산이 영원히 종료하지 않을 수 있으므로([[정지 문제]]), 계산 이론은 반드시 **부분 함수(partial functions)**를 기초에 두어야 한다(§2a, PDF p. 2).

나아가 매카시는 LISP의 5대 원시 연산자 중 세 개를 의도적인 부분 함수로 설계했다(§3c, PDF pp. 10–11):
- `car[x]`와 `cdr[x]`는 $x$가 순서쌍 `(e1 · e2)`일 때만 정의되며, 원자 기호 `X`에 대해서는 `car[X]`와 `cdr[X]`가 **미정의(undefined)**다.
- `eq[x; y]`는 **$x$와 $y$가 둘 다 원자 기호일 때만 정의된다**. 따라서 `eq[X; (X · A)]`는 거짓($F$)이 아니라 **미정의**다.

왜 `eq`를 원자 기호에만 제한했는가? §4d(PDF p. 28)의 하드웨어 구현을 보면 그 이유가 드러난다. 각 원자 기호는 메모리 안에 유일한 속성 리스트(association list) 주소를 갖기 때문에, 원자끼리의 `eq`는 **단일 워드 주소의 수치 비교 명령 한 번($O(1)$)**으로 끝난다. 반면 임의의 두 트리 구조 `((A · B) · C)`가 같은지 비교하려면 두 트리가 같은 메모리를 공유하지 않는 한(Fig. 3a vs 3b) 하위 노드를 끝까지 내려가며 비교해야 한다. 매카시는 $O(1)$ 하드웨어 포인터 비교인 원시 부분 함수 **`eq`**와, 이를 재귀적으로 합성해 만든 일반 구조적 상등 함수 **`equal[x; y]`**(§3d, PDF p. 13)를 명확히 분리함으로써 계산 비용과 의미론적 경계를 동시에 지켰다.

### b. 비엄격 조건식 $(p_1 \rightarrow e_1, \dots, p_n \rightarrow e_n)$과 비가환 논리 (§2c–2d)

재귀 함수가 순환 논리나 무한 루프에 빠지지 않으려면, **선택되지 않은 분기의 식을 절대 미리 평가하지 않는 비엄격(non-strict) 제어 장치**가 필수적이다. 매카시가 도입한 조건식

$$(p_1 \rightarrow e_1, \cdots, p_n \rightarrow e_n)$$

은 왼쪽부터 $p_i$를 차례로 평가해 **미정의 $p$를 만나기 전에 최초로 $T$가 되는 $p_i$의 결과식 $e_i$만 평가**한다(PDF pp. 3–4). 이 규칙이 없다면 팩토리얼 정의

$$n! = (n = 0 \rightarrow 1, T \rightarrow n \cdot (n - 1)!)$$

에서 $0!$을 계산할 때 우변의 두 번째 항 $0 \cdot (0 - 1)!$까지 평가하려다 $(-1)! \rightarrow (-2)! \rightarrow \cdots$의 무한 재귀에 빠지게 된다.

매카시는 이 조건식으로 명제 결합사 $p \wedge q = (p \rightarrow q, T \rightarrow F)$와 $p \vee q = (p \rightarrow T, T \rightarrow q)$를 정의하면서, 부분 함수(비종료 계산)가 존재하는 세계에서는 **논리곱($\wedge$)과 논리합($\vee$)이 교환법칙을 만족하지 않는다(noncommutative)**는 사실을 증명한다(PDF p. 6). $p$가 $F$이고 $q$가 무한 루프(미정의)일 때:
- $p \wedge q = (F \rightarrow q, T \rightarrow F) = F$ (종료하여 거짓 반환)
- $q \wedge p = (\text{undefined} \rightarrow p, T \rightarrow F) = \text{undefined}$ (비종료)

이는 현대 프로그래밍 언어의 단락 평가(`&&`, `||`)와 `if ... then ... else`(매카시의 조건식 제안에 자극받아 [[존 배커스]]가 Algol 60에 도입한 구문, 각주 2)의 엄밀한 수학적 원형이다.

### c. 형식(Form)과 함수(Function)의 분리, 그리고 `label` (§2e–2f)

매카시는 [[알론조 처치]]의 $\lambda$-표기(`ref-010`, Church 1941)를 도입해 자유 변수가 흩어진 열린 **형식(form)** $y^2 + x$와 매개변수 대응 순서가 고정된 닫힌 **함수(function)** $\lambda((x, y), y^2 + x)$를 구별한다(PDF p. 6). 함수를 다른 함수의 인자로 넘기거나(`maplist`) 데이터로 조작하려면 함수 자체가 모호함 없는 독립된 개체여야 하기 때문이다.

그러나 처치의 $\lambda$-표기만으로는 재귀 함수를 닫힌 식 하나로 적을 수 없었다(N. Rochester가 지적, §2f p. 7 & §7 p. 33). 순수 람다 대수에서는 이를 고정점 조합자(Y combinator, $\lambda f. (\lambda x. f(x\,x))(\lambda x. f(x\,x))$)로 우회하지만, 매카시는 조합자 표기가 "지나치게 길고 읽기 어렵다(lengthy and unreadable)"며 기각하고, 식 전체에 재귀적 자기참조 이름을 직접 속박하는 **`label(a, E)`** 연산자를 창안했다:

$$\text{label}(\text{ff}, \lambda((x), (\text{atom}(x) \rightarrow x, T \rightarrow \text{ff}(\text{car}(x)))))$$

이로써 외부 전역 정의 테이블에 의존하지 않고도 **완전히 자족적인(self-contained) 재귀 함수 값**을 하나의 식(그리고 하나의 S-표현 리스트)으로 표현하고 전달할 수 있는 문법적 고리가 완성되었다.

---

## 3. 호모아이코니시티(Homoiconicity): M-표현 번역과 Linear LISP 대비

### a. 구문 트리와 리스트 데이터의 완전한 포개짐 (§3a–3e)

§3b–3d에서 매카시는 인간 독자의 가독성을 위해 소문자와 대괄호를 쓰는 **M-표현**(`car[cons[x; y]]`)으로 함수를 작성하게 한 뒤, §3e(PDF pp. 15–16)에서 임의의 M-표현 $\mathcal{E}$를 대문자 원자 기호와 순서쌍 리스트로만 이루어진 **S-표현 $\mathcal{E}^*$**로 변환하는 6가지 번역 규칙을 제시한다:

1. 상수 S-표현 $\mathcal{E} \implies (\text{QUOTE}, \mathcal{E})$
2. 소문자 식별자 $\implies$ 대문자 원자 기호 (`subst` $\implies$ `SUBST`)
3. 함수 적용 $f[e_1; \cdots; e_n] \implies (f^*, e_1^*, \cdots, e_n^*)$
4. 조건식 $[p_1 \rightarrow e_1; \cdots; p_n \rightarrow e_n] \implies (\text{COND}, (p_1^*, e_1^*), \cdots, (p_n^*, e_n^*))$
5. 람다 추상화 $\lambda[[x_1; \cdots; x_n]; \mathcal{E}] \implies (\text{LAMBDA}, (x_1^*, \cdots, x_n^*), \mathcal{E}^*)$
6. 재귀 명명 $\text{label}[a; \mathcal{E}] \implies (\text{LABEL}, a^*, \mathcal{E}^*)$

이 번역이 갖는 본질적 의미는 무엇인가? 일반적인 컴파일러에서 소스 코드는 문자열로 들어와 파서(parser)에 의해 내부적인 추상 구문 트리(AST)로 바뀐 뒤 코드 생성기를 거쳐 기계어로 사라진다. 프로그래머는 언어 안에서 그 AST를 직접 만질 수 없다.

반면 LISP에서는 **번역된 코드 $\mathcal{E}^*$가 곧 파싱이 완료된 추상 구문 트리(AST) 그 자체이며, 동시에 언어의 기본 데이터 타입인 연결 리스트**다. 예를 들어 람다식 `(LAMBDA, (X, Y), (CONS, (CAR, X), Y))`에서:
- `car[e]`는 연산자 기호 `LAMBDA`이고,
- `cadar` / `cadr[e]`는 매개변수 리스트 `(X, Y)`이며,
- `caddr[e]`는 함수 본문 트리 `(CONS, (CAR, X), Y)`다.

즉 별도의 파서나 리플렉션 API 없이도, 일반 데이터를 다루는 **`car`, `cdr`, `cons`만으로 프로그램의 매개변수 목록을 추출하고, 함수 본문을 부분식 단위로 해체하거나 새 코드를 조립**할 수 있다.

### b. 왜 문자열(Linear LISP)이 아니라 S-표현(포인터 트리)인가? (§5의 통찰)

코드와 데이터를 같은 형식으로 맞춘다면, 왜 굳이 괄호와 점으로 가득 찬 S-표현이어야 했을까? 그냥 일반 텍스트 문자열로 코드와 데이터를 모두 표현하면 되지 않는가?

매카시는 이 질문에 답하기 위해 **§5 Another Formalism for Functions of Symbolic Expressions**(PDF pp. 30–31)에서 문자열 기반의 대안 체계인 **Linear LISP(L-expressions)**를 직접 설계해 비교한다. Linear LISP는 첫 글자를 떼는 `first[x]`, 나머지를 구하는 `rest[x]`, 문자를 앞에 붙이는 `combine[x; y]`와 세 술어(`char`, `null`, `=`)만으로 정의된다.
- **Linear LISP의 수학적 장점**: `(`, `)`, `·`, `,` 같은 특수 예약 문자가 없으므로 선형으로 적힌 어떤 기호열이든 제약 없이 다룰 수 있고, 수학적 표현력에서도 LISP를 포함한다.
- **Linear LISP의 치명적 공학적 약점**: 선형 문자열에서 중첩된 하위 부분식(subexpression) 하나를 꺼내려면, 매번 문자열 처음부터 괄호 깊이를 세며 끝까지 스캔하는 복잡한 파싱 연산($O(N)$)을 수행해야 한다. 반면 S-표현은 중첩 구조 자체가 메모리 워드의 `address`(`car`)와 `decrement`(`cdr`) 포인터로 직결되어 있어, **아무리 거대한 하위 부분식이라도 포인터 역참조 명령 한 번(`CLA 0, i`, $O(1)$)으로 즉시 추출하고 복사 없이 공유(`cons`)**할 수 있다(PDF p. 28, p. 31).

즉 S-표현은 단순한 표기법의 취향이 아니라, **"구문 트리의 구조적 분해와 합성을 $O(1)$ 기계어 포인터 연산으로 일치시키기 위한 아키텍처적 선택"**이었다.

---

## 4. 보편 S-함수 `apply`와 `eval`: 반 페이지로 압축된 보편 기계와 원전의 균열

### a. `apply`와 `eval[e; a]`의 작동 메커니즘 (§3f)

코드가 S-표현 데이터가 되자, "프로그램 $f$에 인자 목록 $\text{args}$를 넣어 실행한다"는 행위 자체가 또 하나의 S-함수 **`apply[f; args]`**로 정의된다(§3f, PDF pp. 16–18):

$$\text{apply}[f; \text{args}] = \text{eval}[\text{cons}[f; \text{appq}[\text{args}]]; \text{NIL}]$$

1. **`appq`의 역할 (값과 코드의 경계 표지)**: $\text{args} = ((A, B), (C, D))$는 이미 계산이 끝난 데이터 인자다. 만약 이를 그대로 함수 $f$ 뒤에 붙여 `(f, (A, B), (C, D))`를 `eval`에 넘기면, `eval`은 데이터 `(A, B)`를 함수 `A`에 인자 `B`를 적용하라는 **코드 호출로 오인**해 버린다. 따라서 `appq`는 각 인자를 `(QUOTE, (A, B))`처럼 인용 구조로 감싼다. **`QUOTE`야말로 코드와 데이터가 완전히 같은 형식을 공유하는 세계에서 "여기서부터는 평가하지 말고 데이터 그대로 취급하라"고 지시하는 유일한 방화벽**이다.
2. **`eval[e; a]`의 4단 분기 구조**:
   - $e$가 원자 기호(`atom[e]`)이면 환경 리스트 $a$에서 `assoc[e; a]`로 변수 바인딩 값을 찾는다.
   - `car[e]`가 원자 기호이면:
     - `QUOTE`는 평가 없이 `cadr[e]`를 그대로 반환한다.
     - `COND`는 `evcon[cdr[e]; a]`를 호출해 참이 되는 첫 조건절의 결과식만 선택 평가한다(비엄격성 보존).
     - `ATOM`, `EQ`, `CAR`, `CDR`, `CONS`는 먼저 인자 식들을 `eval`로 재귀 평가한 뒤, 5대 원시 연산을 실제 수행한다.
     - 그 밖의 원자 기호 $f$는 환경 $a$에서 `assoc[car[e]; a]`로 함수 정의를 찾아 치환한 뒤 재귀 평가한다.
   - `caar[e]`가 `LABEL`이면 자기 자신의 이름과 전체 함수 정의 쌍 `(f, (LABEL, f, E))`를 환경 $a$ 맨 앞에 추가(`cons`)하고 본문 람다식을 평가한다.
   - `caar[e]`가 `LAMBDA`이면 `evlis`로 평가한 인자 값들과 매개변수 이름들을 `pair`로 묶어 환경 $a$ 앞에 `append`한 뒤 함수 본문 `caddar[e]`를 평가한다.

### b. 환경 리스트 $a$와 속박 변수 충돌 회피

처치의 람다 대수(§2e)에서는 $(\lambda x. \mathcal{E})\, M$을 계산할 때 본문 $\mathcal{E}$ 안의 변수 $x$ 자리에 식 $M$을 직접 텍스트로 밀어 넣는 **치환(substitution)** 방식을 쓴다. 그러나 식 안에 중첩된 다른 $\lambda$가 같은 변수 이름을 쓰고 있으면 자유 변수가 엉뚱한 $\lambda$에 포획되는 **속박 변수 충돌(collision of bound variables)**이 일어난다.

매카시는 본문 코드 $\mathcal{E}$를 전혀 수정하지 않고 그대로 둔 채, **변수 이름과 값의 대응 쌍들을 담은 환경 리스트(association list) $a$를 `eval[e; a]`의 두 번째 인자로 들고 다니며 조회(`assoc`)하는 지연 치환 모델**을 발명했다(PDF p. 18). 새 `LAMBDA`나 `LABEL`에 진입할 때마다 새 바인딩 쌍들을 기존 리스트 $a$의 맨 앞에 덧붙이고(`append`/`cons`), `assoc`는 리스트의 맨 앞부터 탐색하므로 안쪽 변수가 바깥쪽 동명 변수를 자연스럽게 가린다(shadowing).

### c. 원전 비판적 독해: 1960년 `eval` 수식의 세 가지 균열과 Funarg 문제

로컬 원본 PDF(`raw/McCarthy-60.pdf`, pp. 17–21)를 한 줄씩 대조해 읽으면, 컴퓨터 과학사상 가장 유명한 이 1쪽짜리 `eval` 정의 안에 **논문 인쇄본의 내부 불일치**와 **스코핑 설계의 역사적 결함**이 함께 각인되어 있음을 확인할 수 있다(매카시 자신의 1995년 각주 5: *"This version isn't quite right"*).

| 균열 지점 | PDF p. 17 수식의 정의 | PDF pp. 18–20 본문 해설 및 수작업 추적(`FF`) | 발생하는 현상 및 역사적 귀결 |
|---|---|---|---|
| **1. 원자 변수 조회 시 재평가 여부** | `atom[e] → assoc[e; a]` (`assoc`가 반환한 값을 그대로 결과로 삼음) | p. 18 항목 3: *"eval **evaluates** whatever is paired with it first on the list a"* / p. 19: `atom[eval[assoc[X; a]; a]]` | p. 19의 수작업 추적에서는 `apply`가 씌운 `(QUOTE, (A·B))`가 환경 $a$에 그대로 들어갔다고 보고, 변수 `X`를 조회할 때 `assoc` 결과에 다시 `eval`을 걸어 `QUOTE`를 벗겨낸다. |
| **2. `T` 분기(함수 기호 호출)와 `evlis`의 이중 평가** | `T → eval[cons[assoc[car[e]; a]; evlis[cdr[e]; a]]; a]` (인자를 `evlis`로 평가한 뒤 `assoc`로 찾은 함수 정의와 결합해 다시 `eval`) | p. 20: `evlis[((CAR, X)); a]`의 결과를 평가된 값 `(A)`가 아니라 **`((QUOTE, A))`로 인용 부호를 감싸서** 기술함 | p. 17 수식대로라면 `T` 분기에서 `evlis`가 인자를 한 번 평가해 `A`로 만든 뒤, 바깥 `eval`이 `((LAMBDA, ...), A)`를 평가할 때 `LAMBDA`의 `evlis`가 데이터 `A`를 변수로 오인해 **두 번 평가(double evaluation)**하는 버그가 발생한다. |
| **3. 동적 스코핑과 고계 함수(Funarg) 충돌** | `LAMBDA` 평가 시 호출 시점의 환경 $a$ 앞에 `pair[cadar[e]; evlis[cdr[e]; a]]`를 단순 `append` | §3g(p. 21)에서 `maplist[x; f]`와 `diff[y; x]`처럼 $\lambda$ 식을 다른 함수의 인자로 전달 | `maplist` 내부의 매개변수 이름(`x`, `f`)과 인자로 넘어간 $\lambda$ 식 내부의 자유 변수 이름이 같으면, 함수 정의 시점의 환경이 아니라 **`maplist` 실행 시점의 환경 $a$가 자유 변수를 가로채는 동적 스코핑(dynamic scoping) 결함**이 발생한다. |

이 세 번째 균열은 프로그래밍 언어사에서 결정적인 분기점이 되었다. §3g의 기호 미분 함수 `diff[y; x]`는 바깥 변수 `x`(미분 변수)와 `y`를 자유 변수로 참조하는 두 개의 중첩 $\lambda[[z]; \dots]$와 $\lambda[[w]; \dots]$를 `maplist`에 인자로 넘긴다. 만약 `maplist`의 형식 매개변수 이름이 우연히 `y`였다면, 동적 환경 리스트 $a$에서 미분 대상 수식 `y`가 `maplist`의 리스트 인자로 덮어써져 버린다! 이 **Funarg 문제(Functional Argument problem)**를 해결하기 위해 훗날 `FUNCTION`/`QUOTE` 구분과 어휘적 클로저(lexical closure — 함수 코드와 정의 시점의 환경 포인터를 함께 묶는 구조, 후대 Scheme과 현대 함수형 언어의 표준)가 탄생하게 된다.

---

## 5. 물리적 육화의 대가: 가비지 컬렉션과 푸시다운 스택 컴파일러

수학적 수준에서 프로그램과 데이터의 경계를 지운 순간, 그 부담은 고스란히 [[IBM 704]]라는 물리적 기계의 메모리와 실행 속도로 전가되었다. §4(PDF pp. 22–30)는 이 추상 모델을 실제 컴퓨터 위에서 작동시키기 위해 매카시 팀이 발명해야 했던 시스템 공학적 돌파구들을 보여준다.

### a. 36비트 워드의 포인터 분할과 불변 DAG 공유 (§4a–4b)

IBM 704의 36비트 워드 하나는 15비트 `address` 필드와 15비트 `decrement` 필드(나머지 6비트는 부호 비트와 3비트 prefix/tag)를 가졌다. 매카시는 순서쌍 `(e1 · e2)`를 표현하기 위해 왼쪽 `address` 필드에 `car` 포인터를, 오른쪽 `decrement` 필드에 `cdr` 포인터를 매핑했다(§4a, Fig. 1–2, PDF pp. 22–24). 덕분에 `car`와 `cdr`는 단일 기계어 명령(`CLA 0, i`, §4d p. 28)으로 실행되었다.

나아가 S-표현 연산이 기존 워드를 덮어쓰지 않고 `cons`로 새 워드를 조립하는 순수 함수적 방식을 취했기 때문에, 동일한 부분식 `(A · B)`를 여러 상위 식이 동시에 가리키는 **방향성 비순환 그래프(DAG) 구조 공유**(Fig. 1b, Fig. 3b)가 프로그램의 외부 결과에 아무런 부작용 없이 허용되었다(PDF p. 24). 반면 자기 자신을 부분식으로 갖는 순환 리스트(Fig. 1c)는 인쇄 및 재귀 순회의 정지성을 보장하기 위해 금지되었다.

### b. 제어 흐름과 저장 수명의 탈동기화: 최초의 가비지 컬렉션 (§4c)

[[하드웨어 실행 모델은 어떻게 제어와 상태를 엮는가]]에서 분석하듯, 일반 프로시저 호출에서는 지역 변수의 수명이 함수의 진입·복귀 제어 흐름과 일치하므로 [[스택]]만으로 메모리를 관리할 수 있다. 그러나 LISP에서는 함수가 실행 도중 `cons`를 호출해 임의 크기의 새로운 S-표현(데이터이자 코드)을 합성하고 이를 반환값으로 밖으로 내보낸다. 즉 **데이터의 수명이 함수를 호출한 제어 흐름으로부터 완전히 탈동기화(독립)**된 것이다.

크기와 개수를 예측할 수 없는 리스트 조각들이 끊임없이 생성되고 버려지는 환경에서 프로그래머가 수동으로 레지스터를 해제하는 것은 불가능에 가까웠다. 매카시는 초기 약 **15,000개 레지스터**로 이루어진 **`free-storage list`**가 바닥나는 순간 자동으로 발동하는 **2단계 재활용 주기(reclamation cycle — Mark & Sweep 가비지 컬렉션)**를 도입해 이 문제를 해결했다(§4c, PDF pp. 26–27):
1. **Mark 단계 (부호 비트 반전)**: 프로그램이 현재 접근 가능한 루트 포인터들을 담은 **베이스 레지스터(base registers)**에서 출발해 `car`–`cdr` 사슬로 도달 가능한 모든 워드를 추적하며 **36비트 워드의 부호(sign)를 음수(negative)로 바꾼다**. 이미 음수인 워드를 만나면 탐색을 멈추므로 DAG 공유 노드를 중복 탐색하지 않는다.
2. **Sweep 단계 (선형 주사 및 복원)**: 리스트 메모리 영역 전체를 순회하며 부호가 여전히 양수인(도달 불가능한) 고립 워드들을 모두 `free-storage list`로 회수하고, 음수로 표시되었던 활성 워드들의 부호를 다시 양수로 되돌린다.

매카시는 여기서 가비지 컬렉션의 근본적인 성능 법칙까지 최초로 규명했다(PDF p. 27): 1회 회수 주기에 **수 초(several seconds)**가 소요되므로, 한 번 돌 때 최소 수천 개의 레지스터가 회수되어야만 시스템이 회수에 대부분의 시간을 빼앗기지 않는다(스래싱 방지). 즉 **자동 메모리 관리의 시간 효율은 전체 메모리 대비 여유 공간(headroom)의 비율에 의존한다**는 현대 GC 이론의 출발점이 이미 1960년 논문에 명시되어 있다.

### c. 인터프리터(APPLY)와 60배속 푸시다운 스택 재귀 컴파일러의 공존 (§4e–4f)

스티븐 러셀(S. Russell)이 §3f의 `apply`를 IBM 704 기계어로 직접 번역해 구현한 **`APPLY` 인터프리터**(§4f p. 29)는 S-표현으로 주어진 어떤 함수든 즉시 해석해 실행할 수 있었다. 그러나 매 단계 환경 리스트 $a$를 탐색하고 S-표현 트리를 따라가는 해석 방식은 기계어 직접 실행에 비해 막대한 오버헤드를 치렀다.

LISP 시스템은 해석기와 **컴파일러**를 한 시스템 안에 공존시킴으로써 이 딜레마를 돌파했다:
- **공용 푸시다운 리스트(`public push-down list`)와 `SAVE`/`UNSAVE` (§4e, PDF p. 29)**: [[IBM 704]]에는 하드웨어 콜 스택이 없었고, 당대 [[Fortran]] 컴파일러는 서브루틴마다 고정된 메모리 칸에 복귀 주소와 임시 값을 저장했기 때문에 **재귀 호출이 원천적으로 불가능**했다. 매카시 팀은 `subst[x; y; z]`처럼 자기 자신을 두 번 재귀 호출하는 함수를 컴파일할 때 먼저 계산한 `subst[x; y; car[z]]`의 임시 레지스터 값이 두 번째 재귀 호출 `subst[x; y; cdr[z]]`에 의해 덮어써지는 충돌을 해결하기 위해, 메모리에 **`public push-down list`**(각주 8: *now called a stack*) 블록과 인덱스 포인터를 예약하고 함수 진입 시 **`SAVE`**, 탈출 시 **`UNSAVE`** 루틴을 호출하게 했다. 이로써 재귀 서브루틴은 임시 레지스터에 대해 완전히 투명(transparent)해졌다.
- **60배의 속도 향상 (§4f 항목 5, PDF p. 30)**: 사용자가 선택한 S-함수들을 컴파일러로 번역해 코어 메모리에 올리면, **인터프리터로 실행할 때보다 약 60배 빠르게(about 60 times as fast)** 실행되었다. 또한 컴파일 속도 자체가 매우 빨라 목적 코드 카드를 천공해 보관할 필요조차 없이 메모리에서 즉시 컴파일해 실행(현대 JIT 컴파일 워크플로의 선구)할 수 있었다.

### d. 명령형 플로우차트와 재귀 함수의 수학적 동치성 (§6)

마지막으로 §6(PDF pp. 31–33)에서 매카시는 "재귀 함수가 컴퓨터 프로그램(플로우차트)으로 컴파일될 수 있다면, 반대로 임의의 명령형 플로우차트도 재귀 함수로 번역될 수 있는가?"라는 질문을 던지고 이를 긍정적으로 증명한다.

기계의 모든 변수 상태를 묶은 상태 벡터를 $\xi$, 각 기본 블록의 상태 변환을 $\xi' = f(\xi)$라 하면, 아무리 복잡한 루프와 조건 분기($\pi$)가 얽힌 플로우차트라도 각 분기점 $\beta$에서 출구까지의 변환을 나타내는 **상호 재귀 함수 체계**

$$\phi[\xi] = [p_1[\xi] \rightarrow \phi_1[f_1[\xi]]; \cdots; p_n[\xi] \rightarrow \phi_n[f_n[\xi]]]$$

로 일대일 환원된다(Fig. 5, 6). 이는 훗날 [[구조적 프로그래밍]](`ref-011`, `ref-013`)과 컴파일러의 **SSA(Static Single Assignment) 형식 및 CPS(Continuation-Passing Style) 중간 표현**에서 기본 블록(basic block)과 $\phi$-노드를 상태 인자를 받는 상호 꼬리 재귀 함수로 다루는 이론의 정확한 수학적 원형이다.

---

## 6. 현대적 함의: 메타프로그래밍의 원천이자 해석 경계의 보안 취약점

`S-표현`과 `eval`이 지운 프로그램과 데이터의 경계는 현대 소프트웨어 공학에 양날의 유산을 남겼다.

1. **긍정적 유산 — 메타프로그래밍, 컴파일러, 자동 미분**:
   - **언어 위의 언어(DSL과 매크로)**: 코드가 곧 리스트 데이터이므로, 프로그램이 실행 전후에 자신의 구문 트리를 변환하는 매크로(Macro)와 도메인 특화 언어(DSL), 자기 호스팅(self-hosting) 컴파일러가 탄생했다.
   - **기호 미분에서 현대 AI 계산 그래프로**: §3g의 `diff[y; x]`가 대수 수식을 S-표현 트리로 표현하고 `maplist`로 도함수 트리를 생성했듯, 현대 딥러닝 프레임워크(PyTorch, JAX, StableHLO/MLIR)는 신경망 연산을 기호적 계산 그래프(IR)로 포착한 뒤 이를 미분(Autograd)하고 가속기 커널로 컴파일한다([[표현·IR·ABI 경계는 무엇을 보존하는가]]).
2. **구조적 대가 — 정적 검증의 불완전성과 보안 경계의 붕괴**:
   - **정적 분석과 최적화의 한계**: 런타임에 임의의 데이터 리스트가 `eval`이나 `apply`를 통해 코드로 둔갑할 수 있는 환경에서는, 컴파일 시점에 호출 그래프와 타입 안전성을 완벽히 결정하는 것이 원리적으로 불가능해진다([[정지 문제]]).
   - **인젝션(Injection) 취약점의 원형**: [[입력을 해석하는 경계는 왜 보안 경계인가]](`ref-090`)가 규명하듯, 현대 시스템 보안의 가장 치명적인 취약점들—SQL 인젝션, 크로스 사이트 스크립팅(XSS), 셸 명령어 주입, 원격 코드 실행(RCE), 그리고 거대언어모델(LLM)의 프롬프트 인젝션(Prompt Injection)—은 모두 **"단순 데이터(`QUOTE`된 리터럴)로 머물러야 할 외부 입력이 해석기(`eval`)의 코드 문맥으로 흘러들어 가 명령어로 실행되는 현상"**이다. 매카시가 `apply`를 정의할 때 인자 목록에 굳이 `appq`를 씌워 `(QUOTE, arg)`로 격리해야 했던 이유가 바로, 구문과 데이터가 동형인 시스템에서 **데이터 인용(`QUOTE`)과 코드 실행(`eval`)의 경계가 곧 시스템의 안전 경계 그 자체**이기 때문이었다.

## 관계

<!-- knowledge:relations:start -->
| 관계 | 대상 | 설명 | 근거 |
|---|---|---|---|
| implements | [[기호 조작]] | S-표현(원자 기호와 순서쌍 DAG)과 5대 원시 함수(atom, eq, car, cdr, cons)를 통해 기호 조작을 O(1) 포인터 역참조 기반의 튜링 완전한 실행 모델로 구체화한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
| enables | [[프로그래밍 가능성]] | M-표현 함수 정의를 S-표현 리스트로 일대일 번역하는 호모아이코니시티와 apply/eval 및 고계 함수(maplist, diff)를 통해 언어가 자기 자신을 합성·변형·실행하는 메타프로그래밍 가능성을 연다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
| synthesizes | [[계산 가능성]] | 부분 함수, 비엄격 조건식, label 재귀, 보편 S-함수 apply, 플로우차트-재귀 환원 정리를 통해 처치의 람다 대수와 튜링의 보편 기계를 하나의 함수적 계산 이론 체계로 통합한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]], [[On Computable Numbers with an Application to the Entscheidungsproblem]], [[An Unsolvable Problem of Elementary Number Theory]] |
| synthesizes | [[보편 튜링 기계]] | 튜링의 1차원 테이프 상태표 부호화를 구조화된 S-표현 추상 구문과 반 페이지 분량의 메타순환 인터프리터 apply/eval로 재구성한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]], [[On Computable Numbers with an Application to the Entscheidungsproblem]] |
| synthesizes | [[컴파일러]] | 인터프리터(APPLY)의 유연성과 푸시다운 스택(SAVE/UNSAVE) 기반 기계어 컴파일러의 60배 실행 속도 및 자동 메모리 회수(Mark & Sweep GC)가 하나의 시스템 안에서 분업하는 런타임 구조를 규명한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]], [[The FORTRAN Automatic Coding System]] |
<!-- knowledge:relations:end -->

## 출처

<!-- wiki-v2:evidence-start -->
### 근거 ID
- `ref-155`
- `ref-009`
- `ref-010`
- `ref-006`
- `ref-016`
- `src-004`
- `ref-011`
- `ref-090`
<!-- wiki-v2:evidence-end -->

- [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] (`raw/McCarthy-60.pdf`)
- [[On Computable Numbers with an Application to the Entscheidungsproblem]]
- [[An Unsolvable Problem of Elementary Number Theory]]
- [[First Draft of a Report on the EDVAC]]
- [[The FORTRAN Automatic Coding System]]
- [[서브루틴과 스택(Stack)의 원리]]
- [[A Case against the GO TO Statement]]
- [[CWE-20 Improper Input Validation]]

## 관련 항목

- [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] — S-표현, 5대 원시 함수, `apply`/`eval`, Mark & Sweep 가비지 컬렉션, 푸시다운 리스트 재귀 컴파일러를 제시한 매카시의 1960년 원전.
- [[기호 조작]] — 수치 계산을 넘어 기호·수식·프로그램 자체를 형식 규칙에 따라 변환하는 컴퓨팅 관점.
- [[프로그래밍 가능성]] — 기계의 재배선 없이 새 계산을 부여하고 메타프로그래밍으로 추상화 층위를 확장하는 능력.
- [[계산 가능성]] — 부분 함수와 재귀 정의를 통해 유한한 규칙으로 계산 가능한 함수의 경계를 다루는 이론적 개념.
- [[보편 튜링 기계]] — 다른 기계의 기술을 입력 데이터로 받아 모사하는 튜링의 추상 기계이자 `apply`/`eval`의 이론적 대응물.
- [[IBM 704]] — 36비트 워드의 `address`/`decrement` 필드로 `car`/`cdr` 포인터 구조와 초기 LISP·Fortran 시스템을 구동한 컴퓨터.
- [[스택]] — 재귀 함수 컴파일에서 임시 레지스터 충돌을 해결한 공용 푸시다운 리스트(`SAVE`/`UNSAVE`)의 핵심 자료구조.
- [[입력을 해석하는 경계는 왜 보안 경계인가]] — 데이터가 코드나 명령으로 재해석될 때 발생하는 인젝션 및 검증 경계 문제를 분석한다.
