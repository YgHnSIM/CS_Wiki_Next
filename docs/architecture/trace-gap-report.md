# Trace Gap Report

## 현재 상태

- traces: 12
- steps: 77
- public knowledge: 244
- unique step documents: 76 (31.1%)
- not in any trace step: 185

`unassigned`는 Trace step·prerequisite·branch 어디에도 없는 문서다. `prerequisite`와 `branch`는 참조되지만 step은 아니다.

## 상위 gap

| # | 연결 | 문서 | 상태 |
|---:|---:|---|---|
| 1 | 19 | 컴퓨팅 능력이란 무엇인가 | prerequisite |
| 2 | 17 | 프로그래밍 가능성 | unassigned |
| 3 | 13 | 컴파일러 | unassigned |
| 4 | 12 | 결함 허용 | unassigned |
| 5 | 12 | 라이브러리 | unassigned |
| 6 | 12 | 병렬 확장성 | unassigned |
| 7 | 12 | 저장 프로그램 컴퓨터 | unassigned |
| 8 | 12 | LLM 가중치 양자화 | unassigned |
| 9 | 12 | StableHLO·MLIR·ABI 경계 | unassigned |
| 10 | 11 | 개발자 생산성 | unassigned |
| 11 | 11 | 도메인 특화 가속기 | branch |
| 12 | 11 | 원격 프로시저 호출 | unassigned |
| 13 | 11 | 입력 검증 | unassigned |
| 14 | 11 | 혼합 정밀도 | unassigned |
| 15 | 10 | 계산 복잡도 | unassigned |

## 해석

- `컴퓨팅 능력이란 무엇인가`는 연결 19, evidence 49로 가장 중심적인 문서지만 **prerequisite로만** 쓰인다.
- `프로그래밍 가능성`, `컴파일러`, `저장 프로그램 컴퓨터`, `병렬 확장성`은 여러 Trace의 전제인데 step이 아니다.
- 이 gap은 “문서가 없다”가 아니라 **읽기 경로에 입구가 없다**는 뜻이다.

## 다음 후보

1. **Foundation Trace**
   - 컴퓨팅 능력 → 프로그래밍 가능성 → 저장 프로그램 컴퓨터 → 컴파일러 → 라이브러리
   - 단, 다수가 undated라 quality budget을 의도적으로 갱신해야 함
2. **AI 시스템 경계 Trace**
   - LLM 가중치 양자화 → 혼합 정밀도 → StableHLO·MLIR·ABI 경계
3. **네트워크·RPC Trace**
   - 원격 프로시저 호출 → 멱등성 → 표현·배치·계약

## 재생성

```bash
npm run traces:gaps
```

출력:

- `output/trace-gaps.json`
- `output/trace-gaps.md`
