# Work log

## 2026-07-16 — ssuAI 제품 화면 공개 자료 정리

- 목표: 최신 ssuAI 홈·학사·도서관·캠퍼스·서비스 연결 화면을 기술 블로그와 GitHub 문서에서
  같은 제품 근거로 확인할 수 있게 정리한다. 챗봇 화면은 최신 캡처를 받은 뒤 별도로 추가한다.
- 블로그: 홈 화면을 ssu 플랫폼의 대표 이미지로 교체하고, 한·영 프로젝트 레코드에 학사·도서관·
  캠퍼스·서비스 연결 화면과 대체 텍스트·설명을 추가했다. 프로젝트 화면 배열을 콘텐츠 스키마,
  Keystatic 편집기, 새 레코드 생성기와 한·영 상세 페이지에 연결해 이후 화면도 데이터로 추가할 수 있다.
- GitHub 문서: ssuAI 한·영 README의 기존 홈·학사·도서관 이미지를 최신 캡처로 교체하고 캠퍼스와
  서비스 연결 화면을 추가했다. GitHub 프로필 README에는 ssuAI 저장소의 동일 자산을 참조하는
  5장 미리보기를 배치해 이미지 중복을 피했다.
- 검증: 블로그 `npm test`에서 11개 카테고리와 11개 한·영 프로젝트 관계, Astro 31개 파일 오류·
  경고·힌트 0, 69개 생성 문서와 draft 격리가 통과했다. ssuAI는 lint·typecheck·153개 테스트와
  Next.js production build가 통과했다. GitHub API의 GFM 렌더에서도 프로필 이미지 5개를 확인했다.
- 화면 확인: 로컬 한·영 ssu 플랫폼 상세는 각각 200이며 대표 이미지와 갤러리 4개를 렌더했다.
  화면이 없는 다른 프로젝트에는 빈 갤러리가 생성되지 않았다. 인앱 브라우저가 제공되지 않아 실제
  데스크톱·모바일 viewport 캡처 검수는 수행하지 못했다.
- 원격 검증: 구현 commit `7119b79`를 draft PR #9에 올렸다. GitHub Actions run
  `29466115059`의 validate·secret-scan과 Vercel Preview deployment `5466904864`가 성공했다.
  Preview 한·영 상세는 각각 200이며 홈·학사·도서관·캠퍼스·서비스 연결 이미지 5개와
  `X-Robots-Tag: noindex`를 확인했다.
- GitHub 전달: ssuAI PR #242는 CI·gitleaks·Vercel Preview 통과 후 commit `d1c6e1d`로 main에
  병합했다. 공개 raw 경로의 이미지 5개가 모두 200 `image/png`로 응답한다. 제품 화면은 프로젝트
  README에만 두고, 프로필에 중복 추가했던 이미지 블록은 정정 PR #9의 commit `01b8163`으로 제거했다.
  GitHub API의 실제 GFM 렌더에서 프로필 이미지 참조 0개와 프로젝트 README 참조 5개를 확인했다.
- 전달: 블로그는 draft PR #9만 갱신했다. Production 병합·배포와 본진 alias 변경은 명시적 승인
  전까지 수행하지 않는다.

## 2026-07-16 — 프로젝트 공개 목록 정리

- 목표: Cham Domi에 노출된 과거 내부 식별자를 제거하고, 공개 목록에서 제외 요청된 교육 게임
  프로젝트와 연결 초안을 현재 블로그에서 완전히 제거한다.
- 변경: Cham Domi의 한·영 콘텐츠 ID를 `cham-domi`로 바꾸고 요약과 본문에서 과거 식별자 설명을
  삭제했다. 교육 게임의 한·영 프로젝트 레코드와 연결된 미발행 한국어 글을 삭제하고 프로젝트
  카탈로그도 현재 목록에 맞췄다.
- 검증: `npm run verify:content`, `npm run check`, `npm test`가 통과했다. 11개 카테고리와 11개
  한·영 프로젝트 관계, Astro 30개 파일 오류·경고·힌트 0, 69개 생성 문서와 draft 격리를 확인했다.
- 경로 확인: 생성 산출물에서 제거 대상 식별자와 이름이 없음을 검색했다. 로컬 HTTP에서 한·영
  프로젝트 목록과 Cham Domi 상세는 200, 제거한 한·영 프로젝트 경로와 연결 글 경로는 404였다.
