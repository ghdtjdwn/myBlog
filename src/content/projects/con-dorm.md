---
title: "con-dorm"
summary: "지원 가능한 기숙사와 생활 습관이 맞는 룸메이트를 찾는 팀 프로젝트로, 프론트엔드 전체와 roommate 백엔드 도메인을 담당했습니다."
status: prototype
visibility: private
role: "프론트엔드 전체·룸메이트 매칭 백엔드"
teamScope: "인증과 기숙사 자격 판정은 팀원 소유"
contributionEvidence: ["FE 7 commits", "BE 5 commits including merge", "3 PRs", "공용 역할·API 계약 문서"]
tags: ["Next.js", "Spring Boot", "Stable Roommates", "Contract Testing"]
infra: ["MySQL Docker Compose", "Mock-to-real adapter"]
metrics:
  - { label: "FE screens", value: "9+" }
  - { label: "Owned BE scope", value: "roommate" }
order: 9
featured: true
repositories: []
---

## 병렬 개발을 위한 경계

프론트엔드의 모든 데이터 접근을 API adapter 뒤에 두고 mock과 실제 백엔드를 전환할 수 있게 했습니다. 공용 API 계약을 데이터 모델의 기준으로 삼아 각 도메인이 독립적으로 연결되도록 했습니다.

## 매칭 검증

생활 습관 가중치 점수를 프론트엔드와 백엔드가 같은 규칙으로 계산하도록 parity test를 두었습니다. Stable Roommates 구현은 작은 입력에서 브루트포스 oracle과 비교해 안정성을 확인했습니다.

## 역할 경계

인증과 기숙사 자격 판정은 팀원의 작업입니다. 이 페이지는 직접 담당한 화면과 roommate 도메인만 설명합니다.
