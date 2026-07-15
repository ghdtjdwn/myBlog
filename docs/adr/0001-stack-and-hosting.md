# ADR-0001: Astro 정적 사이트와 Vercel 관리형 배포

- 상태: 승인
- 날짜: 2026-07-15

## 문제

포트폴리오와 기술 글을 한 도메인에서 운영하고, 여러 프로젝트의 ADR·작업 로그·장애 기록을 빠르게 공개 초안으로 전환해야 한다. 동시에 블로그 자체의 운영 복잡성이 글 작성과 공모전·팀 활동을 방해하면 안 된다.

사용자는 이미 두 가지 강한 인프라 경험을 보유한다.

- ssu 플랫폼: Oracle ARM64 k3s, Helm, ArgoCD, Kafka, PostgreSQL, Redis, Prometheus/Grafana, Tempo/Loki
- 그늘: Terraform, VPC, ECS Fargate, RDS/PostGIS, ElastiCache, ALB, CloudFront, ECR, GitHub Actions OIDC

따라서 블로그에서 같은 복잡성을 반복하는 것은 포트폴리오 증거의 한계효용이 낮다.

## 결정

Astro 7로 정적 HTML을 생성하고 GitHub에서 소스와 Markdown을 관리한다. GitHub Actions가 품질을 검사하고 Vercel Git Integration이 PR Preview와 main Production을 배포한다.

공개 페이지에는 서버와 DB를 사용하지 않는다. 분석은 익명·쿠키리스 Vercel Web Analytics를 사용하고 실제 성능은 Speed Insights로 확인한다.

관리자 인증이 실제 요구로 추가되어 `/keystatic`과 OAuth API에 한해 Vercel Function을 사용하도록 확장했다. 콘텐츠와 공개 페이지의 정적 원칙은 유지하며 상세 결정은 ADR-0002에 기록한다.

## 대안

### Next.js + Vercel

기각. 이미 여러 프로젝트에서 Next.js 경험을 증명했고, 블로그에 서버 컴포넌트나 API가 필요하지 않다. 콘텐츠 사이트에는 Astro가 더 작은 런타임과 단순한 설명을 제공한다.

### AWS S3 + CloudFront + Route 53 + Terraform

기각. 안전한 정적 사이트를 만들 수 있지만 이미 그늘에서 더 복잡한 AWS IaC를 증명했다. Preview 환경과 글 전달 속도를 위해 추가 구성이 필요하며 소액이라도 지속 비용과 운영 표면이 생긴다.

### 기존 Oracle k3s

기각. ssu 플랫폼과 장애 도메인을 공유하게 되고 개인 블로그의 가용성이 단일 노드 운영에 종속된다. 새 역량보다 결합도와 복구 책임이 커진다.

### Cloudflare Workers Static Assets

보류. 2026년 현재 정적 자산과 확장 기능을 하나의 Worker로 배포할 수 있으나 V1에는 Worker 코드가 없다. 향후 edge logic이 실제로 필요할 때 재검토한다.

### GitHub Pages

대안으로 유지. 비용과 구조는 단순하지만 PR별 Preview, 분석, 롤백 경험이 Vercel보다 약하다. Vercel 제약이 발생하면 가장 쉽게 이전할 수 있다.

### Hashnode·Velog

주 저장소로는 기각. 콘텐츠 소유권, 프로젝트와 글의 정보 구조, 개인 브랜드 통제가 약하다. 배포 후 요약 유통 채널로만 사용한다.

## 결과

- Markdown은 Git에 남아 공급자 변경이 쉽다.
- 서버 공격 표면과 운영 비용이 작다.
- PR마다 실제 화면을 확인한 뒤 발행할 수 있다.
- 인프라의 포트폴리오 가치는 복잡성 추가가 아니라 요구사항에 맞게 복잡성을 제거한 결정에서 나온다.

## 위험과 완화

- Astro 7 출시 초기 호환성: exact pin, first-party 통합, 빌드 게이트, Astro 6 복귀 가능성 유지
- Vercel 종속 분석·Preview: 출력은 표준 정적 파일이며 GitHub Pages로 이전 가능
- 자동 기록의 정보 노출: ignored source map, draft 강제, secret scan, 사용자 발행 승인
- 외부 이미지와 링크 부패: 로컬 핵심 이미지 보관, 정기 링크 검사

## 재검토 조건

- Vercel 정책이나 비용이 개인 사이트 요구와 맞지 않음
- 동적 API나 인증 수요가 실제 사용자 요구로 확인됨
- 콘텐츠 규모가 정적 빌드 시간을 유의미하게 악화시킴
- edge logic이 필요한 명확한 기능이 생김