- 검수 제한: 인앱 브라우저가 연결되지 않아 데스크톱·모바일 viewport 시각 검수는 수행하지 못했다.
  생성 HTML과 로컬 HTTP 응답의 링크·문구·상태까지만 확인했다.
- 원격 검증: commit `904979b`를 기존 draft PR #9 브랜치에 올렸다. GitHub Actions run
  `29463784440`의 validate·secret-scan과 Vercel Preview deployment `5466453681`이 성공했다.
  Ready Preview에서도 한·영 목록·Cham Domi 상세 200, 제거 경로 404와 검색 차단을 확인했다.
- 전달: draft PR #9만 갱신했다. Production 병합·배포와 본진 alias 변경은 수행하지 않았다.

## 2026-07-15 — RTF 프로젝트 인덱스 기반 근거 중심 블로그 보완

- 목표: 로컬 프로젝트 인덱스를 현재 블로그와 다시 대조하고, 빠진 목록을 늘리는 데 그치지 않고
  공개 범위·기여 귀속·기술 글의 검증 근거가 실제 화면과 CI에서 확인되게 한다.
- 조사: RTF의 공식 프로필과 9개 프로젝트 루트가 기존 소개·프로젝트에 모두 대응함을 확인했다.
  기술 수치와 성과는 RTF가 아니라 각 저장소의 현재 코드, ADR, 작업 로그, troubleshooting과 CI를
  근거로 다시 감사했다.
- 콘텐츠: PostGIS 만료 제보 인덱스, ARM64 OCI/GitOps 전달, 세 서비스의 서버 검증 신원 경계,
  UIA→OCR 폐쇄루프 키오스크 자동화 글 4편을 한·영으로 발행 상태로 작성했다. `ssu-platform`을
  네 구성요소가 드러나는 캠퍼스 AI 플랫폼으로 교정하고 관련 ADR 원문을 직접 연결했다.
- 공개 범위와 사실 교정: RTF에서 공개 제외한 학습 아카이브의 한·영 콘텐츠와 카탈로그 행을 현재
  트리에서 제거했다. 기존 공개 Git 이력은 자동 재작성하지 않았다.
- 화면과 기록 파이프라인: 프로젝트 상세에 기여·팀·공개 근거 경계를, 글 상세에 직접 역할·근거·검증·
  일반화하지 않는 범위를 한·영으로 표시했다. 빈 카테고리는 목록에서 숨기고 프로젝트 번호를 1–12로
  정리했다. 새 project/post 명령은 같은 slug의 한·영 초안 쌍을 만들며, 공개 글은 양 언어가 함께
  발행돼야 관계 검증을 통과한다. 기존 generator의 필수 schema 필드 누락과 두 번째 파일 생성 실패 시
  첫 파일이 남는 문제도 수정했다. 빌드 검증은 소스 frontmatter에서 전체 공개·초안 경로를 동적으로 만든다.
- 원본 검증: Macro 안전 코어 69/69, ssuAI agent proxy 17/17, ssuAgent security 24/24,
  ssuMCP `McpSelfDogfoodTests` 12/12를 실제 실행해 통과했다. 원본 저장소 작업 트리는 바뀌지 않았으며,
  기존 ssuMCP 로컬 main의 ahead 2/behind 9 상태도 그대로 보존했다.
- 블로그 검증: `npm run verify:content`, `npm run check`, `npm test`가 통과했다. 11개 카테고리와
  12개 한·영 프로젝트 관계, Astro 30개 파일 오류·경고·힌트 0, 71개 생성 문서와 초안 격리를
  확인했다. 새 generator를 임시 디렉터리에서 실행해 한·영 project/post 4개 파일과 필수 필드를
  확인하고 두 번째 쓰기 실패 때 첫 파일이 rollback되는 것도 재현했다. `npm audit --omit=dev`는 알려진
  취약점 0건이었다. 로컬 HTTP에서 한·영 홈·글·프로젝트 7개 경로 200과 근거 섹션·skip link·nav를 확인했다.
- 독립 검수: 두 차례 diff review에서 인증 principal 소유 thread의 IDOR 보장 범위, PostGIS k6
  threshold와 수동 EXPLAIN의 책임, 한·영 draft 상태, 생성기 원자성, 전체 경로 검증과 작은 근거
  label 대비를 교정했다.
