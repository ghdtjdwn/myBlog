# Keystatic Production 로그인 500

## 맥락과 기대 동작

`/admin`에서 GitHub로 로그인하면 Keystatic이 GitHub App OAuth를 시작하고, 저장소 쓰기 권한이 있는 사용자에게 관리 화면을 제공해야 한다.

## 실제 동작과 영향

2026-07-15 Production의 `Login with GitHub`가 `/api/keystatic/github/login`에서 HTTP 500을 반환했다. 공개 블로그에는 영향이 없었지만 브라우저 CMS에 로그인할 수 없었다.

## 재현과 증거

1. `https://seongju.vercel.app/admin`에 접속한다.
2. `Login with GitHub`를 누른다.
3. OAuth 리디렉션 대신 HTTP 500이 발생한다.

Vercel 함수 로그는 `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`이 없어서 GitHub storage API 초기화가 중단됐음을 표시했다. Production 환경에는 당시 `SITE_URL`만 등록되어 있었다.

## 검토한 가설

- Keystatic API route 또는 Vercel Function 번들 오류: `/keystatic`은 정상 응답했고 로그가 함수까지 도달해 제외했다.
- GitHub callback URL 불일치: OAuth 요청을 만들기 전에 실패했으므로 직접 원인이 아니다.
- GitHub App 미설치: 후속 단계에서 문제가 될 수 있지만 이번 500은 필요한 서버 설정이 없는 시점에 발생했다.

## 원인

Production에 GitHub App을 만들고 OAuth 환경 변수를 등록하기 전에 일반 로그인 경로를 사용했다. Keystatic의 GitHub storage mode는 로그인 API를 만들 때 세 서버 변수를 필수로 요구한다.

## 해결안과 선택 이유

GitHub App manifest 흐름은 생성된 client secret을 로컬 `.env`에 기록하므로 일회성 로컬 GitHub mode에서 실행한다. `npm run dev:cms-setup`이 로컬 설정 화면을 열도록 구성하고 다음 순서를 사용한다.

1. `/keystatic/setup`에서 Production URL을 입력해 GitHub App을 생성한다.
2. 앱을 `ghdtjdwn/myBlog`에만 설치한다.
3. 생성된 네 환경 변수를 값 노출 없이 Vercel Production과 Preview에 등록한다.
4. Production을 재배포하고 OAuth callback과 저장소 접근을 확인한다.

Production 설정 화면에서 직접 생성하는 대안은 serverless 함수의 로컬 `.env` 쓰기가 영속적이지 않으므로 사용하지 않는다. GitHub App을 수동 구성하는 방법은 권한과 callback 누락 가능성이 커서 선택하지 않았다.

초기 로컬 설정 명령은 처음에 Node의 `process.env`로 mode flag를 읽었다. Keystatic config가 관리자 브라우저 번들에도 포함되면서 `process is not defined`가 발생해 설정 화면이 흰색으로 남았다. 비밀이 아닌 일회성 플래그만 `PUBLIC_KEYSTATIC_GITHUB_MODE`와 `import.meta.env`로 변경하고 OAuth 비밀값은 서버 전용 변수에 유지했다.

## 검증과 예방

수정 후 로컬 GitHub mode에서 `/keystatic/setup` HTTP 200을 확인했고 기존 `process is not defined` hydration 오류가 다시 발생하지 않았다. 사용자가 초기 인증을 나중에 진행하기로 결정해 GitHub App 생성, Vercel 변수 등록, 재배포와 실제 로그인 검증은 의도적으로 보류했다.

예방을 위해 `.env.example`에 필수 변수와 초기 설정 명령을 유지하고, 배포 체크리스트에서 Keystatic OAuth 설정 완료 전 관리 로그인을 검증 대상으로 표시한다. 비밀값은 커밋, 로그, 문서에 기록하지 않는다.

## 남은 위험

- GitHub App callback URL이나 저장소 설치 범위가 잘못되면 OAuth 또는 저장 단계에서 별도 오류가 날 수 있다.
- client secret을 회전하면 Vercel 변수 갱신과 재배포가 함께 필요하다.

## 면접에서 설명할 수 있는 질문

### 정적 블로그인데 왜 인증 장애가 발생했는가?

공개 페이지는 정적이지만 Git 기반 CMS의 OAuth와 쓰기 API는 Vercel Function에서 실행된다. 정적 읽기 경로와 동적 관리 경로의 장애 범위가 분리되어 공개 사이트는 정상이고 관리자만 실패했다.

### 왜 비밀값을 코드에 넣지 않았는가?

GitHub App client secret과 세션 서명 키는 저장소 이력에 남으면 회수하기 어렵다. 로컬 생성 후 Vercel의 암호화된 환경 변수로 전달하고 빌드·런타임에만 주입한다.
