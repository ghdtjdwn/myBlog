# 기술 블로그 전체 스펙

상태: 승인안
결정일: 2026-07-15

## 1. 목표

이 사이트는 단순 글 목록이 아니라 다음 세 가지를 하나의 증거 체계로 연결한다.

1. 프로젝트가 해결한 사용자 문제
2. 홍성주가 직접 맡은 역할과 기술적 결정
3. 코드, 테스트, ADR, 장애 기록, 라이브 서비스로 확인 가능한 결과

주 독자는 채용 담당자와 개발자다. 30초 안에 전문 분야를 파악하고, 3분 안에 대표 프로젝트의 역할과 깊이를 확인할 수 있어야 한다.

## 2. 선택 기준

모든 기술 선택은 다음 순서로 평가한다.

1. 강한 포트폴리오와 면접 설명력을 만드는가
2. 최신 공식 문서와 현재 실무 관행으로 검증됐는가
3. 보여주기식 복잡성이 아니라 실제 운영 가치가 있는가
4. 사용자가 설명, 테스트, 운영, 시연할 수 있는가
5. 신뢰성, 유지보수성, 보안, 관측성, 성능, 비용, 배포 속도, 가역성의 균형이 맞는가

## 3. 애플리케이션 스택

| 영역 | 결정 | 이유 |
| --- | --- | --- |
| 런타임 | Node.js 24 LTS | 현재 LTS이며 로컬 환경과 일치한다. |
| 프레임워크 | Astro 7, 정확한 버전 고정 | 콘텐츠 중심 정적 사이트에 맞고 기본 클라이언트 JS가 적다. |
| 언어 | TypeScript 6.0.3 strict | Astro 검사기의 공식 peer 범위 안에서 콘텐츠·라우트·컴포넌트 계약을 빌드 전에 검증한다. |
| 렌더링 | 공개 페이지 SSG + 관리자 경로 SSR | 독자는 CDN의 정적 HTML을 받고 `/keystatic`과 인증 API만 서버 함수로 실행한다. |
| 콘텐츠 | Markdown 기본, MDX 선택 | 글의 이식성을 유지하고 필요한 글만 컴포넌트를 사용한다. |
| 모델 | Astro Content Collections | frontmatter와 프로젝트 연결을 스키마로 검증한다. |
| 관리 | Keystatic GitHub mode | 브라우저에서 CRUD·초안·카테고리를 관리하되 원본은 Git에 남긴다. |
| UI | Astro Components + 관리자 전용 React | 공개 페이지에 React를 싣지 않고 Keystatic 경로에만 사용한다. |
| CSS | Vanilla CSS + design tokens | 의존성을 줄이고 타이포그래피와 반응형을 직접 통제한다. |
| 코드 | Astro 내장 Shiki | 별도 클라이언트 하이라이터가 필요 없다. |
| 이미지 | Astro Image + build-time 최적화 | 크기와 레이아웃 이동을 빌드 시 통제한다. |
| 패키지 | npm + lockfile | 단순한 단일 패키지 프로젝트에 충분하다. |

Astro 7은 2026-06-22 출시된 안정 메이저다. 출시 초기 위험을 줄이기 위해 first-party 통합만 사용하고 정확한 버전을 고정한다. Content Collections, MDX, RSS, sitemap, 이미지 빌드 중 하나라도 호환성 문제가 반복되면 Astro 6 복귀를 검토한다.

TypeScript 7이 최신이지만 `@astrojs/check` 0.9.9의 peer 범위는 TypeScript 5와 6이다. 강제 설치 대신 호환 범위의 최신 6.0.3을 사용하고 검사기 지원 후 7로 올린다.

## 4. 콘텐츠 모델

V1은 기본 다섯 개 컬렉션과 한국어 원문에 대응하는 `projectsEn`, `postsEn` 컬렉션을 사용한다.

### site settings

- 작성자 한·영 이름, 사이트 한·영 제목·설명과 헤더·푸터 문구
- 홈 소개 문구, 목록 제목과 최근 글·대표 프로젝트 표시 개수
- 이메일·GitHub·solved.ac·학력 표시
- 검증된 배경 테마와 강조색 preset
- 한·영 메뉴 이름·경로, 상단/하단 노출, 새 탭 여부와 배열 순서
- 단일 `settings/site.yaml`을 Keystatic singleton과 Astro Content Collection이 함께 검증한다.

### categories

- `name`, `description`, `nameEn`, `descriptionEn`, `kind`, `order`, `visible`
- `kind`는 직무 역량과 활동 유형을 구분한다.
- 글은 직무 역량 카테고리 하나를 필수로, 활동 유형 하나를 선택적으로 참조한다.
- 관계 검증 스크립트가 삭제·이름 변경으로 생긴 끊어진 참조를 빌드 전에 차단한다.
- `kind` 변경으로 두 카테고리 그룹 사이를 이동하고 `order`로 같은 그룹의 표시 순서를 바꾼다.

### projects

- `title`, `summary`, `status`, `visibility`
- `statusNote`, `activity`, `recordPlan`, `recordLinks`
- `role`, `teamScope`, `contributionEvidence`
- `repositories`, `liveUrl`, `liveStatus`
- `stack`, `infra`, `metrics`
- `decisions`, `incidents`, `relatedPosts`
- `featured`, `order`

### posts

- `title`, `description`, `publishedAt`, `updatedAt`
- `category`, `activity`, `project`, `role`, `tags`
- `evidence`, `validation`, `limitations`
- `draft`, `featured`

### decisions

- 선택한 안, 대안, 판단 기준, 결과, 재검토 조건을 기록한다.

### incidents