- 검수 제한: 인앱 브라우저가 연결되지 않아 실제 데스크톱·모바일 viewport와 캡처 기반 시각 검수는
  수행하지 못했다. 반응형 CSS와 생성 HTML의 semantic·keyboard 구조까지만 확인했다.
- 원격 검증: 구현 commit `d522589`를 올린 draft PR #9에서 CI run `29413730095`의 validate와
  secret-scan, Vercel Preview `dpl_DZpJAFSFZFs9WVmMTHgoX9GtzD6Y`가 통과했다. Ready preview에서
  한·영 홈·글·프로젝트 7개 경로, RSS 6/6, 공개 제외 경로 404와 보안 header를 다시 확인했다.
- 전달: `feat/evidence-first-blog-refresh`를 draft PR #9로 전달했다. Production merge·배포와 본진
  alias 변경은 명시적 확인 전까지 수행하지 않는다.

## 2026-07-15 — 공개 연락처 이메일 동기화

- 목표: GitHub 프로필과 Astro 본진에서 사용하는 공개 연락처를
  `seongjuice999@gmail.com`으로 통일한다.
- 변경: 사이트 metadata/contact 링크와 프로필·정리 문서의 이메일 표시를 새 주소로 맞췄다.
- 검증: 기존 주소의 공개 문서 잔존 여부를 검색하고, RTF 형식과 새 주소를 확인한다.
- 전달: GitHub 계정 공개 이메일과 프로필 README 변경을 함께 배포한다.

## 2026-07-15 — 성공한 Production과 오래된 본진 alias 불일치

- 목표: GitHub와 Vercel의 성공 상태뿐 아니라 실제 제출 주소가 최종 콘텐츠를 제공하는지
  확인하고, 같은 배포 누락이 반복되지 않게 한다.
- 실제: commit `1d21d01`의 main CI와 Vercel Production은 성공했지만
  `seongju.vercel.app`은 약 6시간 전 배포를 계속 가리켰다. 공개 페이지에는 그늘이 운영 중,
  Macro가 좌표 기반 구조로 남아 있었고 최신 Production 고유 URL에는 새 내용이 있었다.
- 원인: 본진 주소가 Vercel 프로젝트 설정의 자동 production domain이 아니라
  `vercel alias set`으로 특정 배포에 붙인 수동 `.vercel.app` alias였다.
- 결정: 짧은 본진 주소를 유지하고, 승인된 최종 Production마다 Ready 배포를 확인한 뒤 alias를
  명시적으로 승격하고 실제 콘텐츠를 검사한다. GitHub에 Vercel token을 추가하는 자동화는
  비밀 관리와 운영 복잡성에 비해 배포 빈도가 낮아 선택하지 않았다.
- 기록: 재현, 증거, 대안, 해결과 회귀 방지를
  `docs/troubleshooting/vercel-primary-alias-stale.md`에 남겼다.
- 검증: PR #6의 validate·secret-scan·Vercel Preview와 main CI run
  `29403084393`이 성공했다. merge commit `346cfff`의 Vercel Production
  `dpl_2TNKJhzXKHqMPwkik8YmbAtEQT9C`가 Ready임을 확인하고 alias를 승격한 뒤,
  한·영 홈·Macro·Geuneul 6개 경로의 HTTP 200, 최신 완료 상태, canonical과 HSTS·MIME
  sniffing 방지·frame 차단·referrer 정책을 실제 본진에서 확인했다.
- 전달: 운영 절차를 PR #6으로 main에 병합하고 `seongju.vercel.app`을 검증한 Production으로
  승격했다. 실패 시 되돌릴 이전 deployment URL과 ID도 보존했다.

## 2026-07-15 — CI action Node 24 전환

- 목표: GitHub-hosted runner의 Node 20 폐기 경고를 제거하고 포트폴리오 CI의 공급망 참조를
  현재 지원되는 action runtime으로 올린다.
- 근거: PR #3 병합 뒤 main run `29401145044`는 성공했지만 checkout과 gitleaks action이
  Node 20 강제 실행 경고를 남겼다. 각 공식 저장소의 최신 release와 `action.yml`을 확인했다.
