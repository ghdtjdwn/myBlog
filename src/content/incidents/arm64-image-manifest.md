---
title: "AMD64 전용 이미지와 GitOps drift로 인한 ARM64 배포 정지"
occurredAt: 2026-07-15
project: ssu-platform
impact: "CI 성공 이후에도 새 태그가 AMD64 이미지만 포함해 ARM64 k3s는 기존 Ready 이미지를 계속 실행했다. 외부 중단은 없었다."
validation:
  - "멀티 플랫폼 manifest, Image Updater write-back, Argo CD 상태와 실제 Pod digest를 순서대로 확인"
  - "health와 MCP 요청으로 애플리케이션 동작 확인"
draft: true
---

## 기대와 실제

새 이미지가 push되면 Image Updater와 Argo CD를 거쳐 ARM64 노드에도 배포되어야 했다. 실제로는 새 태그가 AMD64 이미지만 포함해 ARM64 노드에서 실행할 수 없었다. 같은 시기에 확인한 repository owner drift는 원인이 다른 별도 사건이므로 이 기록에 합치지 않는다.

## 원인과 해결

Buildx 대상 플랫폼을 `linux/amd64,linux/arm64`로 고정하고, 배포 후보 이미지 발행이 테스트·커버리지 검증 성공에 의존하도록 바꿨다.

## 남은 위험

단일 노드 환경이므로 노드 자체 장애에는 고가용성을 제공하지 않는다. 원시 클러스터·레지스트리 식별자는 공개하지 않으며, 외부 중단이 없었던 전달 실패로 범위를 유지한다.
