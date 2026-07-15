# Work log

## 2026-07-15 — 기술 블로그 사전 감사와 전체 스펙

- 목표: 프로젝트와 인프라 경험을 근거로 블로그 기술·인프라 스택과 기록 방식을 결정한다.
- 변경: 작업 루트를 `/Users/seongju/myBlog`로 분리하고 기술 스펙, 인프라 ADR, 프로젝트 카탈로그, 에이전트 콘텐츠 규칙, 로컬 근거 맵을 작성했다.
- 조사: 로컬 프로젝트 8개 루트와 GitHub에서 접근 가능한 19개 저장소를 읽기 전용으로 감사했다.
- 결정: Astro 정적 빌드, GitHub Actions CI, Vercel Preview/Production, Git 기반 draft-first 콘텐츠를 선택했다. AWS·k3s·DB·CMS는 V1에서 제외했다.
- 보안: 공개 학습 저장소 한 곳의 하드코딩 자격증명 형태를 발견해 값 없이 로컬 remediation 문서를 만들고 블로그 수집 대상에서 제외했다. 수정과 회전은 아직 수행하지 않았다.
- 검증: 공식 Astro, Node.js, Vercel, Cloudflare, GitHub Pages, AWS 정적 호스팅 문서를 대조했다. 사이트 빌드 검증은 아직 시작하지 않았다.
- 전달: 로컬 문서 단계. Git 초기화, 커밋, 원격 저장소, CI, Preview, Production은 아직 수행하지 않았다.
- 다음: 프로젝트 콘텐츠 스키마와 초안 생성기를 구현하고, 모든 프로젝트의 공개 프로젝트 엔트리를 만든 뒤 사이트 빌드를 검증한다.

## 2026-07-15 — TypeScript 7 설치 호환성 실패

- 목표: 고정한 Astro 7 도구 체인을 설치해 첫 빌드를 시작한다.
- 실제: npm이 `typescript@7.0.2`와 `@astrojs/check@0.9.9`의 peer dependency 충돌로 설치를 중단했다.
- 원인: 검사기의 허용 범위가 `^5.0.0 || ^6.0.0`이고 TypeScript 7은 아직 포함되지 않는다.
- 결정: `--force`나 `--legacy-peer-deps`를 사용하지 않고 허용 범위의 최신 `typescript@6.0.3`으로 고정했다.
- 검증: npm registry의 해당 패키지 peer metadata를 확인했다. 재설치와 빌드는 다음 단계에서 수행한다.

## 2026-07-15 — 사이트 V1 구현과 기록 파이프라인

- 목표: 감사한 모든 프로젝트를 기여 경계와 함께 사이트에 연결하고, 새 작업을 곧바로 안전한 기술 글 초안으로 남길 수 있게 한다.
- 변경: Astro 7 정적 사이트, 프로젝트·글·결정·장애 Content Collections, 14개 프로젝트 엔트리, 프로젝트/글/소개/RSS/sitemap/robots 라우트, 반응형 편집 디자인과 이미지 최적화를 구현했다.
- 기록: PostGIS 검색, ARM64 GitOps 배포, 결정론적 AI 채점 글 3개와 ARM64 장애 기록 1개를 `draft: true`로 작성했다. RedbeanOverflow는 사용자 역할 근거가 부족해 계속 비공개 draft로 유지했다.
- 자동화: `new-record.mjs`가 네 종류의 기록을 항상 draft로 생성하며 기존 파일을 덮어쓰지 않는다. `verify-build.mjs`는 필수 산출물, canonical, 문서 언어와 draft 격리를 검사한다.
- 인프라: GitHub Actions에 Node 24 기반 빌드/검증과 gitleaks 검사를 선언했다. Vercel Analytics와 Speed Insights를 연결했지만 원격 저장소와 배포는 아직 만들지 않았다.
- 디자인: 사이트 팔레트와 시스템·데이터 주제에 맞는 1200×630 소셜 카드 한 장을 생성해 확인하고 기본 Open Graph 이미지로 연결했다.
- 실제 실패: TypeScript 7 peer 충돌은 6.0.3 고정으로 해결했다. 하위 경로 빌드의 URL 결합 오류는 base 정규화로 해결하고 `docs/troubleshooting/base-path-url-join.md`에 재현과 예방을 남겼다.
- 검증: npm 설치 감사 0 vulnerabilities. `astro check` 0 errors/0 warnings/0 hints. 프로덕션 17페이지 빌드와 21개 텍스트 산출물 검사, 초안 미리보기 21페이지, `/myBlog` 하위 경로의 링크·canonical·소셜 이미지 검사를 완료했다.
- 전달: 독립 Git 저장소를 초기화하고 GitHub 로그인 `ghdtjdwn`, 프로필 이름과 계정 ID 기반 noreply 이메일을 저장소 로컬 커밋 신원으로 설정했다. staged diff 검사와 gitleaks에서 노출 0건을 확인한 뒤 초기 로컬 커밋으로 전달한다. 원격 저장소 생성, push, Preview와 Production은 외부 변경이므로 수행하지 않았다.

## 2026-07-15 — GitHub 공개와 Vercel 배포 준비

- 목표: 검증된 사이트를 공개 저장소와 관리형 정적 호스팅에 안전하게 연결한다.
- 전달: `ghdtjdwn/myBlog` 공개 저장소를 생성하고 `main`을 push했다. Vercel 계정에 `seongju-engineering-notes` 프로젝트를 생성하고 로컬 프로젝트를 연결했다.
- 변경: Astro 프레임워크, `npm ci`, 정적 `dist` 출력을 `vercel.json`에 명시했다. Preview에는 `noindex, nofollow`와 `robots.txt` 전체 차단을 적용했다.
- 검증: 프로덕션 빌드와 Preview 빌드를 각각 실행해 Preview 검색 차단, 프로덕션 draft 격리와 21개 정적 문서 검사를 확인했다.
- 다음: 변경을 commit/push하고 GitHub CI를 확인한 뒤 실제 Production 배포, canonical URL, analytics와 공개 응답을 검증한다.
