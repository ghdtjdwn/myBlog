---
title: "그늘 — 여름 생존 지도"
summary: "폭염과 비 오는 날 주변 쉼터를 찾도록 15만여 공공 POI, PostGIS 공간 검색, 실시간 제보를 연결한 지도 서비스입니다."
status: complete
statusNote: "웹·API·PWA와 AWS 인프라 구현·검증까지 마치고 개발을 종료했습니다. 공개 URL과 저장소는 완료 결과를 확인할 수 있게 유지합니다."
activity: personal
visibility: public
role: "제품·데이터·백엔드·인프라 전체"
teamScope: "개인 프로젝트"
contributionEvidence: ["168 commits", "117 PRs", "Terraform과 성능 자료 공개"]
image: "../../assets/projects/geuneul-prototype.png"
imageAlt: "그늘 장소 목록과 지도를 함께 보여주는 데스크톱 화면"
tags: ["Spring Boot", "PostGIS", "Next.js", "PWA"]
infra: ["AWS ECS", "RDS", "ElastiCache", "CloudFront", "Terraform"]
metrics:
  - { label: "Public POI", value: "150k+" }
  - { label: "Radius p95", value: "~1.4s" }
  - { label: "k6 checks", value: "564 / 564" }
order: 2
featured: true
live: "https://geuneul.vercel.app"
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/geuneul" }
recordPlan: "공개 저장소의 README, architecture, DEPLOY, ADR와 worklog를 완료 산출물의 원본으로 사용합니다. 블로그에는 성능·데이터·운영 사례를 문제와 검증 중심으로 선별해 연결합니다."
recordLinks:
  - { label: "Architecture Decision Records", url: "https://github.com/ghdtjdwn/geuneul/tree/main/docs/adr" }
  - { label: "PostGIS 부하·실행계획 튜닝 ADR", url: "https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0012-k6-load-explain-index-tuning.md" }
  - { label: "PostGIS EXPLAIN 결과", url: "https://github.com/ghdtjdwn/geuneul/blob/main/perf/explain/RESULTS.md" }
---

## 문제

공공데이터는 존재하지만 사용자가 더운 날 지금 갈 수 있는 장소를 빠르게 판단하기 어렵습니다. 서로 다른 전국 데이터를 하나의 위치 모델로 정리하고, 거리와 최근 제보를 함께 보여주는 서비스로 만들었습니다.

단순히 장소를 지도에 찍는 것으로는 충분하지 않았습니다. 사용자는 지금 걸어갈 수 있는 거리인지, 실제로 쉴 수 있는지, 최근 제보가 있는지와 비·폭염 상황에 적합한지를 함께 판단해야 합니다. 공공 POI와 사용자 제보, 날씨와 편의 신호를 하나의 탐색 흐름으로 연결했습니다.

## 데이터와 검색

자연키 `source + source_external_id`로 배치를 반복 실행해도 중복되지 않는 ETL을 구성했습니다. 반경 검색, 최근접 kNN, 지도 bounds 조회는 PostGIS와 GiST 인덱스로 처리합니다. `EXPLAIN ANALYZE`와 k6로 실행계획과 꼬리 지연을 확인했습니다.

전국 데이터는 기관마다 식별자, 좌표, 갱신 주기가 다릅니다. 원천 출처와 외부 ID를 자연키로 보존하고 upsert해 재실행 가능한 수집 파이프라인을 만들었습니다. 위치는 PostGIS geography로 저장하고, 반경·최근접·현재 지도 영역이라는 서로 다른 질의 목적에 맞춰 실행계획을 분리해 봤습니다.

반경 검색 p95는 동일 로컬 조건에서 약 2.68초에서 1.39초로, kNN은 238ms에서 98ms로 줄어든 기록이 있습니다. 이는 ARM64 Mac에서 amd64 PostGIS 컨테이너를 에뮬레이션한 상대 비교이며 Production RDS의 절대 성능으로 사용하지 않습니다.

## 실시간성과 제품 경계

제보 변경은 PostgreSQL `LISTEN/NOTIFY`에서 서버의 SSE 스트림으로 전달합니다. 여러 인스턴스에서 같은 이벤트가 어떻게 전달되는지, 연결이 끊겼을 때 클라이언트가 어떻게 다시 동기화하는지를 별도 경계로 다뤘습니다. 생존 점수는 SQL에서 신호를 계산하고 Java 정책에서 조합해, 데이터 선택과 제품 규칙을 한 쿼리에 섞지 않았습니다.

## 인프라

Terraform으로 VPC, public/private subnet, ECS Fargate, ECR, RDS/PostGIS, ElastiCache, ALB, CloudFront, S3, EventBridge와 OIDC 배포 권한을 선언했습니다. 프론트엔드는 Vercel, API는 CloudFront를 통해 제공합니다.

ECS 서비스는 최소 1개에서 최대 3개까지 CPU 60% 기준으로 확장하도록 구성했습니다. GitHub Actions는 장기 AWS key 대신 OIDC로 배포 역할을 얻습니다. CloudFront와 ALB 사이의 origin 접근, RDS 암호화·백업·복원, 관측성 비용을 ADR로 남겨 단순 구성도가 아니라 운영 결정을 설명할 수 있게 했습니다.

## 완료 상태

웹, API health, PWA 설치 경로와 서명 APK를 공개하고 실제 응답을 확인한 뒤 계획한 개발 범위를 완료했습니다. 공개 데모와 코드·설계·성능 기록은 결과 확인용으로 유지하지만, 현재 진행 중인 기능 개발이나 개선 로드맵은 없습니다. 완료 이후에는 공공데이터 최신성이나 인프라의 상시 가용성을 보장하지 않습니다.

## 한계

성능 수치는 ARM64 Mac에서 amd64 PostGIS 이미지를 에뮬레이션한 동일 환경의 before/after입니다. 프로덕션 RDS의 절대 지연으로 표현하지 않습니다.

그늘과 편의 정보 중 일부는 공공데이터의 갱신 시점과 사용자 제보에 의존합니다. “15만 개 장소”는 수집 범위를 뜻하며 모든 장소의 현재 상태가 실시간으로 보장된다는 의미가 아닙니다.