- 변경: `actions/checkout` 7.0.0, `actions/setup-node` 7.0.0,
  `gitleaks/gitleaks-action` 3.0.0의 전체 commit SHA를 고정했다. 세 action 모두 Node 24를
  사용하며 gitleaks v3는 입출력·동작 변경 없이 runtime만 이전하는 release다.
- 검증: 세 release commit의 `action.yml`이 Node 24를 사용하는 것을 확인했다. workflow YAML
  parsing과 `npm test`의 관계·Astro·63개 산출물 검사가 통과했다. Pull request #4의 validate,
  secret-scan과 Vercel Preview가 성공했다. Post-merge run `29401556468`도 두 job이 통과했고
  양쪽 annotation과 Node 20 경고가 모두 0건이었다.
- 전달: pull request #4를 `main`에 병합했고 Vercel Production 배포가 성공했다.

## 2026-07-15 — Macro 의미 기반 자동화 완료 반영

- 목표: 좌표 기반 해커톤 아카이브로 남아 있던 포트폴리오 설명을 실제 완료된 의미 기반
  자동화 코드, 안전 경계와 검증 결과에 맞춘다.
- 변경: 한·영 프로젝트 페이지를 UIA 우선 탐색, OCR와 명시적 좌표 fallback, 동일 창 고정,
  전이·postcondition·장바구니 delta 검증, SQLite 인계 상태와 결제 정지 경계로 갱신했다.
  2024 시연 좌표 실패와 YOLO 대안을 현재 설계 결정에 연결하고 법적 동기와 적합성 보장을
  구분했다.
- 포트폴리오: Macro를 세 번째 대표 프로젝트로 올리고 홈의 진행형 제목을 완료 프로젝트도
  포괄하는 표현으로 교정했다. 이후 프로젝트 순번은 한·영에서 같은 순서로 이동했다.
- 기여 경계: Macro 클라이언트와 공개 완성 범위를 개인 근거로 표시하되 Backend·Frontend
  원구현과 초기 키오스크 구현은 팀원 소유로 유지했다.
- 검증: `npm test`에서 11개 카테고리와 13개 한·영 프로젝트 관계, Astro 30개 파일
  오류·경고·힌트 0, 한·영 63개 생성 문서와 draft 격리가 통과했다. 공개 근거 링크와 로컬
  한·영 페이지는 200, npm audit는 취약점 0건이었다. 독립 리뷰에서 원본 커밋 21개 파일 중
  `macro_pkg/`가 20개라는 수치 오류를 찾아 교정했고 다른 P0/P1은 없었다.
- 전달: pull request #3을 `main`에 병합했다. GitHub Actions run `29401145044`의 validate와
  secret-scan, Vercel Production이 성공했다. 한·영 홈·Macro·Geuneul 여섯 공개 경로와
  canonical은 200이고 기존 보안 헤더를 유지했다.

## 2026-07-15 — 그늘 완료 상태 정정

- 목표: 완료된 그늘 프로젝트가 포트폴리오에서 계속 운영·개선 중인 작업으로 보이는 불일치를
  바로잡고 한국어·영문 페이지의 상태와 설명을 일치시킨다.
- 변경: 프로젝트 상태를 `complete`로 전환하고 개발 종료, 공개 데모·저장소의 결과 확인 목적,
  완료 이후 데이터 최신성과 상시 가용성의 한계를 명시했다. coursework의 대표 프로젝트 설명도
  운영 중인 ssu 플랫폼과 완료된 그늘을 구분하도록 교정했다.
- 검증: `npm test`에서 11개 카테고리와 13개 한영 프로젝트 관계, Astro 30개 파일 검사
  오류·경고·힌트 0, 한영 63개 생성 문서와 draft 격리가 통과했다.
- 전달: Macro 갱신과 함께 pull request #3으로 병합하고 같은 CI·Production 배포와 한·영
  Geuneul 공개 경로 200을 확인했다.

## 2026-07-15 — GitHub·블로그 포트폴리오 본진 통합

