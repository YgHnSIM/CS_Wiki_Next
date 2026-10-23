# CS Wiki Next

기존 CS Wiki의 **440개 문서와 원본은 그대로** 가져오고, 메타데이터·지식 연결·사이트 도구는 새로 구성하는 저장소다.

- **이전 저장소**: `C:\Vault\CS_Wiki` (백업: `C:\Vault\_backups\CS_Wiki_2026-10-24_0514`)
- **현재 단계**: Phase 1-B 배치 01–02 완료 (49 pages / 111 relations)
- **URL 계약**: `/docs/{id}/` 440개와 리디렉션 555개를 유지한다.

## 구조

```text
wiki/                 기존 Markdown 콘텐츠 (원본)
raw/                  기존 원본 자료
schema/               페이지 스키마 v3 + knowledge 초안
docs/architecture/    ADR과 Phase 1 설계
catalog/              노드·작품·어휘 Registry
contracts/            URL·리디렉션 계약
packages/knowledge/   새 지식 컴파일러
app/                  Astro 사이트 (예정)
```

## 핵심 계약

- `id`는 URL 계약이다. 바꾸지 않는다.
- `key`는 지식 그래프의 의미 ID다. `person:alan-turing` 형식.
- `relations`는 frontmatter가 canonical이다.
- 본문 `## 관계` 표는 generated block이며 직접 수정하지 않는다.
- 공개 지식 문서의 관계는 evidence를 가진다.
- 그래프는 빌드 시 생성되는 파생물이다. 런타임 DB를 두지 않는다.

## 문서

- [ADR 0001: 지식 그래프와 메타데이터 아키텍처](docs/architecture/0001-knowledge-model.md)
- [Phase 1 relations 마이그레이션](docs/architecture/phase-1-relations-migration.md)
- [relations 스키마](schema/knowledge/relations.schema.json)
- [Registry 스키마](schema/knowledge/registry.schema.json)

## 다음 단계

1. Phase 1-B 배치 03+: 나머지 313개 관계 문서를 20~30쪽 단위로 이관
2. generated block 전체 동기화
3. `packages/knowledge` 컴파일러와 parity 테스트
4. Astro 앱 구축
