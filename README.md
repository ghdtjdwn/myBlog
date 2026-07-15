# myBlog

홍성주의 포트폴리오와 기술 기록을 한 곳에서 제공하는 정적 사이트입니다.

공개 사이트: [seongju-engineering-notes.vercel.app](https://seongju-engineering-notes.vercel.app)

## 원칙

- 결과보다 문제, 판단, 대안, 검증 근거를 함께 기록한다.
- 공개 글은 Git 커밋, 테스트, ADR, 작업 로그처럼 확인 가능한 자료에 근거한다.
- 비공개 저장소와 로컬 문서는 자동 공개하지 않는다.
- 새 기록은 항상 draft로 시작하고 Preview에서 검토한 뒤 발행한다.

## 기술 구성

- Astro 7 정적 빌드
- TypeScript strict
- Markdown/MDX Content Collections
- GitHub Actions CI
- Vercel Preview/Production
- Vercel Web Analytics와 Speed Insights

전체 결정은 [기술 스펙](docs/TECH_SPEC.md)과 [ADR-0001](docs/adr/0001-stack-and-hosting.md)에 기록합니다.

## 작업 상태

프로젝트·GitHub 전수 감사, 기술 스펙, 사이트 V1, draft-first 기록 도구와 CI 구성을 완료했습니다. 실제 완료 내역과 검증 결과는 [WORKLOG.md](WORKLOG.md)에 기록합니다.

## 로컬 실행

```sh
nvm use
npm ci
npm run dev
```

정식 산출물은 `npm test`로 타입·콘텐츠·빌드·draft 격리를 함께 검사합니다. 검증 전 초안을 로컬에서 보려면 `SHOW_DRAFTS=true npm run dev`를 사용합니다.

새 기록은 항상 비공개 초안으로 생성됩니다.

```sh
npm run new:record -- post post-slug "글 제목"
```

배포 canonical은 기본적으로 현재 Vercel Production URL을 사용합니다. 개인 도메인을 연결하면 Vercel의 Production·Preview `SITE_URL`과 `astro.config.mjs` 기본값을 함께 변경합니다. 하위 경로 배포가 필요할 때만 `BASE_PATH`를 설정합니다.
