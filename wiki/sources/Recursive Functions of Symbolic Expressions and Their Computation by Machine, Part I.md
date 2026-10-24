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
  - McCarthy LISP paper
  - 기호식의 재귀 함수와 기계에 의한 계산
summary: M.I.T. 인공지능 그룹의 Advice Taker 구상에서 출발해 부분 함수·비엄격 조건식·label 재귀·S-표현·보편 함수 apply/eval로 기호 계산과 계산 이론을 정식화하고, IBM 704 리스트 구조·자동 메모리 회수(가비지 컬렉션)·푸시다운 리스트 기반 재귀 컴파일러 및 플로우차트의 재귀 함수 환원까지 제시한 존 매카시의 1960년 논문.
domains:
  - programming-languages
  - computer-science
  - computer-history
  - computer-architecture
publication_visibility: public
graph_visibility: public
status: current
page_role: knowledge
created: 2026-10-25
updated: 2026-10-25
evidence_ids: []
capability_layers:
  - computability
  - programmability
  - realized-performance
history:
  publication_year: 1960
  layer: software
origin: local
works:
  primary:
    - citation: "John McCarthy, Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I, Communications of the ACM 3(4), April 1960, pp. 184–195"
      genre: primary-literature
      identifiers:
        - type: doi
          value: 10.1145/367177.367199
      edition: Communications of the ACM, Vol. 3, No. 4, April 1960
  supporting:
    - citation: "John McCarthy, Stanford LaTeX reprint with 1995 retrospective footnotes (ARPA ONR grant N00014-94-1-0775), pp. 1–34"
      genre: other
      identifiers: []
      edition: "1995 Stanford LaTeX reprint"
    - citation: "J. McCarthy, Programs with common sense, Symposium on the Mechanization of Thought Processes, NPL Teddington, Nov. 1958"
      genre: primary-literature
      identifiers: []
      edition: null
    - citation: "A. Newell and J. C. Shaw, Programming the logic theory machine, Proc. Western Joint Computer Conference, Feb. 1957"
      genre: primary-literature
      identifiers: []
      edition: null
    - citation: "A. Church, The Calculi of Lambda-Conversion, Princeton University Press, 1941"
      genre: primary-literature
      identifiers: []
      edition: null
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
relations:
  - predicate: enables
    target: concept:symbolic-manipulation
    note: 원자 기호와 순서쌍(S-표현) 및 5대 원시 함수(atom, eq, car, cdr, cons)로 임의의 기호식과 수식·문장을 일관되게 조립·변환하는 계산 체계를 확립한다.
    evidence:
      - source: ref-155
        locator: "§3 Recursive Functions of Symbolic Expressions & §4a Representation of S-Expressions by List Structure"
  - predicate: enables
    target: concept:programmability
    note: M-표현 함수 정의를 S-표현 데이터로 번역하는 호모아이코니시티와 apply/eval 인터프리터·재귀 컴파일러·자동 메모리 회수를 결합해 자기 기술적 프로그래밍과 고계 추상화를 실현한다.
    evidence:
      - source: ref-155
        locator: "§3e–§3g & §4c–§4f"
  - predicate: responds_to
    target: concept:page-676372e6
    note: 테이프 상태표 부호화에 의존하던 보편 튜링 기계의 역할을 재귀 함수 방정식 apply/eval과 실제 인터프리터 루틴(APPLY)으로 재구성한다.
    evidence:
      - source: ref-155
        locator: "§1 Introduction & §3f The Universal S-Function apply"
---

## 개요

[[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]]은 M.I.T. 인공지능 연구 그룹의 존 매카시(John McCarthy)가 1960년 4월 《Communications of the ACM》 3권 4호(pp. 184–195)에 발표한 논문이다. 이 위키의 로컬 보존본(`raw/McCarthy-60.pdf`, 총 34쪽)은 매카시가 스탠퍼드 대학교 재직 중이던 1995년 ARPA(ONR) 연구비 지원으로 원문을 $\text{\LaTeX}$으로 재조판하면서 사소한 표기 교정과 함께 **8개의 회고 각주(1995 remarks)**를 덧붙인 판본이다. 아래 서술에서는 원문의 절 번호(§1–§7)를 기준으로 삼고, 로컬 PDF 쪽수(pp. 1–34)와 학술지 원문 쪽수(CACM pp. 184–195) 및 1995년 저자 주석을 함께 명기한다.

이 논문은 단순한 신규 언어 매뉴얼이 아니다. 매카시는 1958년 11월 제안한 상식 추론 시스템 **Advice Taker**[1]—명령문(imperative sentences)뿐 아니라 선언적 문장(declarative sentences)을 기계에 입력해 논리적 연역(deductions)과 상식적 판단을 수행하게 하려는 기획—를 실험하기 위해 [[IBM 704]] 컴퓨터 위에서 **LISP(LISt Processor)** 프로그래밍 시스템을 설계했다(§1, PDF p. 1).

개발 과정에서 LISP는 특정 컴퓨터 명령어 집합에 종속된 도구에서 벗어나, **특정 부류의 기호식(S-expressions) 위에서 정의되는 부분 재귀 함수(partial recursive functions)의 일반 표기 체계**로 단순화되었다. 매카시는 이 형식 체계가 두 가지 목적을 동시에 달성한다고 선언한다(§1, PDF p. 2):
1. **실용적 프로그래밍 언어**: 수치가 아닌 기호식·논리식·대수 공식·프로그램 자체를 다루는 간결한 언어.
2. **계산 이론의 발전 도구(vehicle for developing a theory of computation)**: [[튜링 기계]]의 테이프·상태 전이 표보다 수학적으로 다루기 쉬우면서도, **보편 S-함수 `apply`**를 통해 이론적으로는 [[보편 튜링 기계]](Universal Turing Machine)의 역할을, 실용적으로는 **인터프리터(interpreter)**의 역할을 동시에 수행하는 함수적 계산 모델.

---

## 1. 연구 동기와 함수 정의의 형식화 (§1–§2, PDF pp. 1–8 / CACM pp. 184–187)

매카시는 기호식을 다루기에 앞서, 계산에 의해 정의되는 함수 일반을 엄밀히 기술하기 위한 네 가지 수학적 장치—부분 함수, 조건식, $\lambda$-표기, `label`—를 정립한다.

### a. 부분 함수 (Partial Functions, §2a, PDF p. 2)

정의역의 일부에서만 값이 정의되는 함수를 **부분 함수(partial function)**라 부른다. 계산 절차(computations)로 함수를 정의할 때 어떤 인자 값에 대해서는 계산이 영원히 종료하지 않을 수 있으므로([[정지 문제]]), 부분 함수는 계산 이론에서 필연적으로 발생한다. 나아가 매카시는 계산의 비종료 때문만이 아니라, 원시 함수 일부(`eq`, `car`, `cdr`)를 처음부터 부분 함수로 정의한다(예: 원자 기호에 대한 `car`는 정의되지 않음).

### b–c. 명제식, 술어, 조건식 (Conditional Expressions, §2b–2c, PDF pp. 2–4)

참($T$)과 거짓($F$)을 값으로 갖는 식을 명제식(propositional expression), 치역이 $\{T, F\}$인 함수를 술어(predicate)라 한다. 매카시는 절댓값 $|x|$처럼 진릿값에 따라 다른 양이 결정되는 관계를 수학 책들이 기호 대신 영어 문장("if ... then ...")으로 서술해 온 한계를 지적하며, **조건식(conditional expression)** 표기를 도입한다:

$$(p_1 \rightarrow e_1, \cdots, p_n \rightarrow e_n)$$

