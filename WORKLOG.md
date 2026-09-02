# Work log

## 2026-09-03 — 공개 콘텐츠 모델을 기술 기록 중심으로 정리

- 목표: 공개 화면과 콘텐츠 관리 모델을 글·프로젝트 탐색이라는 현재 사이트 목적에 맞춘다.
- 변경: About를 사이트 목적과 개발 원칙 중심으로 구성했다. 글은 기술 주제와 활동 유형으로 분류하고, 홈은 `order` 기준 프로젝트 목록을 표시한다. 사용하지 않는 콘텐츠 메타데이터와 오래된 기획 문서를 정리하고 한·영 문구를 기술 기록 관점으로 맞췄다.
- 영향 범위: Astro 페이지, Content Collections, Keystatic 스키마, 콘텐츠 관계 검사기, 한·영 Markdown·설계 문서.
- 검증: `npm test`에서 11개 카테고리와 11개 한·영 프로젝트 관계, Astro 32개 파일 진단 0건, production build, 생성 문서 143개와 draft 격리를 확인했다. `npm audit --audit-level=moderate`는 취약점 0건, `git diff --check`는 오류 0건이었다.
- 전달: [pull request #33](https://github.com/ghdtjdwn/myBlog/pull/33)의 정확한 head commit `577bbb10a61bee6c823664cca90ce6b4937e4ca8`을 `main`에 반영했다. [post-merge CI](https://github.com/ghdtjdwn/myBlog/actions/runs/33676437130)의 `validate`와 `secret-scan`이 통과했고, 같은 commit의 Vercel Production이 `READY`가 된 뒤 `seongju.vercel.app`을 해당 deployment에 연결했다. 한국어·영어 홈과 About, 글 목록, 프로젝트 목록은 모두 HTTP 200을 반환했다.

## 2026-09-03 — 기본 브랜치와 의존성 보안 설정

- 목표: 검증되지 않은 직접 변경과 알려진 의존성 취약점이 기본 브랜치에 들어오는 경로를 줄인다.
- 변경: GitHub `main` ruleset에서 브랜치 삭제와 force-push를 차단하고, pull request와 `validate`·`secret-scan`을 필수로 설정했다. Dependabot 취약점 알림과 자동 보안 수정도 활성화했다.
- 검증: GitHub rules API에서 `deletion`, `non_fast_forward`, `pull_request`, `required_status_checks` 규칙과 두 필수 check를 확인했다. Dependabot alerts API는 열린 알림 0건을 반환했다.
- 전달: 저장소 설정에 적용했다.

## 2026-09-02 — 프런트엔드 의존성 보안 갱신

- 목표: lockfile의 알려진 취약점을 제거하고 같은 수준의 advisory가 다시 들어오지 않게 한다.
- 변경: Astro를 `7.2.10`으로 갱신하고 transitive dependency를 다시 잠갔다. CI에 `npm audit --audit-level=moderate` 게이트를 추가했다.
- 검증: Node 24와 npm 11에서 clean install, 취약점 0건, 콘텐츠 관계 검사, Astro 진단 0건, production build와 draft 격리를 확인했다.
- 전달: pull request 검증 뒤 `main`과 Vercel Production에 반영했다.

## 2026-07-18 — ssuAI 화면과 LMS 흐름 문서화

- 목표: ssuAI의 LMS 내보내기와 모바일 화면을 프로젝트 문서에 연결하되 개인 값은 공개하지 않는다.
- 변경: LMS 인증·조회·내보내기 흐름과 모바일 홈·챗봇·학사 화면을 한·영 페이지에 추가했다. 실명과 개인 학사·재정 값은 픽셀 모자이크 처리하고 이미지 메타데이터를 제거했다.
- 검증: 블로그 전체 테스트, ssuAI lint·typecheck·187개 테스트와 production build를 실행했다. GitHub CI와 Vercel Preview·Production 성공, 공개 한·영 페이지와 이미지 응답을 확인했다.
- 전달: 검증된 commit을 `main`과 `seongju.vercel.app`에 반영했다.

## 2026-07-17 — 서비스 아키텍처와 공개 이미지 정리

- 목표: 서비스 경계와 운영 구조를 원본 문서와 함께 읽을 수 있게 하고 화면의 개인 값을 비식별화한다.
- 변경: ssuAI·ssuAgent·ssuMCP·Geuneul 아키텍처 이미지를 프로젝트 페이지에 연결하고 한·영 설명을 추가했다. ssuAI 공개 화면은 개인 값만 모자이크한 최종본으로 교체했다.
- 검증: 원본 이미지 해시, Astro 검사, production build, 반응형 이미지 산출물, 공개 페이지·원본 링크 응답을 확인했다.
- 전달: GitHub CI와 Vercel Production 성공 뒤 공개 alias를 검증된 deployment에 연결했다.

## 2026-07-15 — 정적 사이트와 Git 기반 콘텐츠 관리 도입

- 목표: 글, 프로젝트, ADR과 트러블슈팅을 정적 페이지로 제공하고 브라우저 편집과 Git 변경 이력을 연결한다.
- 변경: Astro·TypeScript, Content Collections, Keystatic GitHub mode, 한·영 라우트, RSS·sitemap·robots와 draft 격리를 구현했다. 공개 페이지는 정적 생성하고 관리자와 OAuth API만 Vercel Function으로 분리했다.
- 검증: 콘텐츠 관계 검사, Astro 진단 0건, production·preview build, draft 비노출과 보안 헤더를 확인했다. Vercel adapter 출력 경로와 수동 alias가 최신 Production을 따르지 않는 문제는 각각 검증기와 release 절차를 수정해 해결했다.
- 전달: GitHub Actions와 Vercel Production을 연결하고 `seongju.vercel.app`의 한국어·영어 페이지, canonical, sitemap, RSS와 관리자 검색 차단을 확인했다.