- 목표: GitHub 프로필과 `seongju.vercel.app` 중 어느 URL을 제출해도 같은 대표 작업, 역할 경계, 자격과 연락처를 찾을 수 있게 하고 기존 GitHub Pages 포트폴리오를 대체한다.
- 결정: GitHub는 짧은 이력서형 색인, 블로그는 문제·설계·검증·한계를 설명하는 사례집, 프로젝트 저장소는 원본 근거로 역할을 나눴다. 변동하는 commit·PR 합계는 성과 지표에서 제거하고 이 결정과 대안을 ADR-0005에 기록했다.
- 프로필: 소개 페이지에 숭실대학교 컴퓨터학부, 공식 영문명을 병기한 자격 2종, 이메일과 solved.ac를 한·영으로 추가했다. 구조화 데이터에도 같은 교육·자격·연락 채널을 연결하고 일반 페이지가 `ProfilePage`로 표시되던 범위를 실제 About 페이지로 한정했다.
- 프로젝트: 공개 제외 대상인 비공개 학습 아카이브의 URL을 제거했다. Cham Domi 표기와 역할 경계를 한·영 페이지에 통일했다. Macro는 2024 해커톤 산출물로 교정하고 주문 전체 사전 검증, 실행 직렬화, 긴급 중단 latch, 수동 결제 경계와 테스트·CI를 반영했다.
- 공개 범위: 기여 귀속이 확인되지 않은 비공개 협업 프로젝트의 초안·이름·원문 링크를 현재 공개 트리에서 제거했다. 기존 Git 이력은 자동 재작성하지 않고, 기존 Pages 포트폴리오는 새 두 진입점의 전달이 끝난 뒤 비활성화·아카이브한다.
- 검증: `npm test`에서 11개 카테고리와 13개 한영 프로젝트 관계, Astro 30개 파일 검사 오류·경고·힌트 0, 한영 63개 생성 문서와 draft 격리가 통과했다. `npm audit --omit=dev` 취약점은 0건이었다. 인앱 브라우저가 제공되지 않아 이번 변경의 시각 검증은 정적 산출물·HTML 구조 검사로 제한했다.
- 전달: Macro PR #1·#2와 Cham Domi 팀 문서 PR #3, GitHub 프로필 PR #3, 블로그 PR #1을
  병합했다. 블로그 `main` CI run `29385816471`의 validate·secret-scan과 Vercel Production이
  성공했고 `seongju.vercel.app`을 해당 배포에 연결했다. 한·영 홈·소개·Macro 사례·sitemap은
  200, 공개 제외한 학습 아카이브와 비공개 협업 초안 경로는 404, canonical·hreflang·구조화 데이터·보안
  헤더를 공개 응답에서 확인했다. 학습 아카이브는 비공개로 전환해 익명 API·웹 요청이 404임을
  확인했다. 구 Pages 저장소는 은퇴 안내 PR #1을 병합하고 Pages 삭제 응답 204와 기존 사이트
  404를 확인한 뒤 아카이브했다.

## 2026-07-15 — Keystatic Production 로그인 500 조사와 설정 절차 보완

- 목표: `/admin`의 `Login with GitHub`가 HTTP 500을 반환한 원인을 확인하고 재현 가능한 초기 설정 경로를 만든다.
- 원인: Production에 `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`이 등록되기 전에 로그인 API가 실행됐다. 공개 정적 페이지에는 영향이 없고 관리자 함수만 실패했다.
- 추가 실패와 수정: 일회성 로컬 GitHub mode 플래그를 `process.env`로 읽어 설정 화면 hydration이 `process is not defined`로 중단됐다. 비밀이 아닌 플래그만 `PUBLIC_KEYSTATIC_GITHUB_MODE`와 `import.meta.env`로 옮기고 `npm run dev:cms-setup` 명령을 추가했다.
- 기록: 재현, 함수 로그 근거, 원인, 대안, 해결 절차와 남은 위험을 `docs/troubleshooting/keystatic-production-missing-oauth-config.md`에 기록했다. README에 Keystatic·검색엔진의 남은 수동 설정을 명시했다.
- 검증: 로컬 `/keystatic/setup` HTTP 200과 기존 hydration 오류 제거를 확인했다. GitHub App 생성과 실제 Production 로그인은 사용자 결정에 따라 다음 세션으로 보류했다.
- 검증: 로컬 설정 서버를 종료했다. `npm test`에서 관계 검증, Astro 30개 파일 검사 오류·경고 0, 한영 63개 생성 문서와 draft 격리가 통과했고 npm audit 취약점은 0건이었다.
- 전달: 구현 commit `d9cdc35`를 `main`에 push했고 GitHub Actions run `29383564060`과 Vercel Production이 성공했다. `seongju.vercel.app`을 최신 배포에 연결하고 한국어·영문 홈 200, `/admin`의 Keystatic redirect와 `noindex` 헤더를 확인했다. CMS OAuth는 위 수동 설정을 완료할 때까지 보류 상태다.

