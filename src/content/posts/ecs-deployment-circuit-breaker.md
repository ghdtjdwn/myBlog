---
title: "실패한 ECS 배포가 5시간 뒤까지 다음 배포를 막은 이유"
description: "shell pipeline의 가려진 exit code, ECS launch backoff, 너무 짧은 health grace를 분리해 자동 rollback을 신뢰할 수 있게 만든 기록입니다."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["ECS", "GitHub Actions", "Deployment", "Reliability"]
project: geuneul
role: "Geuneul ECS 배포 장애 분석, circuit breaker·rollback과 health timing 조정"
evidence:
  - "Geuneul TROUBLESHOOTING의 bad image 장기 launch backoff와 정상 image false rollback 기록"
  - "ECS service event, task stop reason, GitHub Actions 배포 script와 ALB health timing"
validation:
  - "원 장애에서 부팅 불가 revision이 traffic을 받지 못하고 기존 healthy task가 유지돼 downtime 0 확인"
  - "실제 circuit-breaker rollback event와 240초 조정 뒤 정상 revision의 service 안정화 확인"
limitations:
  - "당시 단일 ECS service와 0.25 vCPU task의 관측값이며 모든 workload의 권장 timeout이 아님"
  - "배포 안전성을 검증했지만 고부하 상태의 무중단 capacity는 별도 load test가 필요함"
featured: true
draft: false
---

## 배포 감시 명령은 성공으로 보였지만 실제 CI는 빨간색이었다

한 변경의 GitHub Actions는 실제로 실패했지만 merge 자동화는 성공으로 판단했습니다. 상태를 확인하던 `gh run watch` 출력을 `tail`에 pipe하면서 shell이 pipeline 마지막 명령의 exit code만 사용했기 때문입니다.

```sh
deployment_watch | tail -n 20
```

`gh run watch`가 실패해도 `tail`이 정상 종료하면 로컬 자동화가 본 값은 0이었습니다. 빨간 CI의 image가 main에 반영됐고 ECS scheduler는 새 task 시작을 반복했습니다. 기존 healthy task는 트래픽을 계속 처리해 downtime은 없었지만, 연속 실패로 service의 task launch 간격이 늘어나 다음 정상 revision도 약 5시간 동안 빠르게 검증되지 못했습니다.

로그를 보기 좋게 줄이는 명령이 merge 판단의 진실 공급자가 되어버린 문제였습니다. 자동화는 실제 watch exit code를 별도 변수로 보존하고 GitHub run conclusion이 green일 때만 merge하도록 바꿨습니다. 배포 workflow도 task definition 등록이 아니라 service 안정화를 완료 조건으로 유지합니다.

## 실패를 오래 재시도하지 않고 이전 revision으로 닫는다

ECS deployment circuit breaker와 automatic rollback을 활성화했습니다. 새 task가 steady state에 도달하지 못하면 deployment를 실패로 확정하고, 이전 healthy task definition으로 service를 되돌립니다.

이 선택은 단순히 CI를 빨리 빨갛게 만드는 기능이 아닙니다. 깨진 deployment가 scheduler의 장기 backoff 상태를 만들기 전에 실패 수명주기를 종료합니다. 원 장애의 ECS event에서는 부팅 불가 task가 traffic을 받지 않고 기존 healthy task가 유지된 것을 확인했습니다. circuit breaker 적용 뒤에는 다음 사건의 실제 rollback event와 Terraform service 설정으로 자동 복귀 경계가 작동함을 확인했습니다.

## 정상 image도 120초 안에는 healthy가 아니었다

circuit breaker를 켠 뒤에는 반대 문제가 나타났습니다. 정상 image가 rollback됐습니다. 0.25 vCPU task에서 Spring application cold start는 약 93초였고, 그 뒤 ALB health check가 연속 성공 조건을 채우는 데 시간이 더 필요했습니다. 전체 healthy 판정은 약 150초였지만 health check grace period는 120초였습니다.

image나 application이 잘못된 것이 아니라 배포 제어 plane의 시간 예산이 실제 boot profile보다 짧았습니다. event timestamp를 다음 구간으로 나눠 확인했습니다.

```text
task provisioning -> container start -> application ready
-> target registration -> consecutive ALB health successes
```

grace period를 240초로 늘렸습니다. 관측된 150초에 작은 여유만 더하는 대신 cold-start 변동을 수용하되, circuit breaker가 무한 대기를 막도록 두 경계를 함께 사용했습니다.

## 배포 성공은 control plane과 data plane의 교집합이다

최종 검증은 workflow의 초록 표시만 보지 않았습니다. 새 task definition이 service의 primary deployment가 됐는지, task가 원하는 수만큼 running인지, ALB target이 healthy인지, application health와 핵심 조회가 정상인지 확인했습니다.

이 사건 이후 배포 계약은 다음처럼 정리됐습니다.

- shell pipeline이 원 명령의 실패를 보존한다.
- task definition 등록과 service 안정화를 다른 단계로 본다.
- circuit breaker가 실패한 revision의 수명을 제한한다.
- grace period는 실제 cold-start와 load balancer 판정 시간을 근거로 정한다.
- 완료는 새 task가 실제 요청을 처리하는 것으로 확인한다.

240초는 보편적인 정답이 아닙니다. 작은 CPU에서 관측한 이 서비스의 시간 예산입니다. instance 크기나 boot path가 바뀌면 다시 측정해야 합니다.
