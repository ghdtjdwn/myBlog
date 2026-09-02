---
title: "Cham Domi"
summary: "A Silver Prize winner at the 2026 Soongsil University Computer Science Software Competition, this operating service connects dormitory discovery with explainable roommate matching and chat."
status: operating
statusNote: "The public web app and backend health endpoint are operating. I rechecked the public paths on 2026-08-09; full two-account mutation flows and device-level Push delivery remain additional validation work."
activity: competition
visibility: mixed
role: "Frontend, roommate backend, and operating infrastructure"
teamScope: "Teammates own the core Google/Kakao authentication backend and dormitory search and eligibility logic. I integrated those contracts into the frontend and covered regression and delivery validation."
contributionEvidence:
  - "Frontend implementation, Spring Boot domain.roommate, and OpenAPI-based FE/BE contract synchronization"
  - "Roommate matching and chat tests plus the 2026-07-31 record of 226/226 FE tests and 295 BE tests"
  - "OCI ARM64 k3s and Helm delivery, backup/restore validation, Prometheus boundaries, and deployment provenance"
image: "../../assets/projects/chamdomi-matching-flow.png"
imageAlt: "A flow from eight living habits through database candidate generation, authoritative backend reranking, and Stable Roommates assignment"
screenshots:
  - image: "../../assets/projects/chamdomi-match.png"
    alt: "Cham Domi roommate recommendations showing living-habit tags and compatibility scores of 100 and 89"
    caption: "Recommendations — the list pairs total scores with living-habit tags, while the detail view exposes each score contribution."
  - image: "../../assets/projects/chamdomi-filter.png"
    alt: "Cham Domi filters for sleep, smoking, cleaning, personality, noise, and other living conditions"
    caption: "Explainable filters — hard dealbreakers are applied separately from the score, while users can adjust each living-habit condition."
  - image: "../../assets/projects/chamdomi-chat.png"
    alt: "A Cham Domi one-to-one conversation about roommate living habits"
    caption: "Chat — MySQL and REST history remain authoritative, STOMP carries real-time delivery, and an ID cursor recovers missed events after reconnect."
tags: ["Spring Boot", "Next.js", "Stable Roommates", "WebSocket"]
infra: ["MySQL", "Transactional Outbox", "k3s", "Helm", "Prometheus"]
metrics:
  - { label: "Award", value: "Silver Prize" }
  - { label: "Latest test records", value: "FE 226 · BE 295" }
order: 10
live: "https://chamdomi.vercel.app"
repositories: []
recordPlan: "Private team repositories retain the source code, ADRs, and work logs. Public case studies cover only my contribution and publishable design, validation, and limitations without presenting authentication or dormitory domains as my implementation."
recordLinks: []
---

## Silver Prize and current state

Cham Domi is a three-person team project that connects dormitory eligibility, living-habit-based roommate recommendations, and community features in one mobile web flow. The result notification confirmed its Silver Prize at the 2026 Soongsil University School of Computer Science Software Competition. The public [competition notice](https://cse.ssu.ac.kr/bbs/board.php?bo_table=notice&wr_id=4932) documents the event name, schedule, and award tiers; results were delivered through LMS and direct email to team leads.

After the initial prototype, the team completed real API and authentication contracts, real-time chat, production delivery, and recovery boundaries. On 2026-08-09, I rechecked the public web app, its BFF, and the public backend health endpoint. This confirms the availability of those public paths, not permanent correctness across every authenticated user flow.

## Direct contribution and team boundary

I owned the frontend, Spring Boot's `domain.roommate`, FE/BE API-contract integration, and the dedicated k3s operating infrastructure. My implementation covers living-habit profiles, recommendation and automatic assignment, recruitment posts, one-to-one and group chat, notifications, and the consistency of those data flows.

Teammates implemented the core Google/Kakao authentication backend and dormitory notice analysis, search, and eligibility rules. I integrated those contracts into the frontend, synchronized the OpenAPI snapshot and generated types, and verified that teammate changes did not break roommate or delivery boundaries. I keep the product result separate from my individual technical contribution.

## Explainable recommendation and stable assignment

The recommendation score combines eight living-habit dimensions: sleep, smoking, cleaning, noise, communication, personality, temperature, and sharing. It uses ordinal distance and partial similarity rather than counting only exact matches. Hard constraints such as smoking, sleep, and noise are applied as dealbreakers before scoring. The response includes per-item contributions so users can inspect why a candidate received a score.

To prevent TypeScript and Java rounding differences from changing rank order, each contribution accumulates in integer tenths before positive half-up rounding. MySQL applies filters across the candidate set and returns the top 400. Spring Boot recalculates the same contract and returns an authoritative top 200, with profile ID as a deterministic tie-breaker.

Automatic multi-person assignment uses Irving's Stable Roommates algorithm. A brute-force oracle enumerates all perfect matchings for small inputs. The implementation was compared with 400 randomized inputs each at `n=4` and `n=6` to validate blocking-pair and no-solution behavior.

## Real-time chat on an authoritative database

WebSocket is not the source of truth. Messages, read state, and membership are authoritative in MySQL and REST history, while STOMP/WebSocket carries committed state quickly. After a disconnect, the client retrieves messages after its last known ID to recover missed delivery.

A client UUID and a `(sender_id, client_message_id)` unique constraint prevent retries from storing duplicate messages. Group chat stores message or membership changes and the outbox row in one transaction. Multiple workers divide events with `FOR UPDATE SKIP LOCKED`; claim tokens, a 30-second lease, backoff, and dead-letter handling separate stale workers from repeated delivery failure.

The browser cannot read the REST token. A Next.js BFF retains the HttpOnly session and validates mutation origins. WebSocket avoids putting a long-lived JWT in a URL by sending a 30-second, single-use connection ticket in the STOMP CONNECT header.

## Delivery, recovery, and observability as completion criteria

The frontend runs on Vercel and the backend on a single OCI ARM64 k3s node. Delivery checks the exact Git SHA and OCI digest, requires a fresh backup and restore verification, and then performs the Helm rollout and Flyway migration. A health check fails closed when the installed bundle, chart and runtime digests, or deployed revision drift from the expected source—even if HTTP still responds.

Prometheus records outbox outcomes, oldest pending-event age, and WebSocket capacity without user or room identifiers. The management port is separate from the public application port, and NetworkPolicy admits only selected monitoring Pods. There is no external Alertmanager receiver yet, so loaded rules are not presented as completed external notification delivery.

## Validation and limits

I use separate 2026-07-31 delivery records as the latest snapshot. Frontend PR #45 recorded 226/226 Vitest cases and 8/8 deployment-policy Node tests. A separate BE and infrastructure delivery recorded 295 backend tests with zero failures or errors, generated-type parity across 75 OpenAPI paths, real MySQL V11-to-V19 migrations, Helm and Kubernetes schemas, backup and restore, and deployment boundaries. I do not combine them into one integrated run or present them as newly rerun product tests for this page update.

The backend currently has one replica. Connection tickets, presence, and some rate limits are in memory, so adding replicas without moving those states would be unsafe. Automatic assignment is not persisted, and one-to-one real-time events do not yet use the durable outbox used by group chat. Full two-account login and mutation E2E plus device-level Push permission, receipt, and click flows remain to be validated.
