---
title: "Why a Synced StatefulSet kept running the old configuration"
description: "A production incident where Kafka and Tempo remained on broken probes and memory settings even after the Git manifests were corrected."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["Kubernetes", "StatefulSet", "Argo CD", "Probes"]
project: ssu-platform
role: "Diagnosed Kafka and Tempo failures in the ssuMCP cluster, changed manifests, and verified the live rollout"
evidence:
  - "The Kafka exec-probe and Tempo memory-rollout incidents in ssuMCP TROUBLESHOOTING"
  - "Operational comparison of Git revision, StatefulSet template, live Pod spec, and events"
validation:
  - "The replacement Kafka Pod became Ready with zero restarts"
  - "The replacement Tempo Pod used the 768Mi limit and GOMEMLIMIT, remained stable, and received traces"
limitations:
  - "The behavior was observed in one cluster and those specific StatefulSet controller conditions"
  - "Pod replacement followed storage checks and is not presented as a generic fix for stateful workloads"
featured: true
draft: false
---

## There is a third state between declaration and execution

A Kafka Pod repeatedly failed its readiness probe. The probe ran `kafka-broker-api-versions.sh`, which launches a JVM. A one-second timeout was not enough to start the JVM and query the broker, so a functioning broker remained non-Ready.

I replaced the exec probe with a TCP probe, and GitOps sync succeeded. The live Pod, however, still contained the old command. Git had the expected revision and the StatefulSet template had the new value; only the running Pod had not changed.

```text
Git desired state       TCP probe
StatefulSet template    TCP probe
running Pod spec        old exec probe
```

`Synced` established that the repository and rendered controller template agreed. It did not establish that every existing Pod had converged to that template.

## The non-Ready Pod blocked its own replacement

A StatefulSet preserves order and identity while replacing Pods. When an existing Pod cannot become Ready, the controller may be unable to advance through the safe rollout sequence. Here, the broken readiness check prevented the Pod from receiving the corrected readiness check.

After checking the data path and replication conditions, I replaced only the affected Pod. The new Pod was created from the TCP-probe template and remained Ready with zero restarts. The completion criterion was the live Pod spec and readiness, not the existence of a fix commit.

## Tempo repeated the same failure shape

Tempo was being OOM-terminated under a 384Mi memory limit. I increased the limit to 768Mi and set `GOMEMLIMIT`, yet the GitOps view again appeared complete while the live Pod retained the old limit.

The earlier incident provided a faster diagnostic order:

1. Confirm the failure cause from application logs and events.
2. Verify the new resource in the Git revision and controller template.
3. Compare it with the running Pod spec.
4. Determine why the controller did not progress.
5. Review data and availability constraints before replacing the smallest unit.

The replacement Pod used the 768Mi limit and `GOMEMLIMIT`, stayed stable, and accepted real traces.

## Rollout verification ends at the live object

Both incidents lasted longer because the controller could not converge from an existing failure state, not because the manifest fix was wrong. I now inspect three distinct layers in GitOps rollouts:

- the Git revision and rendered desired state;
- the controller template and conditions;
- the running Pod spec, events, readiness, and restart count.

Deleting a Pod is not a default remedy. Stateful workloads require prior checks of storage, ordinals, replication, and disruption constraints. The transferable practice is to locate the exact divergence between declared and running state, then choose the smallest safe recovery action.