여기서 $p_i$는 명제식이고 $e_i$는 임의의 식이다. 조건식의 값을 결정하는 규칙은 엄격한 **왼쪽에서 오른쪽으로의 순차·단락 평가(비엄격 평가)**다(PDF pp. 3–4):
- $p_1, p_2, \dots, p_n$을 왼쪽부터 차례대로 검사한다.
- 정의되지 않은(undefined) $p$를 만나기 전에 값이 $T$인 첫 번째 $p_i$를 만나면, 그에 대응하는 $e_i$의 값(정의되어 있다면)이 전체 조건식의 값이 된다.
- 참인 $p$를 만나기 전에 정의되지 않은 $p$를 만나거나, 모든 $p_i$가 거짓($F$)이거나, 선택된 첫 참인 $p_i$의 결과식 $e_i$가 정의되지 않았다면 전체 조건식의 값은 **미정의(undefined)**다.

원문(PDF p. 4)은 이 비엄격 규칙의 결정적 차이를 다음 예시로 대조한다:
- $(2 < 1 \rightarrow \frac{0}{0}, T \rightarrow 3) = 3$ — 첫 조건 $2 < 1$이 $F$이므로 미정의 식 $\frac{0}{0}$은 평가되지 않고 건너뛴다.
- $(2 < 1 \rightarrow 3, T \rightarrow \frac{0}{0})$ is undefined — 선택된 분기의 결과식이 $\frac{0}{0}$이므로 미정의다.
- $(2 < 1 \rightarrow 3, 4 < 1 \rightarrow 4)$ is undefined — 모든 조건이 $F$이므로 미정의다.

이를 통해 절댓값 $|x| = (x < 0 \rightarrow -x, T \rightarrow x)$, 크로네커 델타 $\delta_{ij} = (i = j \rightarrow 1, T \rightarrow 0)$, 부호 함수 $\text{sgn}(x) = (x < 0 \rightarrow -1, x = 0 \rightarrow 0, T \rightarrow 1)$가 일관되게 정의된다.

> [!NOTE] 1995년 저자 각주 2 (PDF p. 3): Algol 60과 `if ... then ... else`의 탄생
> 매카시는 Algol 60에 무엇을 포함할지 논의하던 CACM 포럼에 조건식 제안을 보냈으나, 분량이 짧다는 이유로 편집자가 '독자 투고(letter to the editor)'로 격하해 실었다(후일 CACM이 사과함). 또한 Algol 60 위원회가 "새로운 수학 기호는 허용하지 않고 모든 새 표기는 영어 단어여야 한다"고 결정함에 따라 화살표 표기 $(p \rightarrow e)$는 기각되었고, [[존 배커스]](John Backus)가 제안한 영어 구문 `if ... then ... else`가 Algol 60에 채택되었다.

### d. 재귀적 함수 정의와 비가환 논리 결합사 (§2d, PDF pp. 4–6)

조건식을 사용하면 순환 논리(circularity)에 빠지지 않고 정의하려는 함수 자신이 우변에 등장하는 재귀 정의를 쓸 수 있다:

$$n! = (n = 0 \rightarrow 1, T \rightarrow n \cdot (n - 1)!)$$

$0!$을 계산할 때 조건식의 평가 규칙 덕분에 첫 분기 $0 = 0 \rightarrow 1$만 선택되고 무의미한 식 $0 \cdot (0 - 1)!$은 평가되지 않는다. 원문은 이어 유클리드 호제법 $\text{gcd}(m, n)$과 뉴턴 제곱근 근사법 $\text{sqrt}(a, x, \epsilon)$을 재귀 정의로 제시한다:

$$\text{gcd}(m, n) = (m > n \rightarrow \text{gcd}(n, m), \text{rem}(n, m) = 0 \rightarrow m, T \rightarrow \text{gcd}(\text{rem}(n, m), m))$$

$$\text{sqrt}(a, x, \epsilon) = (|x^2 - a| < \epsilon \rightarrow x, T \rightarrow \text{sqrt}(a, \tfrac{1}{2}(x + \tfrac{a}{x}), \epsilon))$$

나아가 명제 논리 결합사 자체를 조건식으로 정의한다(PDF p. 6):

$$\begin{aligned}
p \wedge q &= (p \rightarrow q, T \rightarrow F) \\
p \vee q &= (p \rightarrow T, T \rightarrow q) \\
\neg p &= (p \rightarrow F, T \rightarrow T) \\
p \supset q &= (p \rightarrow q, T \rightarrow T)
\end{aligned}$$

여기서 매카시는 계산 이론적으로 매우 중요한 사실을 지적한다. $p$나 $q$가 미정의(비종료)일 수 있는 계산 환경에서 이 정의에 따른 **$\wedge$와 $\vee$는 교환법칙이 성립하지 않는다(noncommutative)**. 만약 $p$가 거짓($F$)이고 $q$가 미정의라면, $p \wedge q$는 $p$만 먼저 계산하고 즉시 $F$를 반환하지만, $q \wedge p$는 $q$를 먼저 계산하려다 종료하지 못해 미정의가 된다. 매카시는 이 비가환성이 순차 계산에서 불필요한 무한 루프를 피하게 해 주는 바람직한 성질이라고 명시한다.

### e. 함수(Functions)와 형식(Forms), 그리고 속박 변수 충돌 (§2e, PDF pp. 6–7)

나중에 **함수를 나타내는 식 자체를 계산 대상**으로 삼기 위해, 매카시는 [[알론조 처치]](Alonzo Church)의 《람다 변환 계산(*The Calculi of Lambda-Conversion*, 1941)》[3]을 따라 **형식(form)**과 **함수(function)**를 엄격히 구분한다.
- $y^2 + x$ 같은 식은 함수가 아니라 **형식(form)**이다. 만약 $y^2 + x(3, 4)$라고 쓰면 3과 4를 $x, y$ 중 어느 것에 대입해야 할지 알 수 없어 값이 $4^2 + 3 = 19$인지 $3^2 + 4 = 13$인지 확정되지 않는다.
- 형식 $\mathcal{E}$에 등장하는 변수들과 인자 순서의 대응을 명시해 진짜 함수로 변환하는 장치가 처치의 **$\lambda$-표기**다. $\lambda((x, y), y^2 + x)$는 첫 인자를 $x$, 둘째 인자를 $y$에 대입하는 2변수 함수이며, $\lambda((x, y), y^2 + x)(3, 4) = 19$다.
- $\lambda$의 변수 목록에 있는 변수는 정적분의 적분 변수처럼 가변수(dummy) 혹은 **속박 변수(bound variable)**이며, 이름 충돌만 일으키지 않으면 일관되게 이름을 바꿀 수 있다($\alpha$-동치: $\lambda((x, y), y^2 + x) \equiv \lambda((u, v), v^2 + u) \equiv \lambda((y, x), x^2 + y)$). 속박되지 않은 변수는 **자유 변수(free variable)**다.
- $\lambda$-표기들로 기술을 합성할 때 서로 다른 속박 변수가 우연히 같은 기호를 써서 의미가 왜곡되는 **속박 변수의 충돌(collision of bound variables)**이 발생한다. 변수를 아예 쓰지 않는 조합자(combinators) 표기법이 존재하지만, 매카시는 조합자 식이 "지나치게 길고 읽기 어렵다(lengthy and unreadable)"는 이유로 기각하고 후술할 `eval`의 환경 리스트 $a$로 이 문제를 해결한다.

### f. 재귀 함수를 위한 `label` 표기 (§2f, PDF pp. 7–8)

처치의 $\lambda$-표기만으로는 재귀 함수를 닫힌 식(closed expression)으로 명명할 수 없다(§7에서 매카시는 이 결함을 너새니얼 로체스터(N. Rochester)가 지적했다고 밝힌다). 예를 들어

$$\text{sqrt} = \lambda((a, x, \epsilon), (|x^2 - a| < \epsilon \rightarrow x, T \rightarrow \text{sqrt}(a, \tfrac{1}{2}(x + \tfrac{a}{x}), \epsilon)))$$

