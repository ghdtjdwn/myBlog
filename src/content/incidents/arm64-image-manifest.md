---
title: "AMD64 전용 이미지와 GitOps drift로 인한 ARM64 배포 정지"
occurredAt: 2026-07-15
project: ssu-platform
impact: "CI 성공 이후에도 ARM64 k3s의 애플리케이션이 이전 이미지를 계속 실행했다."
validation:
  - "멀티 플랫폼 manifest, Image Updater write-back, Argo CD 상태와 실제 Pod digest를 순서대로 확인"
  - "health와 MCP 요청으로 애플리케이션 동작 확인"
draft: true
---

## 기대와 실제

새 이미지가 push되면 Image Updater와 Argo CD를 거쳐 ARM64 노드에도 배포되어야 했다. 실제로는 새 태그가 AMD64 이미지만 포함했고, updater 설정 일부는 이전 저장소를 가리켰다.

## 원인과 해결

Buildx 대상 플랫폼을 `linux/amd64,linux/arm64`로 고정하고 GitOps 이미지 소유자·저장소·태그 정책을 현재 값으로 바로잡았다.

## 남은 위험

단일 노드 환경이므로 노드 자체 장애에는 고가용성을 제공하지 않는다. 발행 전 원본 troubleshooting 기록에서 시간 순서와 검증 명령을 다시 대조한다.