- 실제 장애와 성능 문제만 기록한다.
- 기대/실제 동작, 영향, 재현, 가설, 증거, 원인, 해결, 검증, 예방, 남은 위험을 포함한다.

계획 단계 프로젝트는 `status: planned`로 표시하고 구현 결과처럼 보이는 수치나 표현을 금지한다.

## 5. 인프라

### 선택안

- 소스와 콘텐츠: GitHub 저장소
- 콘텐츠 관리자: Keystatic GitHub mode
- CI: GitHub Actions
- Preview/Production: Vercel Git Integration
- 정적 자산: Vercel CDN
- 도메인과 TLS: 개인 도메인 + Vercel 관리 인증서
- 분석: Vercel Web Analytics
- 실제 사용자 성능: Vercel Speed Insights
- 검색 색인: Google Search Console, 네이버 서치어드바이저

### 전달 흐름

```text
local draft 또는 /admin 편집
  → GitHub commit / feature branch
  → GitHub Actions: check, build, verify, secret scan
  → Vercel Preview
  → 사실·디자인 검토
  → main merge
  → Vercel Production + CDN
```

V1에서는 별도 DB, Kubernetes, Terraform을 사용하지 않는다. Git 기반 Keystatic 관리자와 OAuth 콜백에만 Vercel Function을 사용한다. `ssuAI` 플랫폼에서 k3s·ArgoCD·관측성을, `그늘`에서 AWS ECS·Terraform·RDS·CloudFront를 이미 훨씬 깊게 증명했기 때문에 블로그는 글 전달과 콘텐츠 안정성을 우선한다.

Cloudflare Workers Static Assets는 확장성이 좋은 대안이지만 Worker 런타임이 필요 없다. GitHub Pages는 충분히 가능하지만 PR별 Preview와 운영 분석이 약하다. AWS S3+CloudFront와 자체 k3s는 기존 역량을 반복하면서 비용과 장애 표면만 늘린다.

## 6. CI와 품질 게이트

모든 PR에서 다음을 순서대로 실행한다.

1. `astro check`: TypeScript와 콘텐츠 스키마
2. Vercel 배포에서도 동일한 전체 테스트와 정적 빌드
3. 카테고리·프로젝트 참조, 내부 링크, 이미지 경로, canonical, JSON-LD, RSS, sitemap 검사
4. 공개 문서와 빌드 산출물 secret scan
5. 대표 라우트와 360px 모바일 smoke test

프로덕션 기준은 다음과 같다.

- Lighthouse Performance, Accessibility, Best Practices, SEO 각 90 이상
- 깨진 내부 링크 0
- draft의 프로덕션 노출 0
- 모든 대표 프로젝트에 역할·근거·한계 표시
- Preview에는 검색 색인 방지

## 7. SEO와 배포 메타데이터

- 각 페이지 canonical URL
- `BlogPosting`과 `ProfilePage` JSON-LD
- 발행일과 실제 수정일 분리
- Open Graph와 소셜 카드
- `sitemap.xml`, `rss.xml`, `robots.txt`
- 저자 페이지에서 GitHub 프로필 연결
- 동일 글 외부 배포 시 원문 canonical 또는 요약 링크 사용
- 한국어는 기본 URL, 영어는 `/en/`의 별도 정적 URL을 사용한다.
- 모든 번역 쌍에 self canonical과 `hreflang=ko`, `en`, `x-default`를 제공한다.
- 자동 번역 API 없이 검수 가능한 Markdown 원문을 CMS에서 각각 관리한다.
- Google·네이버 HTML 태그 인증값은 저장소가 아닌 Vercel 환경 변수에서 주입한다.

## 8. 즉시 기록할 수 있는 구조

사이트 제작 후 에이전트가 바로 기록할 수 있도록 다음을 제공한다.

- `scripts/new-record.mjs`: project/post는 같은 slug의 한·영 초안 쌍, decision/incident는 한국어 초안 생성
- `config/project-sources.local.json`: 프로젝트별 로컬 근거 경로. Git 제외
- `config/project-sources.example.json`: 공개 가능한 키 구조
- `AGENTS.md`: 증거 수집, 기여 경계, 공개 전 검수 규칙
- draft 전용 목록: 로컬과 Preview에서만 확인

자동화는 글을 발행하지 않는다. 프로젝트의 work log, ADR, troubleshooting, Git diff를 읽어 초안을 만들 수 있지만 `draft: true`를 강제한다. 공개 글은 같은 slug의 한·영 원문이 모두 발행 상태일 때만 검증을 통과하며, 비공개 원문은 공개 저장소에 복사하지 않는다.

## 9. V1 이후 조건부 확장

- 글 20편 이상: Pagefind 정적 검색 검토
- 독자 피드백 수요 확인: Giscus 검토
- GitHub 기반 편집이 실제 병목: 독립 Content Lake형 Headless CMS 검토
- 상호작용이 필요한 글: 해당 MDX 컴포넌트만 island로 추가
- 영문 글 확대: 한·영 쌍으로 생성한 초안 중 검수 가능한 대표 글부터 함께 발행

기능은 요구가 검증된 뒤에만 추가한다.

## 10. 공식 근거

- [Astro 7](https://astro.build/blog/astro-7/)
- [Astro Content Collections](https://docs.astro.build/en/reference/modules/astro-content/)
- [Astro on Vercel](https://vercel.com/docs/frameworks/frontend/astro)
- [Keystatic Astro 설치](https://keystatic.com/docs/installation-astro)
- [Keystatic GitHub mode](https://keystatic.com/docs/github-mode)
- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel Web Analytics](https://vercel.com/docs/analytics)
- [Node.js release status](https://nodejs.org/en/about/previous-releases)
