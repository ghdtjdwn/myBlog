---
title: "선제 추천·그룹 합의 주문"
summary: "개인 취향 추천과 여러 사람의 합의 주문을 결합한 요기요×Oracle 해커톤 제안으로, 본선 진출 시 OCI 가용성부터 검증하도록 설계했습니다."
status: planned
statusNote: "예선 제안서를 제출했고 본선 결과를 기다리는 중입니다. 진출 전에는 코드와 OCI 운영 결과가 없는 기획 단계입니다."
activity: competition
visibility: private
role: "개인 기획·예선 제출"
contributionEvidence: ["예선 제출 문서", "본선 Day-1 검증 게이트"]
tags: ["Recommendation", "Group Decision", "OCI", "Product Design"]
infra: ["OCI Ampere planned", "ADB Vector planned"]
metrics:
  - { label: "Current stage", value: "Awaiting result" }
order: 6
featured: false
repositories: []
recordPlan: "예선 문서와 본선 Day-1 검증표를 원본으로 두고, 진출 후 실제로 확인한 OCI 가용성·추천 실험·운영 결과만 작업 로그와 블로그에 기록합니다."
recordLinks: []
---

## 해결하려는 문제

배달 주문은 개인 추천만으로 끝나지 않습니다. 여러 명이 함께 주문할 때는 알레르기, 예산, 선호와 정산 규칙을 동시에 만족해야 합니다. 개인 취향을 미리 반영하는 선제 추천과 7인 그룹 합의 주문을 하나의 흐름으로 제안했습니다.

## 설계 원칙

OCI GenAI 모델과 리전, ADB Vector 기능의 실제 제공 여부를 첫날 확인한 뒤 구현 범위를 결정합니다. 구현 전부터 OKE를 사용하는 대신 단일 Ampere VM과 Docker Compose로 데모 범위를 맞추는 안을 우선 검토했습니다.

계획상 추천 후보는 offline batch에서 준비하고, online 경로에서는 사용자의 현재 맥락과 그룹 제약을 적용합니다. LLM은 후보 설명과 대화 보조에 사용할 수 있지만 알레르기, 예산 초과, 정산과 최종 주문 상태는 결정론 규칙이 소유합니다.

본선 진출 시 첫날 OCI GenAI 모델·리전, ADB Vector 버전과 SDK 동작을 확인합니다. 이 검증이 실패하면 대체 모델이나 단순 검색으로 범위를 줄입니다. 짧은 대회에서 인프라 복잡도를 늘리지 않도록 OKE 대신 Ampere VM과 Docker Compose를 우선 검토했습니다.

## 현재 상태

예선 제출과 본선 착수 문서까지 준비했고 서비스 스캐폴드, 사용자 실험, OCI 배포는 아직 없습니다. 수락률·만족도 같은 값은 목표 지표일 뿐 실제 성과가 아닙니다. 본선 진출과 Day-1 검증을 통과한 뒤에만 구현 상태로 변경합니다.

## 공개 원칙

아직 구현된 서비스가 아닙니다. 블로그에는 본선 진출 후 실제로 검증한 인프라와 데이터만 기록합니다.

본선에 진출하지 않더라도 “대회 전에 기술 스택을 확정하지 않고 검증 게이트를 둔 이유”와 범위 조정 기준은 회고로 남길 수 있습니다. 팀이나 기업이 제공한 비공개 자료는 공개하지 않습니다.