의 우변만 떼어 놓으면, 식 내부에 등장하는 `sqrt`가 바깥의 함수 전체를 가리킨다는 사실이 표현되지 않아 익명 함수 식이 될 수 없다. 이를 해결하기 위해 매카시는 **`label(a, E)`** 표기를 도입한다:

$$\text{label}(\text{sqrt}, \lambda((a, x, \epsilon), (|x^2 - a| < \epsilon \rightarrow x, T \rightarrow \text{sqrt}(a, \tfrac{1}{2}(x + \tfrac{a}{x}), \epsilon))))$$

$\text{label}(a, \mathcal{E})$는 식 $\mathcal{E}$를 나타내되, $\mathcal{E}$ 내부에 등장하는 기호 $a$가 **그 식 전체(the expression as a whole)**를 재귀적으로 지칭하도록 속박한다.

---

## 2. 기호식(S-expression)과 재귀적 S-함수 (§3a–§3d, PDF pp. 8–15 / CACM pp. 187–189)

### a. S-표현(S-expressions)과 리스트 축약 표기 (§3a, PDF pp. 8–10)

**S-expression(기호 표현, S stands for symbolic)**은 특수 문자 `(`, `)`, `·`와 무한히 구별 가능한 **원자 기호(atomic symbols)**의 집합으로부터 귀납적으로 정의된다:
1. 원자 기호는 S-표현이다(예: `A`, `ABA`, `APPLE PIE NUMBER 3`).
2. $e_1$과 $e_2$가 S-표현이면, 순서쌍 **`(e1 · e2)`**도 S-표현이다.

매카시가 수학의 관례적인 단일 문자 대신 영단어·구절 형태의 원자 기호를 채택한 이유는 두 가지다(PDF p. 9): 첫째, 컴퓨터 프로그램은 [[IBM 704]]가 인쇄할 수 있는 47개 문자 조합으로 수백 개의 구별 가능한 기호를 만들어야 하고, 둘째, 기억하기 쉬운(mnemonic) 영어 단어를 원자 단위로 쓰는 것이 편리하기 때문이다(단, 문자열로서의 내부 구조는 무시하고 서로 다른 기호임만 구별한다).

임의 길이의 리스트 $(m_1, m_2, \cdots, m_n)$은 리스트 종단 원자 기호인 **`NIL`**을 사용하여 중첩된 순서쌍으로 표현된다:

$$(m_1, m_2, \cdots, m_n) \equiv (m_1 \cdot (m_2 \cdot (\cdots (m_n \cdot \text{NIL}) \cdots)))$$

전체 규칙은 다음과 같다(PDF p. 10):
1. `(m)`은 `(m · NIL)`의 축약이다.
2. `(m1, ..., mn)`은 `(m1 · (... (mn · NIL)...))`의 축약이다.
3. `(m1, ..., mn · x)`는 `(m1 · (... (mn · x)...))`의 축약이다.  
   예: `((AB, C), D)`는 `((AB · (C · NIL)) · (D · NIL))`을 뜻한다. (1995 각주 3: 당시에는 리스트 원소 사이를 쉼표 `,`로 구분했기 때문에 원자 기호 내부에 단일 공백을 허용할 수 있었다.)

### b. S-함수와 메타 표현(M-expressions) (§3b, PDF p. 10)

S-표현들 위의 함수를 정의할 때, **데이터인 S-표현**과 **함수를 기술하는 표현**을 시각적으로 엄격히 구별하기 위해 매카시는 **M-expression(meta-expression)** 규약을 도입한다:
- 함수 이름과 S-표현 위를 움직이는 변수는 **영어 소문자열**을 쓴다(예: `car`, `cons`, `x`).
- 함수 적용에는 소괄호와 쉼표 대신 **대괄호 `[ ]`와 세미콜론 `;`**을 쓴다(예: `car[cons[(A · B); x]]`).
- M-표현 내부에 등장하는 대문자 S-표현은 자기 자신(상수)을 나타낸다.

### c. 5대 기본 S-함수와 술어 (The Elementary S-functions and Predicates, §3c, PDF pp. 10–11)

모든 기호 계산의 기초가 되는 5대 원시 연산자는 다음과 같이 정의된다:

| 원시 연산자 | 정의 및 부분성(Partiality) 조건 | 원문 예시 및 대수적 항등식 |
|---|---|---|
| **`atom[x]`** | $x$가 원자 기호이면 $T$, 아니면 $F$ (전 함수) | `atom[X] = T`, `atom[(X · A)] = F` |
| **`eq[x; y]`** | **$x$와 $y$가 둘 다 원자 기호일 때만 정의됨(부분 함수)**. 같은 기호면 $T$, 다르면 $F$ | `eq[X; X] = T`, `eq[X; A] = F`, **`eq[X; (X · A)]`는 미정의(undefined)** |
| **`car[x]`** | **$x$가 원자 기호가 아닐 때만 정의됨(부분 함수)**. $\text{car}[(e_1 \cdot e_2)] = e_1$ | `car[X]`는 미정의, `car[(X · A)] = X`, `car[((X · A) · Y)] = (X · A)` |
| **`cdr[x]`** | **$x$가 원자 기호가 아닐 때만 정의됨(부분 함수)**. $\text{cdr}[(e_1 \cdot e_2)] = e_2$ | `cdr[X]`는 미정의, `cdr[(X · A)] = A`, `cdr[((X · A) · Y)] = Y` |
| **`cons[x; y]`** | 임의의 S-표현 $x, y$에 대해 항상 정의됨(전 함수). $\text{cons}[e_1; e_2] = (e_1 \cdot e_2)$ | `cons[X; A] = (X · A)` |

`car`, `cdr`, `cons`는 다음 세 항등식을 만족한다(PDF p. 11):

$$\begin{aligned}
\text{car}[\text{cons}[x; y]] &= x \\
\text{cdr}[\text{cons}[x; y]] &= y \\
\text{cons}[\text{car}[x]; \text{cdr}[x]] &= x \quad (\text{단, } x\text{가 원자 기호가 아닐 때})
\end{aligned}$$

리스트 축약 표기에서 `car[(m1, m2, ..., mn)] = m1`, `cdr[(m1, m2, ..., mn)] = (m2, ..., mn)`, `cdr[(m)] = NIL`, `cons[m1; (m2, ..., mn)] = (m1, m2, ..., mn)`, `cons[m; NIL] = (m)`이 성립한다(PDF p. 13).

### d. 재귀적 S-함수와 핵심 리스트 연산 (§3d, PDF pp. 11–15)

`car`, `cdr`, `cons`의 단순 합성만으로는 주어진 위치의 부분식을 추출하거나 조립하는 제한된 함수만 만들 수 있다. 그러나 여기에 **조건식과 재귀적 정의**를 결합하면 훨씬 거대한 함수 부류, 즉 **S-표현 위의 모든 계산 가능한 함수(in fact, all computable functions)**를 얻을 수 있다(PDF p. 11). 원문 §3d에서 정의되는 대표적 재귀 S-함수들은 다음과 같다:

1. **`ff[x]`** (괄호를 무시했을 때 첫 번째 원자 기호 추출, PDF pp. 12–13):
   $$\text{ff}[x] = [\text{atom}[x] \rightarrow x; T \rightarrow \text{ff}[\text{car}[x]]]$$
   예: `ff[((A · B) · C)] = ff[(A · B)] = ff[A] = A`.
2. **`subst[x; y; z]`** (S-표현 $z$ 안의 모든 원자 기호 $y$를 S-표현 $x$로 치환, PDF p. 13):
   $$\text{subst}[x; y; z] = [\text{atom}[z] \rightarrow [\text{eq}[z; y] \rightarrow x; T \rightarrow z]; T \rightarrow \text{cons}[\text{subst}[x; y; \text{car}[z]]; \text{subst}[x; y; \text{cdr}[z]]]]$$
