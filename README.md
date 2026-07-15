# myBlog

홍성주의 프로젝트 경험과 기술 기록을 글 중심으로 제공하는 개발 블로그입니다.

공개 사이트: [seongju.vercel.app](https://seongju.vercel.app)

영문 사이트: [seongju.vercel.app/en](https://seongju.vercel.app/en/)

## 원칙

- 결과보다 문제, 판단, 대안, 검증 근거를 함께 기록한다.
- 공개 글은 Git 커밋, 테스트, ADR, 작업 로그처럼 확인 가능한 자료에 근거한다.
- 비공개 저장소와 로컬 문서는 자동 공개하지 않는다.
- 새 기록은 항상 draft로 시작하고 Preview에서 검토한 뒤 발행한다.

## 기술 구성

- Astro 7 정적 빌드
- TypeScript strict
- 한국어·영어 Markdown/MDX Content Collections
- Keystatic GitHub CMS
- GitHub Actions CI
- Vercel Preview/Production
- Vercel Web Analytics와 Speed Insights

전체 결정은 [기술 스펙](docs/TECH_SPEC.md), [ADR-0001](docs/adr/0001-stack-and-hosting.md), [ADR-0002](docs/adr/0002-git-based-cms.md)에 기록합니다.

## 작업 상태

프로젝트·GitHub 전수 감사, 기술 스펙, 사이트 V1, draft-first 기록 도구와 CI 구성을 완료했습니다. 실제 완료 내역과 검증 결과는 [WORKLOG.md](WORKLOG.md)에 기록합니다.

## 로컬 실행

```sh
nvm use
npm ci
npm run dev
```

정식 산출물은 `npm test`로 타입·콘텐츠·빌드·draft 격리를 함께 검사합니다. 검증 전 초안을 로컬에서 보려면 `SHOW_DRAFTS=true npm run dev`를 사용합니다.

프로젝트별 작업 로그·ADR·트러블슈팅 원문과 블로그를 연결하는 기준은 [엔지니어링 기록 운영 방식](docs/ENGINEERING_RECORDS.md)을 따릅니다. 진행 중 작업은 GitHub Issues/Projects에서 추적하고, 완료 사실은 저장소 문서에, 면접에서 설명할 가치가 있는 사례는 블로그 글로 다시 구성합니다.

새 기록은 항상 비공개 초안으로 생성됩니다.

```sh
npm run new:record -- post post-slug "글 제목"
```

## 글 관리

로컬 개발 서버에서는 [`/keystatic`](http://127.0.0.1:4321/keystatic)을 열면 별도 로그인 없이 관리 화면을 사용할 수 있습니다. 한국어·영어 글과 프로젝트, 카테고리·ADR·트러블슈팅을 만들고 수정하거나 삭제할 수 있습니다.

공개 사이트에서는 [`/admin`](https://seongju.vercel.app/admin)이 관리 화면으로 연결됩니다. GitHub 인증을 완료하면 편집 내용이 저장소에 커밋되고 Vercel이 새 버전을 배포합니다. 새 글과 프로젝트는 기본적으로 `비공개 초안`이며, 이 항목을 해제해야 공개됩니다.

배포 관리자 최초 설정에는 Keystatic용 GitHub App 생성과 저장소 설치, Vercel 환경 변수 등록이 한 번 필요합니다. 비밀값은 저장소나 문서에 기록하지 않습니다.

영문은 자동 번역 API가 아니라 `/en/` 아래의 별도 원문으로 관리합니다. 같은 slug의 한국어·영어 프로젝트를 함께 유지하며 모든 공개 페이지는 canonical과 `hreflang` 한국어·영어·기본 URL을 제공합니다.

Google Search Console과 네이버 서치어드바이저의 HTML 태그 소유권 인증값은 각각 Vercel의 `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION` 환경 변수로 설정합니다.

배포 canonical은 기본적으로 현재 Vercel Production URL을 사용합니다. 개인 도메인을 연결하면 Vercel의 Production·Preview `SITE_URL`과 `astro.config.mjs` 기본값을 함께 변경합니다. 하위 경로 배포가 필요할 때만 `BASE_PATH`를 설정합니다.
