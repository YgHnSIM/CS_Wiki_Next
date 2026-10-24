# Trace Checkpoint Review — Batch 1

## 범위

- `computation` (6)
- `performance` (6)
- `unix-legacy` (6)

총 **18개 체크포인트**를 검수했다.

## 방법

1. `npm run traces:review`로 `output/trace-checkpoints.md` 생성
2. 각 단계의 질문·정답·근거 문서 요약을 대조
3. 정답이 근거보다 강하거나, 근거에 없는 주장을 포함하면 수정
4. 문서 자체의 존재·public 여부는 `traces:check`가 별도로 검증

## 결과

- 유지: 12
- 수정: 6
- 폐기: 0
- evidence 교체: 0

| Trace | Step | 판정 | 내용 |
|---|---:|---|---|
| computation | 1 | revise | “유한 시간 안에 출력”은 계산 가능한 수의 정의를 지나치게 단순화. “각 자리를 유한한 규칙으로 계산”으로 수정 |
| computation | 2 | revise | 테이프·상태만 언급해 기호·헤드를 누락. 구성 요소를 모두 열거 |
| computation | 3 | ok | 보편 기계의 기술 부호화·흉내내기 설명이 근거와 일치 |
| computation | 4 | ok | 처치-튜링 논제를 정리·정의와 구분 |
| computation | 5 | revise | “근사·확률적 방법”은 계산 가능성 문서의 직접 근거가 아님. 입력 제한·환원으로 약화 |
| computation | 6 | ok | 물리적 구현과 계산 가능성 정의를 분리 |
| performance | 1 | ok | 메모리 장벽을 프로세서·메모리 격차로 설명 |
| performance | 2 | ok | 캐시의 평균 지연 감소 설명이 근거와 일치 |
| performance | 3 | ok | 시간적·공간적 지역성 설명이 근거와 일치 |
| performance | 4 | ok | 클럭·IPC·메모리·병렬성·전력 제약 설명 |
| performance | 5 | revise | “병렬성·가속기·SW 최적화”는 분석의 초점과 어긋남. 전력 효율·활성 면적·작업 적합성·환산 계산량/에너지로 수정 |
| performance | 6 | revise | “부하 변동” 대신 분석이 직접 말하는 팬아웃·기한·가용성·품질·자원 비용으로 수정 |
| unix-legacy | 1 | ok | 파일·프로세스·셸·파이프·시스템 호출 설명 |
| unix-legacy | 2 | ok | C 커널·도구와 시스템 호출 추상화의 관계 |
| unix-legacy | 3 | ok | C의 하드웨어 제어와 이식성 |
| unix-legacy | 4 | ok | C 이식성이 소스 무수정을 뜻하지 않는다는 설명 |
| unix-legacy | 5 | ok | 관찰 가능한 동작·인터페이스 고정과 플랫폼 의존 격리 |
| unix-legacy | 6 | revise | “가장 중요한 재사용 단위”는 가치 판단. 질문을 “어떤 재사용 단위를 낳았는가”로 바꾸고 시스템 호출·도구·라이브러리 개발 환경으로 한정 |

## 남은 배치

- Batch 2: failure-recovery, llm-serving, software-reuse (19)
- Batch 3: text-encoding, database-transactions, ai-infrastructure, programming-languages, concurrency-ordering (33)

## 검증

- `traces:check`: 11 traces / 70 steps / 475 minutes / coverage 28.3% / budget pass
- `site:build`: 1,016 pages
- `site:parity`: 440 docs / 555 redirects / 397 search / 417 sitemap
- `site:links`: 0 broken
- `search:eval`: Top-1 100% / Top-3 100% / MRR 1.000
