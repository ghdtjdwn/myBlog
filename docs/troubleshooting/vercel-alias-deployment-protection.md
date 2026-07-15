# 새 vercel.app alias가 로그인으로 리디렉션된 문제

날짜: 2026-07-15

## 기대와 실제

Production 배포를 `seongju.vercel.app`에 연결한 뒤 누구나 홈을 열 수 있어야 했다. 실제 HTTPS 검증에서는 모든 경로가 Vercel SSO로 302 리디렉션됐다.

## 영향과 증거

빌드와 GitHub CI는 성공했지만 새 alias에서는 블로그를 읽을 수 없었다. 같은 배포의 기존 Production 도메인은 HTTP 200이고 수동 `vercel.app` alias만 SSO 응답이어서 애플리케이션 라우팅 문제가 아님을 확인했다.

## 원인

프로젝트의 Deployment Protection이 `all_except_custom_domains`였다. Vercel이 자동 지정한 기존 Production 도메인은 공개 예외였지만, 수동으로 추가한 `seongju.vercel.app` alias는 보호 대상이었다.

## 해결과 검증

Vercel 프로젝트명을 `seongju`로 정리하고 SSO Deployment Protection을 해제한 뒤 최신 Production을 alias에 다시 연결했다. 공개 글은 자체 로그인이 필요 없고, 관리자 경로는 Keystatic의 GitHub OAuth로 별도 보호된다.

홈, 글 목록, 카테고리, OG 이미지와 관리자 화면은 HTTP 200, `/admin`은 `/keystatic`으로 리디렉션, 비공개 글은 404임을 실제 주소에서 확인했다. Preview도 공개될 수 있으므로 기존 `noindex, nofollow` 응답과 `robots.txt` 차단을 유지한다.
