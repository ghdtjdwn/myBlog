---
title: "그늘 — 여름 생존 지도"
summary: "폭염과 비 오는 날 주변 쉼터를 찾도록 15만여 공공 POI, PostGIS 공간 검색, 실시간 제보를 연결한 지도 서비스입니다."
status: operating
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
  - { label: "API failures", value: "0% / 564" }
order: 2
featured: true
live: "https://geuneul.vercel.app"
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/geuneul" }
---

## 문제

공공데이터는 존재하지만 사용자가 더운 날 지금 갈 수 있는 장소를 빠르게 판단하기 어렵습니다. 서로 다른 전국 데이터를 하나의 위치 모델로 정리하고, 거리와 최근 제보를 함께 보여주는 서비스로 만들었습니다.

## 데이터와 검색

자연키 `source + source_external_id`로 배치를 반복 실행해도 중복되지 않는 ETL을 구성했습니다. 반경 검색, 최근접 kNN, 지도 bounds 조회는 PostGIS와 GiST 인덱스로 처리합니다. `EXPLAIN ANALYZE`와 k6로 실행계획과 꼬리 지연을 확인했습니다.

## 인프라

Terraform으로 VPC, public/private subnet, ECS Fargate, ECR, RDS/PostGIS, ElastiCache, ALB, CloudFront, S3, EventBridge와 OIDC 배포 권한을 선언했습니다. 프론트엔드는 Vercel, API는 CloudFront를 통해 제공합니다.

## 한계

성능 수치는 ARM64 Mac에서 amd64 PostGIS 이미지를 에뮬레이션한 동일 환경의 before/after입니다. 프로덕션 RDS의 절대 지연으로 표현하지 않습니다.