## 2026-07-15 — 영문 사이트와 검색 소유권 인증 준비

- 목표: 해외 독자와 채용 담당자가 같은 프로젝트 근거를 읽을 수 있게 하고 Google·네이버 검색 등록을 안전하게 준비한다.
- 결정: 런타임 자동 번역 대신 `/en/` 별도 정적 원문, self canonical과 한국어·영어·x-default `hreflang`을 채택했다. 결정과 대안은 ADR-0004에 기록했다.
- 콘텐츠: 공개·초안 상태와 수치·URL·기여 경계를 보존한 14개 프로젝트 영문 원문과 공개 글 2개의 영문 원문을 추가했다. 공개 제외 학습 아카이브와 기여 귀속 미확인 협업 프로젝트는 영어에서도 draft로 격리했다.
- 기능: 영문 홈·소개·프로젝트·글·카테고리·RSS, 언어 전환, 영어 날짜·분류·상태 문자열을 구현했다. Keystatic에 영어 글·프로젝트 CRUD를 추가했다.
- 검색: Google과 네이버의 HTML 태그 값을 Vercel 환경 변수로 주입하는 메타 태그를 추가했다. 실제 검색엔진 계정 등록은 인앱 브라우저가 제공되지 않아 소유자 로그인과 확인이 남았다.
- 검증: 11개 카테고리와 14개 한영 프로젝트 쌍의 관계를 검사했다. `npm test`에서 Astro 30개 파일 검사 오류·경고 0, 한영 63개 생성 문서, canonical·hreflang·문서 언어와 draft 격리가 통과했다.
- 전달: commit `a7cefb2`를 `main`에 push했고 GitHub Actions CI와 Vercel Production이 성공했다. `seongju.vercel.app` alias를 최신 배포에 연결하고 영문 홈·대표 글·사이트맵 200, 영문 draft 404, canonical·hreflang·보안 헤더를 공개 응답에서 확인했다.

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
- 기록: PostGIS 검색, ARM64 GitOps 배포, 결정론적 AI 채점 글 3개와 ARM64 장애 기록 1개를 `draft: true`로 작성했다. 기여 귀속 미확인 협업 프로젝트는 사용자 역할 근거가 부족해 비공개 draft로 유지했다.
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

## 2026-07-15 — Production 배포와 공개 검증

- 목표: Git 기반 자동 배포와 실제 공개 사이트를 연결하고 운영 기준을 확인한다.
- 전달: Vercel 프로젝트를 `ghdtjdwn/myBlog`에 연결하고 Production을 `https://seongju-engineering-notes.vercel.app`에 배포했다. Web Analytics와 Speed Insights를 실제 프로젝트에서 활성화하고 Production·Preview의 `SITE_URL`을 등록했다.
- 검증: Vercel 원격 빌드에서 npm 감사 0 vulnerabilities, Astro 검사 0 errors/0 warnings/0 hints, 17페이지 정적 빌드가 성공했다. 공개 주소의 HTTP 200, TLS/HSTS, canonical, Open Graph 이미지, sitemap, robots 허용과 draft URL 404를 직접 확인했다.
- CI: 최신 `c58b4aa` GitHub Actions의 build와 secret-scan이 모두 성공했다. 최초 push의 gitleaks 실패는 root commit의 존재하지 않는 부모 범위가 원인이었고 `docs/troubleshooting/initial-gitleaks-root-commit.md`에 기록했다.
- 보안: 모든 응답에 MIME sniffing 방지, frame 차단, referrer 제한과 camera·microphone·geolocation 차단 헤더를 선언했다. CSP는 Analytics endpoint를 정확히 확정하지 않은 상태에서 임의 적용해 관측을 깨뜨리지 않도록 보류했다.
- 최종 확인: commit `4640f73`의 Git 연결 Production 배포와 GitHub CI가 모두 성공했다. 공개 alias에서 canonical과 네 보안 헤더를 다시 확인했고 저장소에 설명, 홈페이지와 Astro·TypeScript·portfolio 토픽을 설정했다.
- 남은 외부 작업: 개인 도메인 선택·구매와 DNS 연결, Google Search Console과 네이버 서치어드바이저의 소유권 인증은 사용자 확인이 필요하다.

