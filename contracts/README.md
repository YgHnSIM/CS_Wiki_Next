# URL contract

`routes.json`은 기존 사이트의 URL 계약을 고정한다.

- 440개 문서의 `/docs/{id}/`
- 555개 리디렉션
- 공개 범위(`public`/`unlisted`)

이 파일은 수동으로 수정하지 않는다. 새 사이트의 라우트가 기존 사이트와 같은지 비교하는 기준으로 사용한다.

```json
{
  "schema_version": 1,
  "source_commit": "3b30fec",
  "page_count": 440,
  "redirect_count": 555
}
```
