# 하위 경로 배포에서 내부 URL이 붙어버린 문제

- 발생일: 2026-07-15
- 상태: 해결 및 회귀 검증 완료
- 영향: `BASE_PATH=/myBlog` 빌드에서 일부 내부 링크와 소셜 이미지 URL이 `/myBlogprojects/`, `/myBlogog-card.png`처럼 잘못 생성됐다.

## 기대와 실제

`/myBlog/projects/`가 생성되어야 했지만 `withBase()`가 환경값 뒤에 슬래시가 있다고 가정해 경로를 그대로 이어 붙였다. 루트 경로 `/` 빌드에서는 드러나지 않고 하위 경로 배포에서만 재현됐다.

## 재현과 근거

다음 조건으로 정적 빌드한 뒤 `dist/index.html`의 `href`, canonical, `og:image`를 확인했다.

```sh
SITE_URL=https://example.com BASE_PATH=/myBlog npm run build
```

Astro가 CSS 자산에는 정상 base를 적용했지만 프로젝트 helper가 만든 링크에는 구분 슬래시가 빠져, 원인이 호스팅이나 라우터가 아니라 문자열 결합임을 확인했다.

## 해결과 대안

`astro.config.mjs`와 `withBase()`에서 base path가 정확히 하나의 `/`로 끝나도록 정규화했다. 호출부마다 슬래시를 넣는 대안은 누락 가능성이 크고 URL 규칙이 분산되므로 사용하지 않았다.

## 검증과 예방

- `/myBlog/projects/` 내부 링크 확인
- `https://example.com/myBlog/` canonical 확인
- `https://example.com/myBlog/og-card.png` 확인
- base 없는 `/projects/`, `/writing/`, `/about/` 링크가 없음을 확인
- 정식 루트 경로 빌드와 draft 격리 검사를 다시 수행

배포 경로 동작을 변경할 때는 루트 `/`와 하위 경로를 모두 빌드한다.
