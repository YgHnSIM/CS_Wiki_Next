# ADR 0005: Reading Traces

## 상태

채택 — 2026-10-24

## 배경

기존 사이트의 “학습 경로”는 문서 목록을 초급·중급·고급으로 나누는 방식에 가까웠다. CS Wiki의 콘텐츠는 강의보다 **질문 → 원본 → 개념 → 분석**의 연결이 중심이므로, 정적 목록형 경로는 이 구조를 살리지 못한다.

## 결정

문서 목록 대신 **질문에서 출발하는 Reading Trace**를 도입한다.

- Trace는 하나의 질문, 기대 결과, 5~6단계의 읽기 경로로 구성한다.
- 각 단계는 `source`·`concept`·`analysis`·`entity` 역할을 가진다.
- 각 단계에는 **왜 이 문서를 읽는지**와 **체크포인트**가 있다.
- 체크포인트의 답은 실제 문서 key를 근거로 가진다.
- Trace는 `catalog/traces.json`이 canonical이다.
- `/traces/`와 `/traces/{id}/`는 정적 페이지로 생성한다.
- 진도는 서버 계정 없이 브라우저 `localStorage`에만 저장한다.

## 데이터 계약

```json
{
  "schema_version": 1,
  "traces": [
    {
      "id": "performance",
      "title": "...",
      "question": "...",
      "outcome": "...",
      "audience": "...",
      "minutes": 45,
      "prerequisites": ["concept:computing-capability"],
      "steps": [
        {
          "document": "source:ref-039",
          "role": "source",
          "why": "...",
          "checkpoint": {
            "question": "...",
            "answer": "...",
            "evidence": ["source:ref-039"]
          }
        }
      ],
      "branches": []
    }
  ]
}
```

JSON Schema: `schema/trace.schema.json`.

## 검증

`npm run traces:check`가 다음을 검사한다.

- trace id 중복 없음
- 모든 step 문서가 존재하고 public
- step role과 문서 kind 일치
- 한 trace 안에서 step 문서 중복 없음
- 체크포인트 evidence가 존재하고 public
- prerequisite·branch 문서가 존재하고 public
- steps 3~8개, minutes 5~180분

CI에서 `knowledge:check`·`knowledge:schema` 다음에 실행한다.

## UI

- Workbench 사이드바 `TRACES`
- Command Palette의 `Trace: ...` 항목
- 홈의 Reading Trace strip
- 문서 페이지 `TRACES` rail: 이 문서가 포함된 trace 역링크
- Trace 페이지: `OUTCOME`·`ROUTE`·`CHECKPOINT`·`BRANCHES`
- 상태는 `읽음` 버튼으로 표시하고 `localStorage`에 저장

## URL

- `/traces/`
- `/traces/computation/`
- `/traces/performance/`
- `/traces/unix-legacy/`
- `/traces/failure-recovery/`
- `/traces/llm-serving/`
- `/traces/software-reuse/`
- `/traces/text-encoding/`
- `/traces/database-transactions/`
- `/traces/ai-infrastructure/`

기존 `/docs/{id}/`와 리디렉션 계약은 변경하지 않는다.

## 결과

- 9 traces, 56 steps, 390 minutes
- coverage: 55/244 public knowledge (22.5%), 84 referenced documents
- single-evidence steps 3, undated steps 22
- 2 guides: 이 위키를 읽는 법, 근거와 관계 읽기
- sitemap 402 → 415 URLs
- search records 397 유지 (Trace는 문서 검색과 분리)
- 페이지 1,001 → 1,014

## 하지 않은 것

- 초급·중급·고급 난이도 분류
- 배지·스트릭 같은 게이미피케이션
- Trace를 위한 기존 문서 본문 재작성
- 서버 기반 진도 저장
- 그래프 기반 동적 경로 탐색 (후속)