3. **`equal[x; y]`** (임의의 두 S-표현의 구조적 상등 판별 — 원자에서만 정의되는 `eq`를 일반 S-표현으로 확장, PDF p. 13):
   $$\text{equal}[x; y] = [\text{atom}[x] \wedge \text{atom}[y] \wedge \text{eq}[x; y]] \vee [\neg\text{atom}[x] \wedge \neg\text{atom}[y] \wedge \text{equal}[\text{car}[x]; \text{car}[y]] \wedge \text{equal}[\text{cdr}[x]; \text{cdr}[y]]]$$
4. **보조 약어 및 리스트 함수들 (PDF pp. 14–15)**:
   - $\text{null}[x] = \text{atom}[x] \wedge \text{eq}[x; \text{NIL}]$
   - 복합 선택자 약어: $\text{cadr}[x] = \text{car}[\text{cdr}[x]]$, $\text{caddr}[x] = \text{car}[\text{cdr}[\text{cdr}[x]]]$, $\text{caar}[x]$, $\text{cadar}[x]$, $\text{caddar}[x]$ 등
   - $\text{list}[e_1; e_2; \cdots; e_n] = \text{cons}[e_1; \text{cons}[e_2; \cdots \text{cons}[e_n; \text{NIL}]\cdots]]$
   - **`append[x; y]`**: $[\text{null}[x] \rightarrow y; T \rightarrow \text{cons}[\text{car}[x]; \text{append}[\text{cdr}[x]; y]]]$ (예: `append[(A, B); (C, D, E)] = (A, B, C, D, E)`)
   - **`among[x; y]`**: $\neg\text{null}[y] \wedge [\text{equal}[x; \text{car}[y]] \vee \text{among}[x; \text{cdr}[y]]]$
   - **`pair[x; y]`**: 두 리스트의 대응 원소들을 2원소 리스트로 묶음 (예: `pair[(A, B, C); (X, (Y, Z), U)] = ((A, X), (B, (Y, Z)), (C, U))`)
   - **`assoc[x; y]`**: 쌍들의 리스트 $y = ((u_1, v_1), \cdots, (u_n, v_n))$에서 첫 원소가 $x$인 쌍의 둘째 원소 $v_i$를 검색:
     $$\text{assoc}[x; y] = [\text{eq}[\text{caar}[y]; x] \rightarrow \text{cadar}[y]; T \rightarrow \text{assoc}[x; \text{cdr}[y]]]$$
   - **`sublis[x; y]`**: 쌍 리스트 $x = ((u_1, v_1), \cdots, (u_n, v_n))$에 따라 S-표현 $y$ 내부의 원자 $u_i$들을 병렬 치환.

---

## 3. 호모아이코니시티와 보편 S-함수 `apply`/`eval` (§3e–§3g, PDF pp. 15–22 / CACM pp. 189–191)

### e. S-함수의 S-표현 번역 규칙 $\mathcal{E}^*$ (§3e, PDF pp. 15–16)

S-함수들을 다른 S-함수의 계산 대상으로 삼고 S-함수에 관한 질문에 답하기 위해, 매카시는 메타 언어인 **M-표현 $\mathcal{E}$를 S-표현 데이터 $\mathcal{E}^*$로 일대일 번역하는 6대 규칙**을 제시한다:

| 규칙 번호 | M-표현 ($\mathcal{E}$) | 번역된 S-표현 ($\mathcal{E}^*$) | 번역 예시 및 의미 |
|---|---|---|---|
| **1** | 상수 S-표현 $\mathcal{E}$ | `(QUOTE, E)` | 리터럴 데이터가 변수나 함수 호출로 오인되지 않도록 인용 부호 부여 |
| **2** | 소문자 변수·함수 이름 | 대응하는 대문자 원자 기호 | `car` $\mapsto$ `CAR`, `subst` $\mapsto$ `SUBST`, `x` $\mapsto$ `X` |
| **3** | 함수 적용 $f[e_1; \cdots; e_n]$ | `(f*, e1*, ..., en*)` | `cons[car[x]; cdr[x]]` $\mapsto$ `(CONS, (CAR, X), (CDR, X))` |
| **4** | 조건식 $[p_1 \rightarrow e_1; \cdots; p_n \rightarrow e_n]$ | `(COND, (p1*, e1*), ..., (pn*, en*))` | 각 조건-결과 쌍을 2원소 리스트로 묶어 `COND` 뒤에 나열 |
| **5** | 람다식 $\lambda[[x_1; \cdots; x_n]; \mathcal{E}]$ | `(LAMBDA, (x1*, ..., xn*), E*)` | 매개변수 리스트와 함수 본문 식을 S-표현 리스트로 구조화 |
| **6** | 재귀 레이블 $\text{label}[a; \mathcal{E}]$ | `(LABEL, a*, E*)` | 재귀 자기참조 이름 $a^*$와 함수 정의 $\mathcal{E}^*$를 결합 |

이 규칙에 의해 앞서 M-표현으로 작성된 치환 함수 `subst`의 전체 정의는 다음과 같은 단일 S-표현 리스트 데이터로 번역된다(PDF p. 16):

```lisp
(LABEL, SUBST, (LAMBDA, (X, Y, Z), (COND ((ATOM, Z), (COND,
  (EQ, Y, Z), X), ((QUOTE, T), Z))), ((QUOTE, T), (CONS, (SUBST, X, Y,
  (CAR Z)), (SUBST, X, Y, (CDR, Z)))))))
```

이로써 프로그램 코드(M-표현 추상 구문)와 데이터(S-표현)가 완전히 동일한 리스트 자료구조를 공유하는 **호모아이코니시티(Homoiconicity)**가 성립한다.

### f. 보편 S-함수 `apply`와 `eval` (§3f, PDF pp. 16–21)

임의의 S-함수 $f'$을 번역한 S-표현을 $f$라 하고 인자 리스트를 $\text{args} = (\text{arg}_1, \cdots, \text{arg}_n)$이라 할 때, 모든 정의된 인자에 대해 $f'[\text{arg}_1; \cdots; \text{arg}_n]$과 정확히 같은 값을 계산하는 **보편 S-함수(universal S-function) `apply`**가 존재한다:

$$\text{apply}[f; \text{args}] = \text{eval}[\text{cons}[f; \text{appq}[\text{args}]]; \text{NIL}]$$

여기서 $\text{appq}[m]$은 각 인자 앞에 `QUOTE`를 씌워 `eval`이 인자 값 자체를 다시 변수나 함수 호출로 평가하지 않게 보호하는 보조 함수다:

$$\text{appq}[m] = [\text{null}[m] \rightarrow \text{NIL}; T \rightarrow \text{cons}[\text{list}[\text{QUOTE}; \text{car}[m]]; \text{appq}[\text{cdr}[m]]]]$$

실제 평가를 수행하는 핵심 함수 **`eval[e; a]`**는 평가할 S-표현 $e$와 변수-값 쌍들의 환경 리스트 $a$를 받아 다음과 같이 작동한다(PDF pp. 17–18):

```text
eval[e; a] = [
  atom[e] → assoc[e; a];
  atom[car[e]] → [
    eq[car[e]; QUOTE] → cadr[e];
    eq[car[e]; ATOM]  → atom[eval[cadr[e]; a]];
    eq[car[e]; EQ]    → [eval[cadr[e]; a] = eval[caddr[e]; a]];
    eq[car[e]; COND]  → evcon[cdr[e]; a];
    eq[car[e]; CAR]   → car[eval[cadr[e]; a]];
    eq[car[e]; CDR]   → cdr[eval[cadr[e]; a]];
    eq[car[e]; CONS]  → cons[eval[cadr[e]; a]; eval[caddr[e]; a]];
    T                 → eval[cons[assoc[car[e]; a]; evlis[cdr[e]; a]]; a]
  ];
  eq[caar[e]; LABEL]  → eval[cons[caddar[e]; cdr[e]];
                             cons[list[cadar[e]; car[e]]; a]];
  eq[caar[e]; LAMBDA] → eval[caddar[e];
                             append[pair[cadar[e]; evlis[cdr[e]; a]]; a]]
]
```

