---
title: "새 readiness probe와 옛 이미지가 만난 GitOps 교착"
description: "GitHub repository redirect는 동작했지만 GHCR owner는 바뀌지 않아, 새 /ready probe와 옛 image의 404가 replacement Pod를 NotReady로 만들고 rollout을 정체시킨 Argo CD 배포 장애입니다."
publishedAt: 2026-07-18
category: troubleshooting
activity: personal-project
tags: ["Argo CD", "GitOps", "Kubernetes", "GHCR"]
project: ssu-platform
role: "ssu-ai-service rollout 장애 진단, Argo Application 정본 복구와 실제 image·readiness 검증"
evidence:
  - "ssu-ai-service docs/deployment-troubleshooting의 stale ArgoCD owner 사건"
  - "Image Updater의 matched 1·considered 0 상태와 live Application·Pod image 비교"
validation:
  - "실행 Pod의 정확한 SHA image, 1/1 Ready, restart 0과 Argo Synced/Healthy 확인"
  - "/health·/ready 200, 잘못된 API key 401, 인증 embedding 768차원 응답 확인"
limitations:
  - "RollingUpdate가 이전 Ready Pod를 유지해 외부 중단은 없었던 단일 replica 전환 사례"
  - "stale operation 종료는 최신 Git revision과 새 image 존재를 확인한 뒤에만 수행"
  - "Git repository redirect가 다른 artifact registry 이름까지 바꿔 주지는 않음"
featured: true
draft: false
---

## CI와 source sync는 성공했지만 새 image는 선택되지 않았다

ssu-ai-service는 `/health` liveness와 fail-closed `/ready` readiness를 분리했습니다. PR은 테스트를 통과했고 ARM64 image를 새 GitHub owner의 GHCR에 발행했습니다. Helm probe도 `/ready`로 바뀌었습니다.

Argo CD Application은 과거 owner의 repository URL을 계속 사용했지만 GitHub redirect 덕분에 새 chart를 정상 fetch했습니다. 반면 Image Updater annotation도 과거 `ghcr.io` 좌표를 가리켰습니다. container registry 이름은 repository redirect와 별개라 새 owner에 발행된 image를 찾지 못했습니다.

```text
Git source       old owner URL -> GitHub redirect -> new chart synced
image annotation old GHCR owner -> no matching new image
live rollout     new /ready probe + old image -> 404
```

Image Updater는 Application 한 개를 찾았지만 고려한 image는 0개였습니다. Argo는 새 probe를 옛 image에 적용했고, 그 image에는 `/ready`가 없어 replacement Pod가 계속 404를 반환했습니다.

## “GitOps가 틀렸다”가 아니라 두 정본이 갈라졌다

처음에는 readiness 구현이나 FastAPI router 등록을 의심했습니다. 그러나 CI에서 만들어진 새 image에는 endpoint가 있었고, live Pod의 digest가 그 image가 아니었습니다. source Git URL과 OCI image 좌표를 같은 이동 규칙으로 생각한 것이 원인이었습니다.

version-controlled Application manifest에서 repository URL과 image-list owner를 모두 현재 값으로 고쳤습니다. Image Updater가 새 SHA를 선택해 Helm value commit을 만들었지만 rollout은 바로 회복하지 않았습니다. 이전 Argo operation이 `/ready`를 절대 통과할 수 없는 old-image Deployment를 기다리고 있어 최신 revision reconciliation을 시작하지 못했습니다.

## 교착된 operation만 최소 범위로 종료했다

새 image가 registry에 존재하고 Git의 value가 그 SHA를 가리키며 Application 정본도 교정됐음을 먼저 확인했습니다. 그 뒤 불가능한 과거 operation만 종료하고 hard refresh를 요청했습니다. Application이나 Deployment를 삭제하지 않았습니다.

RollingUpdate는 기존 Ready Pod를 계속 남겼기 때문에 새 Pod가 실패하는 동안 외부 서비스 중단은 없었습니다. corrected image의 replacement가 `/ready`를 통과한 뒤에야 옛 Pod가 내려갔습니다.

## 완료 기준은 controller 화면보다 실행 artifact다

최종 검증은 다음 층을 연결했습니다.

- Deployment image가 CI에서 발행한 정확한 SHA인가
- Pod가 1/1 Ready이고 restart 0인가
- Argo CD가 같은 revision에서 Synced/Healthy인가
- `/health`와 `/ready`가 200인가
- 누락·잘못된 `X-API-Key`는 401인가
- 정상 인증 embedding이 768차원 vector를 반환하는가

[배포 트러블슈팅 원문](https://github.com/ghdtjdwn/ssu-ai-service/blob/main/docs/deployment-troubleshooting.md)은 CI run부터 live image와 복구 순서를 남깁니다.

이 장애는 GitOps 도구 하나의 문제가 아니었습니다. Git source, image registry, updater가 각각 다른 식별자를 정본으로 사용했고, redirect는 그중 하나만 보정했습니다. 그래서 배포 검증에서는 “sync 성공”이 아니라 source revision, selected artifact와 live digest를 하나의 chain으로 대조해야 합니다.
