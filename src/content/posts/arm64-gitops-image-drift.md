---
title: "CI는 성공했는데 ARM64 k3s가 이전 이미지를 실행한 이유"
description: "AMD64 전용 OCI manifest를 시작점으로 build, registry, Git write-back, reconciliation, runtime을 각각 검증하게 된 배포 기록입니다."
publishedAt: 2026-07-15
updatedAt: 2026-07-15
category: infrastructure
activity: personal-project
tags: ["ARM64", "GitOps", "ArgoCD", "OCI"]
project: ssu-platform
role: "CI 이미지 빌드, GitOps 배선, ARM64 런타임 검증"
evidence:
  - "ssuMCP commit 9d37749의 AMD64-only→AMD64/ARM64 workflow diff"
  - "commit 99630e2의 검증 성공 후 이미지 발행 게이트"
  - "멀티 플랫폼 manifest, Git write-back, ArgoCD와 실행 Pod를 분리한 배포 기록"
validation:
  - "OCI manifest에 linux/amd64와 linux/arm64가 함께 생성됨을 확인"
  - "Image Updater write-back 뒤 ArgoCD Synced/Healthy와 ARM64 Pod 2/2 Ready·restart 0 확인"
  - "실행 image digest, health/readiness와 비파괴 MCP smoke를 순서대로 확인"
limitations:
  - "외부 서비스 중단은 없었으며 사용자 영향이 있었던 장애로 확대하지 않음"
  - "Oracle ARM64 단일 노드 k3s의 전달 사례이며 고가용성 클러스터 검증이 아님"
  - "레지스트리·클러스터 식별자와 자격증명 값은 공개하지 않음"
featured: true
draft: false
---

## 녹색 CI와 배포 완료 사이에 빠진 단계

ssuMCP의 테스트와 이미지 push는 성공했지만 ARM64 k3s의 애플리케이션은 이전 이미지를 계속 실행했습니다. 서비스 중단은 없었습니다. 기존 Pod가 요청을 처리하는 동안 새 산출물이 런타임까지 도달하지 못한 전달 실패였습니다.

원인은 새 태그가 `linux/amd64` 이미지 하나만 가리킨 것이었습니다. 태그가 레지스트리에 존재하고 CI가 녹색이라는 사실은 ARM64 노드가 그 이미지를 실행할 수 있다는 뜻이 아니었습니다.

당시 workflow는 QEMU를 AMD64 대상으로 설정하고 Buildx에도 `linux/amd64`만 전달했습니다. [수정 commit](https://github.com/ghdtjdwn/ssuMCP/commit/9d37749dd1d64dce24fd39ba1e3643e41a700629)에서는 QEMU 대상과 Buildx 플랫폼을 다음처럼 바꿨습니다.

```yaml
- name: Set up QEMU (ARM64 emulation)
  with:
    platforms: arm64

- name: Build and push (linux/amd64, linux/arm64)
  with:
    platforms: linux/amd64,linux/arm64
```

## 전달 경로를 다섯 개의 계약으로 나눴다

문제를 고친 뒤에는 “배포 성공”을 한 상태값으로 보지 않습니다.

```text
1. Build       테스트와 패키징이 성공했는가
2. Registry    태그의 OCI manifest가 대상 아키텍처를 포함하는가
3. Write-back  Image Updater가 불변 SHA를 Git에 기록했는가
4. Reconcile   ArgoCD가 그 Git revision을 Synced/Healthy로 만들었는가
5. Runtime     실제 Pod digest와 사용자 요청이 새 버전을 증명하는가
```

각 단계는 다음 단계를 보장하지 않습니다. 테스트가 통과해도 잘못된 플랫폼으로 패키징할 수 있고, manifest가 맞아도 Image Updater가 이미지를 고려하지 않을 수 있습니다. Git 값이 바뀌어도 reconcile이 멈출 수 있으며, `Synced`만으로 실제 프로세스의 응답까지 증명할 수는 없습니다.

이 경계를 반영해 현재 CI는 테스트·커버리지 게이트가 성공한 뒤에만 배포 후보 이미지를 발행합니다. 패키징과 검증을 병렬로 두면 실패한 코드도 자동 rollout 후보가 될 수 있기 때문에 [후속 commit](https://github.com/ghdtjdwn/ssuMCP/commit/99630e2)에서 image job이 검증 job을 의존하게 했습니다.

## 태그 이름 대신 manifest와 digest를 본다

`latest`나 `sha-*` 태그 문자열만 확인하지 않았습니다. 레지스트리의 OCI index에 `linux/amd64`와 `linux/arm64`가 모두 있는지 먼저 봤습니다. 그다음 Image Updater의 Git write-back, ArgoCD 상태, ARM64 노드의 실행 digest를 차례로 대조했습니다.

최종 검증에서는 두 backend Pod가 모두 Ready이고 restart가 0인 상태, health와 readiness, 비파괴 MCP 초기화 요청을 확인했습니다. 원시 Pod 이름, 레지스트리 좌표, Secret 이름과 로그는 공개 글에 옮기지 않았습니다.

## 비슷해 보여도 다른 incident는 합치지 않는다

같은 날 GitHub 소유자 변경 뒤 예전 컨테이너 좌표를 남긴 별도 GitOps drift도 확인했습니다. 그 사건은 이미지 아키텍처 불일치와 원인이 다릅니다. 하나는 OCI manifest의 실행 가능성, 다른 하나는 controller가 관찰하는 저장소 좌표의 문제입니다.

두 현상을 “ArgoCD가 느렸다”로 합치면 재발 방지도 흐려집니다. 이 글은 AMD64-only manifest와 전달 검증 경계에만 집중하고, repository owner drift는 별도 원본 기록으로 유지합니다.

## 이 검증이 증명하지 않는 것

이 환경은 Oracle ARM64 단일 노드입니다. 두 Pod가 새 digest로 정상 기동했다는 사실은 노드 장애를 견디는 고가용성을 증명하지 않습니다. 외부 서비스 중단도 없었으므로 사용자 장애로 부풀리지 않습니다.

대신 얻은 것은 재사용 가능한 완료 조건입니다. CI 배지 하나가 아니라 manifest, Git, controller, runtime과 요청을 연결해야 배포가 끝납니다. 현재 workflow와 GitOps 문서는 이 다섯 단계가 다시 분리되지 않도록 유지합니다.
