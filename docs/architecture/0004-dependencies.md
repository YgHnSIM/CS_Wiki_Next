# Dependency policy

- **기준일**: 2026-10-24
- **정적 산출물**: Astro는 빌드 시에만 사용한다. `app/dist`는 JavaScript 런타임 의존성이 없는 정적 HTML/CSS/자산이다.
- **잠금 파일**: 루트 `package-lock.json`, 앱 `app/package-lock.json`을 커밋한다.
- **감사 명령**:

```bash
npm run security:audit
```

## 직접 의존성

### 루트

| 패키지 | 용도 |
|---|---|
| `yaml` | frontmatter·registry·reviews 파싱 |
| `ajv` | 페이지 JSON Schema 검증 |
| `ajv-formats` | `date`, `uri` 형식 검증 |

### app

| 패키지 | 용도 |
|---|---|
| `astro` | 정적 사이트 생성 |
| `markdown-it` | 문서 본문 Markdown 렌더링 |
| `@emnapi/core`, `@emnapi/runtime` | Linux wasm compiler optional dependency의 lock 일관성. `npm ci`가 Linux에서 누락 패키지를 요구하지 않도록 고정 |

## 원칙

- 새 의존성은 **빌드 도구**에만 추가한다. 브라우저 런타임 라이브러리는 원칙적으로 추가하지 않는다.
- `npm audit --audit-level=moderate`에서 0 vulnerabilities를 유지한다.
- major 업그레이드는 `knowledge:build`, `npm test`, `site:build`, `site:parity`, `site:links`를 모두 통과해야 한다.
- Astro·Markdown-it 업그레이드 후에는 현재 page build와 legacy route/search/sitemap 무결성을 다시 확인한다.
- Dependabot은 루트와 `app/`을 별도로 주간 검사한다.

## 2026-10-24 업그레이드

| 패키지 | 이전 | 현재 | 이유 |
|---|---|---|---|
| `ajv` | 8.17.1 | 8.20.0 | ReDoS |
| `yaml` | 2.8.1 | 2.9.1 | 깊은 중첩 Stack Overflow |
| `astro` | 5.x | 7.4.2 | 다수 XSS·SSRF·인증 우회 |
| `markdown-it` | 14.1.0 | 15.0.3 | ReDoS·quadratic complexity |

업그레이드 후 `npm audit`는 루트·앱 모두 **0 vulnerabilities**다.
