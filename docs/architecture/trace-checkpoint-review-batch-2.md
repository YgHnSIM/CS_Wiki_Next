# Trace Checkpoint Review — Batch 2

## 범위

- `failure-recovery` (6)
- `llm-serving` (6)
- `software-reuse` (7)

총 **19개 체크포인트**를 검수했다.

## 결과

- 유지: 13
- 수정: 6
- 폐기: 0
- evidence 추가: 1

| Trace | Step | 판정 | 내용 |
|---|---:|---|---|
| failure-recovery | 1 | ok | 회색 장애의 부분적·관찰자 의존적 성질 |
| failure-recovery | 2 | revise | 장애 원인을 하드웨어·소프트웨어·네트워크·운영자 오류로 정렬 |
| failure-recovery | 3 | ok | 가용성과 복구의 분리 |
| failure-recovery | 4 | ok | 부분 실패와 전역 상태 판정 불가 |
| failure-recovery | 5 | ok | 비동기 네트워크에서 오탐·미탐 절충 |
| failure-recovery | 6 | ok | 회색 장애 → 메타스테이블 피드백 |
| llm-serving | 1 | ok | Transformer의 병렬 계산과 전역 의존성 |
| llm-serving | 2 | revise | KV cache·배치를 단정하던 답변을 attention 메모리 이동·시퀀스 길이로 한정하고 I/O 분석 근거 추가 |
| llm-serving | 3 | ok | prefill의 병렬성, decode의 순차성 |
| llm-serving | 4 | ok | KV cache의 메모리 비례 |
| llm-serving | 5 | ok | 배칭과 큐잉·SLO 절충 |
| llm-serving | 6 | revise | 비용 항목을 에너지·가속기 시간·유휴 용량·실패 요청으로 정렬 |
| software-reuse | 1 | ok | EDSAC 카탈로그의 재사용 단위 |
| software-reuse | 2 | revise | 입력/출력 대신 호출 규약·복귀 주소로 한정 |
| software-reuse | 3 | ok | 카탈로그의 문서·검색·계약 기능 |
| software-reuse | 4 | revise | 모듈화를 책임 단위와 변경 격리로 설명 |
| software-reuse | 5 | ok | 정보 은닉과 안정된 인터페이스 |
| software-reuse | 6 | ok | API의 호출 규약·비용·전제 조건 |
| software-reuse | 7 | revise | “재사용 단위가 커지고 분산”이라는 일반화를 호출 규약·비용·오류 계약 문서화로 한정 |

## Evidence 변경

- `llm-serving` step 2: `analysis:transformer-io-bottleneck` 추가
  - attention의 메모리 접근과 시퀀스 길이가 병목을 만든다는 분석 근거

## 남은 배치

- Batch 3: text-encoding, database-transactions, ai-infrastructure, programming-languages, concurrency-ordering (33)

## 검증

- `traces:check`: 11 traces / 70 steps / 475 minutes / coverage 28.3% / budget pass
- `site:build`: 1,016 pages
- `site:parity`: 440 docs / 555 redirects / 397 search / 417 sitemap
- `site:links`: 0 broken
- `search:eval`: Top-1 100% / Top-3 100% / MRR 1.000
