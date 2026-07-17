---
title: "How one failed ECS revision delayed the next deployment for five hours"
description: "Separating a masked shell exit code, ECS launch backoff, and an undersized health grace period to make automatic rollback trustworthy."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["ECS", "GitHub Actions", "Deployment", "Reliability"]
project: geuneul
role: "Diagnosed Geuneul's ECS deployment failures and implemented circuit-breaker rollback and evidence-based health timing"
evidence:
  - "Geuneul TROUBLESHOOTING records for long launch backoff after a bad image and false rollback of a healthy image"
  - "ECS service events, task stop reasons, the GitHub Actions deployment script, and ALB health timing"
validation:
  - "During the original incident, the unstartable revision received no traffic, old tasks remained healthy, and downtime stayed at zero"
  - "A real circuit-breaker rollback event plus successful stabilization after the 240-second adjustment"
limitations:
  - "The timings come from one ECS service and a 0.25-vCPU task, not a universal timeout recommendation"
  - "Deployment safety was verified; zero-downtime capacity under heavy load needs separate load testing"
featured: true
draft: false
---

## The watcher appeared successful while CI was actually red

GitHub Actions had actually failed for one change, but the merge automation treated it as success. The command watching `gh run watch` piped its output through `tail`, and the shell used only the final command's exit code.

```sh
deployment_watch | tail -n 20
```

Even if `gh run watch` failed, a successful `tail` made the local automation see zero. The red-CI image reached main, and ECS repeatedly attempted to start replacement tasks. Existing healthy tasks continued serving traffic, so downtime remained at zero. Repeated launch failures did, however, expand the service's retry interval, and a subsequent healthy revision could not be evaluated promptly for roughly five hours.

A presentation helper had become the source of merge truth. I changed the automation to capture the watch status separately and merge only when the GitHub run conclusion is green. The deployment workflow continues to require service stabilization rather than task-definition registration.

## Close a failed revision instead of retrying indefinitely

I enabled the ECS deployment circuit breaker with automatic rollback. If new tasks cannot reach steady state, ECS marks the deployment failed and restores the previous healthy task definition.

This does more than turn CI red sooner. It closes the failed deployment lifecycle before scheduler backoff contaminates later releases. The original ECS events established that an unstartable task received no traffic while healthy old tasks remained. After enabling the breaker, a later real rollback event and the Terraform service configuration demonstrated the automatic recovery boundary.

## A healthy image was not healthy within 120 seconds

The circuit breaker then exposed the opposite problem: a valid image rolled back. On a 0.25-vCPU task, the Spring application needed about 93 seconds to cold-start. ALB then needed additional consecutive successful checks. The full healthy transition took roughly 150 seconds, while the health-check grace period was 120.

The application was valid; the control plane's time budget was shorter than the measured boot profile. I separated the event timestamps into:

```text
task provisioning -> container start -> application ready
-> target registration -> consecutive ALB health successes
```

I increased the grace period to 240 seconds. This allows cold-start variation, while the circuit breaker still prevents indefinite waiting.

## Deployment success is a control-plane and data-plane intersection

Final verification did not stop at a green workflow. I checked that the new task definition became the service's primary deployment, desired tasks were running, ALB targets were healthy, and application health plus a core query succeeded.

The resulting release contract is:

- shell pipelines preserve the status of the command that determines truth;
- task-definition registration and service stabilization are separate stages;
- a circuit breaker bounds the lifetime of a broken revision;
- health grace comes from measured boot and load-balancer timing;
- completion requires the new task to serve a real request.

The 240-second value is specific to this service on small CPU allocation. A different runtime or task size requires new measurements.