보조 함수 `evcon`(조건절 순차 평가)과 `evlis`(인자 목록 일괄 평가)는 다음과 같다:

$$\text{evcon}[c; a] = [\text{eval}[\text{caar}[c]; a] \rightarrow \text{eval}[\text{cadar}[c]; a]; T \rightarrow \text{evcon}[\text{cdr}[c]; a]]$$

$$\text{evlis}[m; a] = [\text{null}[m] \rightarrow \text{NIL}; T \rightarrow \text{cons}[\text{eval}[\text{car}[m]; a]; \text{evlis}[\text{cdr}[m]; a]]]$$

매카시는 `eval[e; a]`의 6단계 평가 원리와 환경 리스트 $a$의 역할을 명확히 해설한다(PDF pp. 18–21):
1. **원자 기호 조회 (`atom[e]`)**: 평가할 식 $e$가 원자 기호(변수)이면 환경 리스트 $a$에서 가장 앞에 쌍을 이루고 있는 값을 찾는다.
2. **특수 형식 및 5대 기본 연산 (`atom[car[e]]`)**: `(QUOTE, e)`는 평가 없이 $e$ 자체(`cadr[e]`)를 반환한다. `ATOM`, `CAR`, `CDR`는 인자 1개를 재귀 평가한 뒤 해당 기본 함수를 적용하고, `EQ`, `CONS`는 인자 2개를 평가한 뒤 적용한다. `COND`는 `evcon`을 호출해 참인 첫 술어가 나올 때까지 순서대로 평가한다.
3. **환경에 바인딩된 함수 기호 호출 (`T` 분기)**: `(f, e1, ..., en)`에서 원자 기호 $f$가 기본 연산자가 아니면(예: `LABEL`로 바인딩된 재귀 함수 이름 `FF`), `assoc[car[e]; a]`로 $f$의 정의를 찾아 인자들과 결합해 재귀 평가한다.
4. **`LABEL` 평가**: `((LABEL, f, E), e1, ..., en)`은 쌍 `(f, (LABEL, f, E))`를 환경 $a$의 맨 앞에 추가(`cons`)한 상태에서 `(E, e1, ..., en)`을 평가하여 재귀 참조를 성립시킨다.
5. **`LAMBDA` 평가와 속박 변수 충돌 회피**: `((LAMBDA, (x1, ..., xn), E), e1, ..., en)`은 형식 매개변수 $(x_1, \dots, x_n)$과 평가된 실인자 목록을 `pair`로 묶어 기존 환경 $a$의 앞부분에 `append`한 뒤 본문 $\mathcal{E}$를 평가한다. 매카시는 $\mathcal{E}$에 인자를 직접 텍스트 치환(substitution)하면 환경 $a$를 없앨 수 있겠지만, 그 경우 §2e에서 지적한 **속박 변수 충돌(collisions of bound variables)**이 발생하며 환경 리스트 $a$를 사용함으로써 이 충돌을 깔끔하게 회피했다고 강조한다(PDF p. 18).
6. **수작업 계산 추적 예시**: PDF pp. 19–21에서는 `apply[(LABEL, FF, ...); ((A · B))] = A`가 환경 $a = ((X, (\text{QUOTE}, (A \cdot B))), (FF, \phi))$에서 $a_1 = ((X, (\text{QUOTE}, A)), \dots)$로 확장되며 `A`로 수렴하는 전 과정을 단계별로 증명한다.

> [!WARNING] 원문 `eval` 정의의 내부 불일치와 1995년 저자 주석 5 (PDF pp. 17–20)
> 로컬 PDF 원문을 정밀 대조하면 p. 17의 `eval` 수식과 pp. 18–20의 본문 설명·추적 계산 사이에 세 가지 미묘한 불일치가 존재한다:
> 1. **원자 평가와 `QUOTE` 처리**: p. 17의 수식은 `atom[e] → assoc[e; a]`로 되어 있어 `assoc`가 찾은 값을 그대로 반환하고, `LAMBDA` 분기에서는 `evlis[cdr[e]; a]`가 평가된 인자 값(인용 부호 없음)을 변수에 바로 바인딩한다. 반면 p. 18의 항목 3 설명은 "원자이면 리스트 $a$에서 짝지어진 대상을 **다시 `eval`한다**(evaluates whatever is paired with it)"고 서술하며, pp. 19–20의 `FF` 수작업 추적에서도 환경 $a$에 `(X, (QUOTE, (A · B)))`처럼 `QUOTE`가 씌워진 식을 넣고 `atom[eval[X; a]] = atom[eval[assoc[X; a]; a]]`로 이중 평가한다.
> 2. **환경의 함수 이름 호출 시 이중 평가 위험**: p. 17의 `T → eval[cons[assoc[car[e]; a]; evlis[cdr[e]; a]]; a]`에서는 `evlis`가 이미 인자들을 한 번 평가했는데, 바깥의 `eval`이 `assoc`로 치환된 `((LAMBDA, ...), val1, ...)`을 평가할 때 `LAMBDA` 분기 내부의 `evlis`가 인자들을 **두 번째로 다시 평가**하게 된다(그래서 p. 20의 수작업 추적에서는 `evlis[((CAR, X)); a]`가 `((QUOTE, A))`처럼 `QUOTE`를 씌운 리스트를 반환한다고 고쳐 계산하고 있다).
> 3. **동적 스코핑(Dynamic Scoping)과 고계 함수 변수 포획**: 환경을 단순 누적 리스트 $a$로 전달하기 때문에 자유 변수가 정의 시점이 아닌 호출 시점의 $a$에서 조회되며, 함수를 인자로 전달할 때 매개변수 이름이 충돌하는 현상(후대의 **Funarg 문제**)이 발생한다.  
> 매카시 자신도 1995년 각주 5(PDF p. 18)에서 **"1995: This version isn't quite right."**라고 인정하며, 논문 초안의 `eval`과 실제 IBM 704에서 디버깅되어 돌아간 `APPLY` 구현 사이의 비교는 허버트 스토얀(Herbert Stoyan, 1991, *"The Influence of the Designer on the Design"*)의 연구를 참조하라고 명시했다.

### g. 함수를 인자로 받는 함수(고계 함수)와 기호 미분 (§3g, PDF pp. 21–22)

매카시는 함수를 인자로 받는 고계 S-함수(higher-order functions)의 위력을 세 가지 예로 입증한다:
1. **`maplist[x; f]`**: 리스트 $x$의 각 접미 리스트(`x`, `cdr[x]`, ...)에 함수 $f$를 적용해 새 리스트를 생성한다:
   $$\text{maplist}[x; f] = [\text{null}[x] \rightarrow \text{NIL}; T \rightarrow \text{cons}[f[x]; \text{maplist}[\text{cdr}[x]; f]]]$$
