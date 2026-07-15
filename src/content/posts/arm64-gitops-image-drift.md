---
title: "CI는 성공했는데 ARM64 k3s에는 새 이미지가 배포되지 않았다"
description: "멀티 아키텍처 이미지와 GitOps 설정 drift가 겹친 배포 실패를 manifest, controller metric, 실제 Pod 상태로 좁힌 기록입니다."
publishedAt: 2026-07-15
tags: ["k3s", "ArgoCD", "OCI", "ARM64"]
project: ssu-platform
role: "CI/CD, GitOps와 ARM64 클러스터 운영"
evidence:
  - "ssuMCP troubleshooting 기록의 2026-07-14, 2026-07-15 장애"
  - "컨테이너 manifest와 Argo CD 실제 상태 점검 기록"
validation:
  - "이미지 manifest에서 linux/amd64와 linux/arm64 확인"
  - "Argo CD Synced/Healthy와 ARM64 노드의 새 Pod 이미지 확인"
  - "서비스 health 및 MCP 요청 확인"
limitations:
  - "Oracle ARM64 단일 노드 k3s 환경의 사례"
  - "고가용성 멀티 노드 클러스터 장애로 일반화하지 않음"
featured: true
draft: true
---

## CI 성공은 배포 성공이 아니었다

애플리케이션 테스트와 이미지 push는 성공했지만 ARM64 노드의 Pod는 기존 버전을 계속 실행했습니다. 처음에는 Argo CD 동기화 지연을 의심했지만, 배포 파이프라인을 단계별로 나누자 서로 다른 두 문제가 보였습니다.

1. 새 태그가 AMD64 이미지 하나만 가리켰습니다.
2. Image Updater 설정 일부가 이전 저장소를 계속 가리켜 고려한 이미지 수가 0이었습니다.

## 태그가 아니라 manifest와 controller의 관측값 보기

레지스트리에 태그가 있다는 사실만으로 노드에서 실행 가능하다고 판단할 수 없습니다. OCI manifest에 `linux/arm64`가 포함됐는지 확인하고, Image Updater가 실제로 이미지를 탐색했는지를 metric과 로그로 확인했습니다.

CI는 Buildx로 `linux/amd64,linux/arm64`를 함께 빌드하도록 바꾸고, GitOps 설정은 현재 저장소와 태그 정책을 다시 고정했습니다. 그 뒤 다음 순서로 검증했습니다.

- 멀티 플랫폼 manifest 생성
- Image Updater write-back 확인
- Argo CD `Synced`와 `Healthy` 확인
- ARM64 노드의 실제 Pod image digest 확인
- health와 MCP 요청 확인

## 재발 방지에서 중요한 경계

이 장애는 “CI 녹색”을 전달 완료의 기준으로 삼으면 놓칩니다. build, registry, Git write-back, reconciliation, runtime을 별도 단계로 관측해야 합니다. 단일 ARM64 노드라는 환경 한계도 함께 남겨, 더 큰 클러스터의 신뢰성 주장으로 확대하지 않습니다.

> 발행 전 체크: 민감한 레지스트리·클러스터 식별자를 제거하고 명령 출력은 필요한 필드만 재구성한다.
