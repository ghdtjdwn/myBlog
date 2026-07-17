---
title: "GitOps가 Synced인데 StatefulSet은 왜 옛 설정으로 남았나"
description: "실패하는 probe와 OOM 설정을 Git에서 고친 뒤에도 non-Ready Pod가 교체되지 않은 Kafka·Tempo 운영 장애 기록입니다."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["Kubernetes", "StatefulSet", "Argo CD", "Probes"]
project: ssu-platform
role: "ssuMCP 운영 cluster의 Kafka·Tempo 장애 진단, manifest 수정과 live rollout 검증"
evidence:
  - "ssuMCP TROUBLESHOOTING의 Kafka exec probe와 Tempo memory rollout 사건"
  - "Git revision, StatefulSet template, live Pod spec·event를 분리 비교한 운영 기록"
validation:
  - "Kafka replacement Pod의 Ready 상태와 restart 0 확인"
  - "Tempo replacement Pod의 768Mi limit·GOMEMLIMIT 적용, 안정 상태와 trace 수집 확인"
limitations:
  - "단일 cluster와 해당 StatefulSet controller 상태에서 관찰한 사례"
  - "Pod 삭제는 기존 데이터를 보존하는 구성 확인 뒤 수행했으며 무상태 workload의 일반 해법으로 제시하지 않음"
featured: true
draft: false
---

## 선언 상태와 실행 상태 사이에 세 번째 상태가 있다

Kafka Pod가 계속 readiness probe에 실패했습니다. probe는 `kafka-broker-api-versions.sh`를 실행했는데, 이 명령은 JVM을 새로 띄웁니다. 1초 timeout 안에 JVM 시작과 broker 응답을 모두 끝내지 못해 정상 broker도 non-Ready가 됐습니다.

manifest를 TCP probe로 바꾸고 GitOps sync도 성공했습니다. 그런데 live Pod의 probe는 여전히 옛 exec 명령이었습니다. Git revision은 맞고 StatefulSet template도 새 값인데, 실제 Pod만 갱신되지 않았습니다.

```text
Git desired state       TCP probe
StatefulSet template    TCP probe
running Pod spec        old exec probe
```

`Synced`는 저장소와 controller template이 일치한다는 뜻이지, 모든 기존 Pod가 새 template로 성공적으로 교체됐다는 뜻은 아닙니다.

## non-Ready Pod가 rollout의 출발선을 막았다

StatefulSet은 순서와 identity를 보존하며 Pod를 교체합니다. 기존 Pod가 계속 Ready가 되지 못하면 controller가 안전한 다음 단계로 진행하지 못할 수 있습니다. 이 사건에서는 깨진 readiness 자체가 새 readiness를 받을 rollout을 막았습니다.

데이터 경로와 replication 조건을 확인한 뒤 해당 Pod를 명시적으로 교체했습니다. 새 Pod는 StatefulSet의 TCP probe로 생성됐고 Ready, restart 0을 유지했습니다. 수정 commit 존재 여부가 아니라 live Pod spec과 실제 readiness가 완료 기준이 됐습니다.

## Tempo에서도 같은 모양의 장애가 반복됐다

Tempo는 384Mi memory limit에서 OOM 종료를 반복했습니다. limit을 768Mi로 올리고 `GOMEMLIMIT`도 함께 지정했지만 GitOps 화면만 보면 반영이 끝난 것처럼 보였습니다. live Pod에는 여전히 옛 limit이 남아 있었습니다.

이번에는 앞선 패턴을 이용해 다음 순서로 확인했습니다.

1. application log와 event로 OOM 원인을 확인한다.
2. Git revision과 controller template의 새 resource를 확인한다.
3. live Pod spec이 새 template를 받았는지 비교한다.
4. controller가 스스로 진행하지 못한 이유를 확인한다.
5. 데이터·가용성 조건을 검토한 뒤 최소 Pod만 교체한다.

replacement Pod는 768Mi limit과 `GOMEMLIMIT`을 적용한 채 안정됐고, 실제 trace 유입까지 확인했습니다.

## rollout 검증은 live object에서 끝나야 한다

이 두 장애는 manifest 수정이 틀려서가 아니라 controller가 과거의 실패 상태에서 새 선언으로 수렴하지 못해서 길어졌습니다. 그래서 GitOps 운영에서 최소 세 층을 따로 봅니다.

- Git revision과 rendered desired state
- Deployment·StatefulSet 같은 controller template과 condition
- 실행 중인 Pod spec, event, readiness와 restart

Pod 삭제를 자동 해법으로 삼으면 안 됩니다. 특히 Stateful workload는 데이터, ordinal, replication, disruption budget을 먼저 확인해야 합니다. 핵심은 강제 교체가 아니라, 선언 상태와 실행 상태가 갈라진 지점을 증거로 찾고 가장 작은 복구 동작을 선택하는 것입니다.
