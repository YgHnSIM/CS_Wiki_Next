# ADR 0007: Accessibility and Performance

## 상태

채택 — 2026-10-24

## 배경

VS Code Workbench 셸, Command Palette, Trace 진행률이 추가되면서 키보드·스크린리더·인쇄 경로를 점검할 필요가 생겼다. 동시에 1,015페이지 정적 사이트의 HTML·CSS·검색 인덱스 크기를 측정했다.

## 접근성 변경

### Command Palette

- `role="dialog"` + `aria-labelledby`
- 검색 입력 `aria-controls`, `aria-autocomplete`, `aria-activedescendant`
- 결과 `role="option"`, 그룹 `role="group"` + `aria-label`
- 열기 버튼 `aria-haspopup="dialog"`, `aria-expanded`
- Tab/Shift+Tab 포커스 트랩
- Escape 닫기 후 이전 포커스 복귀

### Trace

- 진행률 `role="progressbar"` + `aria-valuenow`/`aria-valuetext`
- `읽음` 버튼에 문서 제목이 포함된 `aria-label`
- 단계 완료 시 label을 `읽음 취소`로 갱신

### 공통

- `main`, `nav`, `aside` landmark와 label 보강
- 검색 입력에 명시적 label
- `prefers-reduced-motion` 유지
- `--muted` 대비를 `#858585` → `#9a9a9a`로 조정
- 인쇄 시 activity bar·sidebar·tab·breadcrumb·status bar를 숨기고 본문을 종이 폭으로 펼침
- Markdown 이미지에 `loading="lazy"`와 `decoding="async"` 적용

## 성능 측정

| 항목 | 값 |
|---|---:|
| HTML 파일 | 1,022 |
| HTML 전체 | 16.64 MB |
| HTML 평균 | 16.7 KB |
| CSS | 27 KB |
| Base JS | 2.6 KB |
| 검색 인덱스 | 181 KB |

- 검색 인덱스는 Command Palette를 처음 열 때만 가져온다.
- 이미지 lazy loading은 기존에 적용되어 있었고 decoding async를 추가했다.
- 색인 397행은 `content-visibility:auto`로 초기 레이아웃 비용을 줄인다.

## 검증

Playwright로 390px 뷰포트에서 다음을 확인했다.

- 7개 대표 페이지 가로 overflow 없음
- `lang="ko"`, `h1` 1개, `main` 1개
- alt 없는 이미지 0
- 접근 가능한 이름 없는 버튼·링크 0
- 중복 id 0

## 남은 것

- Google Fonts 의존 (Noto Sans KR·IBM Plex Mono)
- 실제 스크린리더 수동 테스트
- Lighthouse CI 도입 여부