2. **기호 편미분 함수 `diff[y; x]` (PDF p. 21)**: 전위 폴란드 표기법(Polish notation)과 가변 인자 리스트로 표현된 대수식—예: $X(X + A)Y$를 나타내는 `(TIMES, X, (PLUS, X, A), Y)`—을 변수 $x$에 대해 형식 편미분(partial derivative)하는 재귀 함수다:
   ```text
   diff[y; x] = [
     atom[y] → [eq[y; x] → ONE; T → ZERO];
     eq[car[y]; PLUS] → cons[PLUS; maplist[cdr[y]; λ[[z]; diff[car[z]; x]]]];
     eq[car[y]; TIMES] → cons[PLUS; maplist[cdr[y]; λ[[z]; cons[TIMES;
       maplist[cdr[y]; λ[[w]; ¬eq[z; w] → car[w]; T → diff[car[w]; x]]]]]]]
   ]
   ```
   합의 미분법과 곱의 미분법(라이프니츠 규칙)이 중첩된 `maplist`와 익명 함수 $\lambda$의 결합만으로 단 몇 줄에 표현되며, `(TIMES, X, (PLUS, X, A), Y)`를 미분하면 `(PLUS, (TIMES, ONE, (PLUS, X, A), Y), (TIMES, X, (PLUS, ONE, ZERO), Y), (TIMES, X, (PLUS, X, A), ZERO))`가 산출된다.
3. **`search[x; p; f; u]` (PDF pp. 21–22)**: 리스트 $x$에서 술어 $p$를 만족하는 첫 위치를 찾아 함수 $f$를 적용하고, 없으면 무인자 함수 $u$를 실행하는 고계 탐색 함수다.

---

## 4. IBM 704 LISP 프로그래밍 시스템 구현 (§4, PDF pp. 22–30 / CACM pp. 191–194)

§4는 추상적인 S-표현과 S-함수가 실제 [[IBM 704]] 하드웨어의 기억장치와 기계어 프로그램으로 어떻게 구현되었는지를 상술한다. 매카시는 LISP 시스템의 6대 활용 목적을 (1) LISP 자체를 기계어로 번역하는 컴파일러 작성, (2) 형식 논리 체계의 증명 검사기, (3) 형식 미분 및 적분, (4) 술어 논리 정리 자동 증명, (5) 결과가 숫자가 아닌 수식(formulas)인 공학 계산, (6) Advice Taker 시스템 프로그래밍으로 제시한다(PDF p. 22).

### a. 리스트 구조(List Structure)와 부분식 공유 및 순환 금지 (§4a, PDF pp. 22–25)

IBM 704의 36비트 워드(레지스터) 하나는 두 개의 포인터 필드를 갖는다(Figure 1, 2, PDF pp. 23–24):
- 왼쪽 박스인 **`address` 필드**는 `car[x]` 부분식의 메모리 주소를 담는다.
- 오른쪽 박스인 **`decrement` 필드**는 `cdr[x]` 부분식의 메모리 주소를 담는다.
- 리스트의 마지막 워드는 `decrement` 필드에 `NIL`의 주소를 담는다.

여기서 매카시는 메모리상의 그래프 위상(topology)에 대해 중요한 규칙을 정한다(Figure 1b, 1c, Figure 3a, 3b, PDF pp. 23–25):
- **부분 구조 공유(DAG) 허용**: 동일한 부분식이 여러 곳에 등장할 때(예: `((A · B) · (A · B))`), 이를 별도 워드로 중복 저장(Fig. 3a)할 수도 있고 하나의 `(A · B)` 워드를 두 포인터가 동시에 가리키게(Fig. 1b, Fig. 3b) 공유할 수도 있다. 공유 여부는 프로그램의 실행 이력에 따라 달라지지만, 시간과 메모리 요구량에만 영향을 줄 뿐 **기계 외부로 출력되는 프로그램의 논리적 결과에는 아무런 차이를 만들지 않는다**(불변 참조 투명성).
- **순환 리스트(Circular List Structure) 금지**: 포인터가 자기 자신의 조상을 다시 가리키는 사이클(Fig. 1c)은 금지된다. 매카시는 "우리의 위상(topology)을 가진 세계의 종이 위에는 자기 자신의 부분식인 식이 존재할 수 없다"며, 재귀 함수 표현 등에 일부 이점이 있더라도 인쇄(printing) 시 무한 루프에 빠지는 등 연산상의 난점 때문에 순환 구조를 금지한다고 설명한다(PDF pp. 24–25).
- **기호 저장에서 리스트 구조의 3대 이점 (PDF p. 25)**:
  1. 프로그램이 다룰 식의 크기와 개수를 사전에 예측할 수 없으므로 고정 길이 블록 할당이 불가능하다.
  2. 더 이상 필요 없어진 레지스터는 단 1개라도 자유 저장 목록(free-storage list)에 즉시 되돌려 재사용할 수 있다(선형 연속 저장 방식에서는 홀수 크기의 가용 조각들을 재활용하기 어렵다).
  3. 여러 식에 공통 부분식으로 등장하는 식을 메모리에 단 한 번만 저장할 수 있다.

### b. 원자 기호의 Association List (Property List) (§4b, PDF pp. 23, 25–26)

원문에는 "association list"라는 용어가 두 가지 층위에서 등장하므로 엄격히 구분해야 한다. §3d/§3f의 $a$가 변수-값 쌍들의 환경 리스트라면, §4a–§4b의 **원자 기호의 association list**(1995 각주 6: *"These were later called property lists"*)는 **각 원자 기호를 컴퓨터 메모리 내부에 표현하는 특수 리스트 구조**다:
- 원자 기호를 나타내는 첫 번째 워드의 `address` 필드에는 일반 S-표현 주소가 올 수 없는 **특수 상수(special constant)**가 들어 있어, 프로그램이 이 워드가 원자 기호임을 즉시 식별한다(§4a p. 23, §4d p. 27).
- 그 뒤로는 기호와 연관된 임의의 속성들이 매달린다: 외부 입출력용 인쇄 이름(**`pname`**, print name), 수치 값(기호가 숫자를 나타낼 때), 기호가 이름으로 가리키는 다른 S-표현, 또는 기계어 서브루틴의 시작 주소.
- **Figure 4 (`DIFFERENTIATE`의 `pname` 구조, PDF pp. 25–26)**: IBM 704는 36비트 워드에 6비트 문자 6개를 담는다. 따라서 13글자인 `DIFFERENTIATE`의 `pname` 속성 아래에는 3개의 워드를 가리키는 리스트가 매달리며, 각 워드에 `DIFFER`, `ENTIAT`, `E ??????`(남는 5칸은 인쇄 불가능한 6비트 조합으로 패딩)가 저장된다. 문자 정보가 담긴 이 워드들은 일반 S-표현이 아니므로 원자 기호의 속성 리스트 내부에는 일부 S-함수만 적용될 수 있다.

### c. 자유 저장 목록(Free-Storage List)과 자동 회수(Garbage Collection) (§4c, PDF pp. 26–27)

리스트 구조용 메모리 중 현재 사용되지 않는 레지스터들(초기 약 **15,000개**)은 **`free-storage list`**라는 단일 연결 리스트로 묶여 있으며, **`FREE`** 레지스터가 첫 가용 워드의 주소를 가리킨다. `cons`가 새 워드를 필요로 할 때마다 `FREE`가 가리키는 첫 워드를 가져오고 `FREE`를 다음 워드로 갱신한다.

매카시는 **"사용자가 레지스터를 자유 저장 목록으로 돌려보내는 프로그램을 작성할 필요가 전혀 없다(No provision need be made for the user to program the return of registers)"**고 선언하며, 인류 최초의 자동 동적 메모리 관리 알고리즘인 **재활용 주기(reclamation cycle)**—1995 각주 7에서 매카시가 *"당시에도 우리는 이미 이를 '가비지 컬렉션(garbage collection)'이라 불렀지만, 논문에 쓰기에는 내가 겁을 먹었거나 전자공학연구소(RLE) 교정 담당 숙녀분들이 허락하지 않았을 것이다"*라고 회고한 **Mark & Sweep 가비지 컬렉션**—를 두 단계로 기술한다(PDF pp. 26–27):