## 2026-07-15 — 글 중심 재설계와 Git 기반 관리자

- 목표: 홍보형 포트폴리오 화면을 실제 기술 블로그로 바꾸고, 브라우저에서 글·카테고리·공개 상태를 지속적으로 관리할 수 있게 한다.
- 조사: 현재 개발 블로그의 글 중심 정보 구조와 Keystatic·Astro·Vercel 공식 문서를 대조했다. 별도 에이전트가 CMS 배포 구성을 검토하고, 다른 에이전트가 로컬 프로젝트 미디어의 무결성·공개 가능성·개인정보를 감사했다.
- 디자인: 대형 랜딩 문구, 수치 강조, CTA와 카드형 마케팅 구성을 제거했다. 날짜·제목·요약 중심 글 목록, 카테고리 탐색, 좁은 읽기 폭, 단순 프로젝트 목록과 시스템 다크 모드로 재구성했다. 대표 프로젝트는 홈에서 세 개만 보인다.
- 콘텐츠 관리: Keystatic GitHub mode를 추가해 `/admin`에서 글·프로젝트·카테고리·ADR·트러블슈팅 CRUD와 초안 전환이 가능하게 했다. 공개 페이지는 정적 생성하고 관리자와 OAuth API만 Vercel Function으로 분리했다.
- 데이터 모델: `categories` 컬렉션과 네 개의 초기 카테고리를 추가하고 모든 글에 필수 관계를 연결했다. `verify-content-links.mjs`가 카테고리·프로젝트의 끊어진 참조를 CI 전에 차단한다.
- 공개 기록: 이번 구현과 실제 배포 검증만을 근거로 첫 글 `기술 블로그를 정적 페이지와 Git 기반 관리자로 나눈 이유`를 작성해 공개했다. 기존 프로젝트 글 세 개는 사실 대조가 남아 있어 계속 초안으로 유지한다.
- 이미지: 기존 프로젝트 PNG 네 개가 모두 CRC 손상임을 확인했다. 공개 저장소와 사용자 기여가 확인된 그늘·ssuAI 원본만 교체하고, 팀 자산 권리나 공개 승인이 불명확한 이미지는 노출에서 제외했다. 상세 이미지 강제 크롭도 제거했다. 새 1200×630 소셜 카드를 현재 주소와 블로그 제목으로 연결했다.
- 인프라: `seongju.vercel.app` alias를 확보하고 canonical·환경 설정 기본값을 이 주소로 변경했다. Astro Vercel 어댑터와 관리자 전용 React를 추가했다. `path-to-regexp` 보안 권고는 호환되는 6.3.0 override로 해결해 npm audit 0건을 확인했다.
- 실제 실패: Vercel 어댑터가 정적 산출물을 `dist/client`로 옮기면서 기존 검증기가 실패했다. 검증 루트를 실제 배포 레이아웃으로 변경하고 `docs/troubleshooting/vercel-adapter-output-layout.md`에 원인과 회귀 방지를 기록했다.
- 문서: 기술 스펙, README, ADR-0001을 현재 구조와 맞추고 Keystatic 선택 및 대안을 ADR-0002로 기록했다.
- 검증: 콘텐츠 관계 검증, `astro check`, 정적 페이지·초안 격리 검증과 npm audit가 통과했다. 로컬 `/keystatic`, 홈, 글 목록은 HTTP 200을 확인했다. 독립 CMS 리뷰에서 배포 게이트와 검색 차단 누락을 찾아 Vercel도 `npm test`를 실행하고 관리자·API 응답에 `X-Robots-Tag: noindex, nofollow`를 적용했다. 실제 `vercel build`에서도 재설치, 전체 테스트, 함수 번들링과 정적 자산 복사가 성공했다.
- 전달: commit `f093d40`을 `main`에 push했고 GitHub Actions CI와 Vercel Production이 성공했다. Vercel 프로젝트를 `seongju`로 정리하고 `https://seongju.vercel.app`을 최신 Production에 연결했다. Deployment Protection이 수동 alias를 SSO로 막은 실제 운영 실패는 보호 설정을 바로잡아 해결하고 troubleshooting 문서에 기록했다. 공개 홈·글·카테고리·OG는 200, draft는 404, `/admin`은 관리자 화면으로 이동하며 `/keystatic`은 200과 `noindex` 응답을 확인했다. GitHub App 최초 인증만 사용자 작업으로 남는다.

