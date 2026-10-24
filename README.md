# CS Wiki Next

기존 CS Wiki의 **440개 문서와 원본은 그대로** 가져오고, 메타데이터·지식 연결·사이트 도구는 새로 구성하는 저장소다.

- **이전 저장소**: `C:\Vault\CS_Wiki` (백업: `C:\Vault\_backups\CS_Wiki_2026-10-24_0514`)
- **공개 사이트**: https://yghnsim.github.io/CS_Wiki_Next/
- **현재 단계**: Phase 3 코어 + 필수 기능 + Reading Trace 9개/Guide 2개 배포 (Astro 1,014 pages, 440 docs, 555 redirects, 397 search records, 415 sitemap URLs)
- **디자인**: “VS Code Workbench” 셸 — activity bar, explorer, tabs, status bar, man-page 본문, command palette
- **의존성**: `npm audit` 0 vulnerabilities (루트·app)
- **URL 계약**: `/docs/{id}/` 440개와 리디렉션 555개를 유지한다.

## 구조

```text
wiki/                 기존 Markdown 콘텐츠 (원본)
raw/                  기존 원본 자료
schema/               페이지 스키마 v3 + knowledge 초안
docs/architecture/    ADR과 Phase 1 설계
catalog/              노드·작품·어휘 Registry + traces.json
contracts/            URL·리디렉션 계약
packages/knowledge/   새 지식 컴파일러
app/                  Astro 사이트
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
- [Graph contract v1](docs/architecture/0002-graph-contract.md)
- [Astro app contract](docs/architecture/0003-astro-app.md)
- [Dependency policy](docs/architecture/0004-dependencies.md)
- [ADR 0005: Reading Traces](docs/architecture/0005-reading-traces.md)
- [ADR 0006: Search Quality](docs/architecture/0006-search-quality.md)
- [Phase 1 relations 마이그레이션](docs/architecture/phase-1-relations-migration.md)
- [relations 스키마](schema/knowledge/relations.schema.json)
- [Registry 스키마](schema/knowledge/registry.schema.json)

## 다음 단계

1. CI·Pages 첫 배포 확인
2. 콘텐츠 품질: 연도 미상·고아·단일 근거
3. 검색 품질 측정 후 개선
4. Reading Trace 추가 및 경로 탐색기 검토