1. **트리거 조건**: 프로그램이 돌아가는 동안에는 아무런 회수 작업도 하지 않다가, `cons`가 새 레지스터를 요청했는데 `free-storage list`가 완전히 바닥나면 회수 주기가 시작된다.
2. **1단계 — 도달 가능 레지스터 추적 및 부호 비트 표시 (Mark)**: 프로그램 내부에 현재 접근 가능한 리스트 구조들의 시작 주소를 담은 고정된 **베이스 레지스터(base registers)** 집합이 있다. 각 베이스 레지스터에서 출발해 `car`–`cdr` 사슬로 도달 가능한 모든 레지스터를 찾아 **그 워드의 부호(sign bit)를 음수(negative)로 바꾼다**. 탐색 도중 이미 부호가 음수인 레지스터를 만나면 이미 방문한 노드로 간주해 중복 탐색을 멈춘다(DAG 공유 구조에서도 안전하게 종료됨).
3. **2단계 — 선형 주사 및 회수 (Sweep)**: 리스트 구조용으로 예약된 전체 메모리 영역을 순차적으로 훑으면서, 이전 단계에서 **부호가 바뀌지 않은(양수인) 모든 고립 레지스터들을 `free-storage list`에 다시 연결**하고, 부호가 음수였던 접근 가능 레지스터들의 부호를 다시 양수(positive)로 복원한다.
4. **성능과 메모리 여유 공간의 트레이드오프 (PDF p. 27)**: 매카시는 이 회수 과정이 1회 실행에 **수 초(several seconds)**가 걸리기 때문에, 프로그램이 실행 시간의 대부분을 회수에 허비하지 않으려면 한 번의 회수 주기마다 최소 수천 개의 레지스터가 회수되어야 하며, 따라서 **접근 가능한 활성 리스트가 전체 가용 메모리를 거의 채우는 상태에 가까워지지 않아야 효율적**이라고 정확히 짚어낸다.

### d–f. 5대 연산의 기계어 구현, 푸시다운 리스트 재귀 컴파일러, 1960년 2월 시스템 현황 (§4d–§4f, PDF pp. 27–30)

- **원시 연산의 기계어 매핑 (§4d, pp. 27–28)**:
  - `atom`: 워드 `address`부의 특수 상수를 검사하는 열린 서브루틴(open subroutine, 인라인 코드)으로 구현된다. 조건식 내부에서는 `T`/`F` 기호를 생성하는 대신 조건부 분기(conditional transfer) 명령으로 직결된다.
  - `eq`: 각 원자 기호는 메모리상에 **유일한 하나의 association list**만 갖도록 관리(인터닝, interning)되므로, `eq[e; f]`는 단순히 **두 워드 주소의 수치적 상등(numerical equality of the locations)**을 비교하는 명령 하나로 끝난다.
  - `car`와 `cdr`: 레지스터 $x$의 `address`부 또는 `decrement`부 내용을 누산기(accumulator)로 가져오는 단일 명령어 **`CLA 0, i`**(인덱스 레지스터 간접 참조)로 실행된다. 여기서 **`car`**는 *"Contents of the Address part of Register"*, **`cdr`**는 *"Contents of the Decrement part of Register"*의 약어다.
  - `cons`: *"construct"*의 약어로, `free-storage list`에서 첫 가용 워드를 꺼내 `address`와 `decrement`에 $x, y$를 채우고 그 워드 주소를 반환한다(가용 공간 고갈 시 회수 주기를 호출하는 주체). 인터프리터 시스템에서는 닫힌 서브루틴(closed subroutine)으로, 컴파일된 코드에서는 열린 서브루틴으로 구현된다.
- **재귀 함수의 컴파일과 공용 푸시다운 리스트 (`public push-down list`, §4e, p. 29)**:
  - `car`, `cdr`, `cons`의 합성과 조건식의 컴파일은 단순하지만, `subst[x; y; z]`처럼 **자기 자신을 서브루틴으로 다시 호출하는 재귀 함수**를 컴파일할 때는 임시 저장 레지스터 충돌이 발생한다. `subst[x; y; cdr[z]]`를 재귀 호출하는 동안 이전에 계산해 둔 `subst[x; y; car[z]]`의 결과를 임시 레지스터에 보관해야 하는데, 안쪽의 `subst` 호출이 동일한 임시 레지스터를 덮어써 버리기 때문이다.
  - 이를 해결하기 위해 LISP 시스템은 **`public push-down list`**(1995 각주 8: *"now called a stack"*, 즉 호출 [[스택]])라는 예약된 레지스터 블록과, 현재 사용 중인 깊이를 가리키는 인덱스, 그리고 **`SAVE`와 `UNSAVE` 루틴**을 도입했다. 재귀 루틴 진입 시 `SAVE`를 호출해 지정된 연속 임시 레지스터들을 푸시다운 리스트의 첫 미사용 공간으로 대피시키고 인덱스를 전진시키며, 루틴 종료 직전 `UNSAVE`를 호출해 값을 복원하고 인덱스를 되돌린다. 매카시는 이 규약을 통해 **"재귀 서브루틴이 임시 저장 레지스터들에 대해 투명(transparent)해진다"**고 정의한다.
- **1960년 2월 기준 LISP 시스템 현황 (§4f, pp. 29–30)**:
  - §3f(원문에는 `section 5f`로 오기됨)의 `apply` 변형을 IBM 704 기계어로 옮긴 **`APPLY` 프로그램**이 LISP 인터프리터로 작동 중이다.
  - 선택된 S-함수들을 코어 메모리 안의 기계어 프로그램으로 번역하는 **컴파일러**가 가동 중이며, **컴파일된 함수는 인터프리터로 실행할 때보다 약 60배 빠르게(about 60 times as fast) 계산된다**(항목 5, PDF p. 30). 컴파일 속도 자체가 충분히 빨라 컴파일된 바이너리를 천공 카드로 따로 뽑아 둘 필요가 없다.
  - ALGOL 스타일의 대입문(assignment)과 `go to` 문을 허용하는 **`program feature`**(후대의 `PROG`), 선택적 추적(tracing) 및 오류 진단 기능, 부동소수점 연산(비효율적임), 그리고 차기 기종인 IBM 709 이식 준비 상황이 보고된다.

---

## 5. 대안 형식 체계(Linear LISP)와 플로우차트-재귀 환원 (§5–§7, PDF pp. 30–34 / CACM pp. 194–195)

### a. Linear LISP: 문자열 기반 기호 계산과의 비교 (§5, PDF pp. 30–31)

매카시는 S-표현 대신 유한 문자 집합 위의 임의의 문자열(빈 문자열 $\Lambda$ 포함)인 **L-표현(L-expressions)**을 다루는 대안 체계 **Linear LISP**를 제시한다:
- 3대 문자열 함수: 첫 글자를 추출하는 `first[x]`(`first[ABC] = A`, `first[Λ]`는 미정의), 첫 글자를 뺀 나머지를 반환하는 `rest[x]`(`rest[ABC] = BC`, `rest[Λ]`는 미정의), 문자를 접두사로 붙이는 `combine[x; y]`(`combine[A; BC] = ABC`).
- 3대 술어: 단일 문자 판별 `char[x]`, 빈 문자열 판별 `null[x]`, 문자 상등 `x = y`.
- **장단점 비교**: Linear LISP는 괄호 `( )`, 점 `·`, 쉼표 `,` 같은 특수 예약 문자가 전혀 없어 선형으로 적을 수 있는 모든 식을 그대로 다룰 수 있고, 수학적으로는 Linear LISP 안에 LISP의 기본 함수를 작성할 수 있으므로 Linear LISP가 LISP를 포함한다. 그러나 **하위 부분식(subexpression)을 추출하는 작업이 기본 연산 한 번이 아니라 복잡한 문자열 스캔 연산이 되기 때문에, 실제 컴퓨터 루틴으로 실행할 때는 포인터 트리 구조인 LISP가 본질적으로 훨씬 빠르다(LISP is essentially faster)**.

