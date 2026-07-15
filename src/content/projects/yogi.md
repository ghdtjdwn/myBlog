---
title: "선제 추천·그룹 합의 주문"
summary: "개인 취향 추천과 여러 사람의 합의 주문을 결합한 요기요×Oracle 해커톤 제안으로, 본선 진출 시 OCI 가용성부터 검증하도록 설계했습니다."
status: planned
visibility: private
role: "개인 기획·예선 제출"
contributionEvidence: ["예선 제출 문서", "본선 Day-1 검증 게이트"]
tags: ["Recommendation", "Group Decision", "OCI", "Product Design"]
infra: ["OCI Ampere planned", "ADB Vector planned"]
metrics:
  - { label: "Current stage", value: "Awaiting result" }
order: 5
featured: false
repositories: []
---

## 설계 원칙

OCI GenAI 모델과 리전, ADB Vector 기능의 실제 제공 여부를 첫날 확인한 뒤 구현 범위를 결정합니다. 구현 전부터 OKE를 사용하는 대신 단일 Ampere VM과 Docker Compose로 데모 범위를 맞추는 안을 우선 검토했습니다.

## 공개 원칙

아직 구현된 서비스가 아닙니다. 블로그에는 본선 진출 후 실제로 검증한 인프라와 데이터만 기록합니다.
