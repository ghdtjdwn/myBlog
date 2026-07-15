---
title: "Cham Domi (참 도미)"
summary: "지원 가능한 기숙사와 생활 습관이 맞는 룸메이트를 찾는 팀 프로젝트로, 프론트엔드 전체와 roommate 백엔드 도메인을 담당했습니다. 저장소 handle은 con-dorm을 유지합니다."
status: prototype
statusNote: "프론트엔드와 룸메이트 도메인 프로토타입은 완성했지만 인증 통합, 실제 배포와 운영 검증은 아직 진행하지 않았습니다."
activity: team
visibility: private
role: "프론트엔드 전체·룸메이트 매칭 백엔드"
teamScope: "인증과 기숙사 자격 판정은 팀원 소유"
contributionEvidence: ["FE 7 commits", "BE 5 commits including merge", "3 PRs", "공용 역할·API 계약 문서"]
tags: ["Next.js", "Spring Boot", "Stable Roommates", "Contract Testing"]
infra: ["H2/MySQL persistence", "Mock-to-real API adapter", "No deployment yet"]
metrics:
  - { label: "FE screens", value: "9+" }
  - { label: "Owned BE scope", value: "roommate" }
order: 10
featured: true
repositories: []
recordPlan: "팀 저장소와 공용 역할·API 계약 문서를 원본으로 두고, 개인이 맡은 FE·roommate 범위만 익명화해 블로그에 기록합니다. 배포 전 문제를 운영 장애처럼 표현하지 않습니다."
recordLinks: []
---

## 해결하려는 문제

Cham Domi(참 도미)는 기숙사 지원 자격 확인과 생활 습관이 맞는 룸메이트 탐색을 연결하는 팀 프로토타입입니다. 모바일 사용자가 자신의 조건을 입력하고 지원 가능한 기숙사, 매칭 후보, 게시글과 채팅까지 이어서 볼 수 있게 만들었습니다. 기존 저장소 주소와 내부 연동을 깨뜨리지 않기 위해 GitHub 조직 handle은 `con-dorm`을 유지합니다.

## 병렬 개발을 위한 경계

프론트엔드의 모든 데이터 접근을 API adapter 뒤에 두고 mock과 실제 백엔드를 전환할 수 있게 했습니다. 공용 API 계약을 데이터 모델의 기준으로 삼아 각 도메인이 독립적으로 연결되도록 했습니다.

Next.js 16 프론트엔드는 로그인, 프로필 입력, 매칭, 후보 상세, 채팅과 기숙사 탐색 등 9개 이상의 화면 흐름을 담당합니다. 백엔드가 준비되기 전에는 mock adapter를 사용하고, 같은 호출부를 실제 API adapter로 바꿀 수 있게 해 화면 개발과 도메인 구현을 병렬화했습니다.

제가 맡은 백엔드 범위는 Spring Boot/JPA 기반 roommate 도메인, 생활 습관 점수, Stable Roommates, 게시글과 채팅입니다. 인증과 기숙사 자격 판정은 팀원의 소유이므로 이 페이지에서 제 구현으로 설명하지 않습니다.

## 매칭 검증

생활 습관 가중치 점수를 프론트엔드와 백엔드가 같은 규칙으로 계산하도록 parity test를 두었습니다. Stable Roommates 구현은 작은 입력에서 브루트포스 oracle과 비교해 안정성을 확인했습니다.

동일 입력의 FE 100/89 점수 사례와 BE 89점 사례를 맞추고, dealbreaker와 가중치 합을 검사했습니다. Stable Roommates는 `n=4`, `n=6` 각각 400개의 무작위 입력을 작은 brute-force oracle과 대조했습니다. 다만 점수 규칙이 공용 패키지가 아니라 양쪽 코드에 복제돼 있어 contract test가 사라지면 drift할 위험이 있습니다.

## 현재 상태와 한계

팀 프로토타입은 화면과 핵심 매칭 흐름까지 구현됐지만 실제 인증 통합, CI, 공개 배포와 사용자 운영 기록은 없습니다. H2와 MySQL 의존성은 확인되지만 Docker Compose 운영 근거는 없어 기존 설명에서 제거했습니다. 다음 단계는 팀 API 통합, 공용 계약 자동 검증과 테스트 환경 배포입니다.

## 역할 경계

인증과 기숙사 자격 판정은 팀원의 작업입니다. 이 페이지는 직접 담당한 화면과 roommate 도메인만 설명합니다.