### b. 플로우차트와 재귀 함수의 상호 변환 (§6, PDF pp. 31–33)

논문의 앞부분(§1–§4)이 재귀적 기호 함수를 컴퓨터 프로그램으로 번역하는 과정을 다루었다면, §6은 **역방향(명령형 컴퓨터 프로그램 $\rightarrow$ 재귀 함수)**이 원리적으로 항상 가능함을 증명한다.
- 계산 도중 어느 시점의 기계 상태를 변수 값들을 묶은 **상태 벡터(state vector) $\xi$**로 나타낸다.
- 단일 입구와 단일 출구를 가진 프로그램 계산 블록은 기계 상태를 변환하는 사상 $\xi' = f(\xi)$로 정의된다.
- 블록들이 분기 판정 소자 $\pi$(decision elements)로 연결된 임의의 단일 입구·단일 출구 플로우차트가 주어졌을 때, 분기점 $\beta$에서 출구까지의 전체 상태 변환을 나타내는 함수 $\phi[\xi]$는 후속 분기점 $\beta_1, \dots, \beta_n$에 대응하는 함수 $\phi_1, \dots, \phi_n$과 블록 함수 $f_1, \dots, f_n$을 이용해 다음과 같은 **상호 재귀 함수 방정식**으로 즉시 적을 수 있다(Figure 5, 6, PDF pp. 32–33):

$$\phi[\xi] = [p_1[\xi] \rightarrow \phi_1[f_1[\xi]]; \cdots; p_n[\xi] \rightarrow \phi_n[f_n[\xi]]]$$

이 정리는 루프와 임의 점프(`go to`)를 포함한 명령형 순서도가 상태 벡터 $\xi$를 인자로 전달하는 꼬리 재귀(tail-recursive) 형태의 상호 재귀 함수 체계와 수학적으로 완전히 동치임을 입증한다.

### c. 사사 및 초기 기여자 (§7, PDF pp. 33–34)

- **너새니얼 로체스터(N. Rochester)**: 처치의 $\lambda$-표기만으로는 재귀 함수를 명명하기에 불충분하다는 사실을 포착하고 `label`의 대안 해법을 발견했다.
- **C. Gerberick & H. L. Gelernter (IBM)**: 다른 프로그래밍 시스템(FLPL) 연구 과정에서 `cons`를 다른 함수들과 합성 가능한 서브루틴 형태로 구현하는 방식을 발명했다.
- **M.I.T. LISP 개발 그룹**: R. Brayton, D. Edwards, P. Fox, L. Hodes, D. Luckham, K. Maling, J. McCarthy, D. Park, **S. Russell**(§3f의 `apply`를 IBM 704 기계어 인터프리터 `APPLY`로 직접 구현한 주역).

---

## 위키 반영

이 원전은 [[S-표현과 eval은 왜 프로그램과 데이터의 경계를 지우는가]]의 핵심 일차 문헌이며, 다음 지식 문서들의 이론적·시스템적 근거로 작동한다:
- **기호 계산과 보편 기계**: [[기호 조작]], [[계산 가능성]], [[보편 튜링 기계]], [[처치-튜링 논제]], [[알론조 처치]]에서 람다 대수와 재귀 함수가 어떻게 구조화된 S-표현과 보편 평가기 `apply`/`eval`로 구체화되었는지 연결한다.
- **언어 설계와 프로그래밍 가능성**: [[프로그래밍 가능성]], [[프로그래밍 언어]], [[제어 구조]]에서 비엄격 조건식($p \rightarrow e$, Algol 60 `if-then-else`의 기원), 호모아이코니시티, 고계 함수(`maplist`, `diff`), 플로우차트와 재귀의 동치성을 설명한다.
- **하드웨어 아키텍처와 런타임 시스템**: [[IBM 704]], [[컴파일러]], [[스택]], [[서브루틴]]에서 36비트 워드 `address`/`decrement` 필드의 `car`/`cdr` 매핑, 인류 최초의 Mark & Sweep 가비지 컬렉션(`reclamation cycle`), 공용 푸시다운 리스트(`SAVE`/`UNSAVE`)를 통한 재귀 서브루틴 컴파일과 인터프리터 대비 60배 고속화를 다룬다.

## 관계

<!-- knowledge:relations:start -->
| 관계 | 대상 | 설명 | 근거 |
|---|---|---|---|
| enables | [[기호 조작]] | 원자 기호와 순서쌍(S-표현) 및 5대 원시 함수(atom, eq, car, cdr, cons)로 임의의 기호식과 수식·문장을 일관되게 조립·변환하는 계산 체계를 확립한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
| enables | [[프로그래밍 가능성]] | M-표현 함수 정의를 S-표현 데이터로 번역하는 호모아이코니시티와 apply/eval 인터프리터·재귀 컴파일러·자동 메모리 회수를 결합해 자기 기술적 프로그래밍과 고계 추상화를 실현한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
| responds_to | [[보편 튜링 기계]] | 테이프 상태표 부호화에 의존하던 보편 튜링 기계의 역할을 재귀 함수 방정식 apply/eval과 실제 인터프리터 루틴(APPLY)으로 재구성한다. | [[Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I]] |
<!-- knowledge:relations:end -->

## 출처

<!-- wiki-v2:evidence-start -->
### 근거 ID
- 없음
<!-- wiki-v2:evidence-end -->

- 로컬 보존본: `raw/McCarthy-60.pdf` (John McCarthy, 1995 Stanford $\text{\LaTeX}$ reprint with retrospective footnotes, pp. 1–34)
- 원문 서지: John McCarthy, *"Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I"*, *Communications of the ACM*, Vol. 3, No. 4, April 1960, pp. 184–195, [DOI: 10.1145/367177.367199](https://doi.org/10.1145/367177.367199)

## 관련 항목

- [[S-표현과 eval은 왜 프로그램과 데이터의 경계를 지우는가]] — 이 논문의 S-표현(호모아이코니시티), 보편 함수 `apply`/`eval`, 가비지 컬렉션, 푸시다운 스택 재귀 컴파일러가 어떻게 코드와 데이터의 경계를 허물고 현대 런타임의 원형을 세웠는지 분석한다.
- [[기호 조작]] — 수치 계산을 넘어 기호·수식·문장·프로그램 자체를 규칙에 따라 변환하는 컴퓨팅 관점.
- [[프로그래밍 가능성]] — 기계에 새 계산을 부여하고 자기 기술적 메타프로그래밍으로 추상화 수준을 높이는 능력.
- [[계산 가능성]] — 부분 함수, 조건식, 재귀 정의로 표현되는 계산 가능한 함수의 범위와 정지 문제를 다룬다.
- [[보편 튜링 기계]] — 다른 기계의 기술을 데이터로 받아 모사하는 튜링의 추상 기계와 `apply`/`eval`의 대응을 다룬다.
- [[알론조 처치]] — 이 논문이 §2e에서 채택한 형식(form)·함수(function) 구분과 $\lambda$-표기의 원천.
- [[IBM 704]] — 36비트 워드의 `address`/`decrement` 필드로 `car`/`cdr` 리스트 구조와 60배속 LISP 컴파일러를 구현한 대상 기계.
- [[스택]] — 재귀 함수 컴파일 시 임시 레지스터 충돌을 해결하기 위해 도입된 공용 푸시다운 리스트(`SAVE`/`UNSAVE`).
- [[컴파일러]] — 인터프리터(`APPLY`)와 공존하며 S-함수를 코어 메모리 기계어로 번역해 60배 고속화를 달성한 번역 계층.
- [[제어 구조]] — 비엄격 조건식 $(p_1 \rightarrow e_1, \dots)$과 명령형 플로우차트의 재귀 함수 환원(§6)을 다룬다.