## 2026-07-15 — 채용 근거 중심 프로젝트·소개·기록 구조 확장

- 목표: 모든 프로젝트 상세를 진행 상태와 검증 근거가 보이는 사례로 확장하고, 최신 백엔드·AI·플랫폼 채용 공고가 요구하는 역량에 맞춰 소개와 글 탐색 구조를 개선한다.
- 조사: 별도 에이전트가 14개 프로젝트의 로컬 코드·README·docs·Git 이력을 다시 대조했고, 다른 에이전트가 당근·토스·카카오·네이버 등 공식 채용 원문 10개와 GitHub 공식 문서를 조사했다. 반복 역량은 문제 정의, API·DB·분산 시스템 기본기, 배포·관측·장애 대응, 운영 가능한 AI, 선택·실패·기여를 설명하는 문서화였다.
- 프로젝트: 14개 엔트리에 활동 유형, 구체적인 현재 상태, 기록 운영 방식과 공개 원문 링크를 추가했다. 각 본문을 문제, 직접 기여, 구조, 검증, 현재 단계, 한계와 다음 작업 중심으로 확장했다. 운영 중·완료·프로토타입·기획·아카이브를 한국어로 명확히 표시한다.
- 사실 교정: ssu 플랫폼의 변동하는 합산 테스트·ADR 수치를 제거하고 네 번째 `ssu-ai-service` 저장소를 연결했다. Cham Domi의 확인되지 않은 Docker Compose 설명을 제거했다. UNITHON은 사용자 커밋에서 확인되는 `macro_pkg` 20개 파일의 launcher·설정·패키징·통합만 직접 기여로 표시했다. 공개 제외 학습 아카이브와 기여 귀속 미확인 협업 프로젝트는 각각 보안 정리와 기여 귀속 확인 전까지 draft로 격리했다.
- 카테고리: 직무 역량과 활동 유형을 분리했다. 직무 역량은 백엔드·아키텍처, 인프라·운영, 데이터·성능, AI 시스템, 설계·개발 과정, 트러블슈팅·신뢰성이고 활동 유형은 개인 프로젝트, 공모전·대회, 동아리·연합활동, 팀·학교 프로젝트, 학습·기타다. 글은 주 역량 하나와 선택적 활동 유형 하나를 가진다.
- 소개: 추상적인 열정 대신 ssu 플랫폼, 그늘과 AI guardrail에서 확인 가능한 백엔드 설계, 운영, 데이터 성능과 AI 책임 경계를 연결했다. 목표 직무를 신입·주니어 백엔드, 플랫폼, AI 백엔드로 명시하고 팀에서 일하는 기준을 근거 중심으로 다시 작성했다.
- 기록 정책: 저장소의 Issues·Projects, 작업 로그, ADR와 troubleshooting을 원본으로 유지하고 블로그에는 면접 가치가 높은 사례만 해설형 글로 선별하며 프로젝트 상세가 두 위치를 색인하는 3단 구조를 채택했다. `docs/ENGINEERING_RECORDS.md`와 ADR-0003에 규칙과 대안을 기록했다.
- 공개 기록: GitHub와 블로그의 역할을 바로 이해할 수 있도록 `작업 로그는 GitHub에, 해설은 블로그에 남기는 이유`를 근거·한계와 함께 공개 글로 작성했다.
- 검증: 독립 리뷰에서 비공개 학습 아카이브 격리, UNITHON 기여 범위, 그늘 지표·기록 설명과 coursework 언어 매핑을 교정했다. 11개 카테고리와 14개 프로젝트 관계·종류 검증, Astro 21개 파일 검사에서 오류·경고 0, 33개 생성 문서와 draft 격리, npm audit 0건을 확인했다. Git·CI·Production 전달은 다음 단계에서 진행한다.
