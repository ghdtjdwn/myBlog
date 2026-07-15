# Vercel 어댑터 도입 뒤 정적 산출물 검증 실패

날짜: 2026-07-15

## 기대와 실제

Keystatic 관리자 경로를 위해 Astro Vercel 어댑터를 추가한 뒤에도 정적 페이지 검증이 통과해야 했다. Astro 빌드와 prerender는 성공했지만 `verify-build.mjs`는 모든 필수 파일이 없다고 보고했다.

## 증거와 원인

빌드 로그에는 정적 라우트 생성 뒤 `Copying static files to .vercel/output/static`이 표시됐다. 어댑터가 없는 빌드는 정적 파일을 `dist/`에 두지만, Vercel 어댑터 빌드는 서버 엔트리와 정적 자산을 분리해 정적 파일을 `dist/client/`에 둔다. 검증기는 기존 출력 계약을 그대로 가정하고 있었다.

## 해결과 검증

검증 루트를 `dist/client`로 변경했다. 필수 라우트, 초안 격리, canonical과 문서 언어 검사는 그대로 유지해 검증 범위를 줄이지 않았다.

회귀 방지는 `npm test`가 Vercel 어댑터 빌드 직후 실제 client 산출물을 검사하도록 하는 것이다. 어댑터를 제거하거나 출력 모드를 바꿀 때는 검증 루트도 함께 검토한다.
