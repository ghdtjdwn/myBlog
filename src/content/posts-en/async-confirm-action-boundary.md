---
title: "Why I replaced an eight-second confirmation request with an asynchronous intent"
description: "A write-path redesign that released Tomcat request threads immediately and fixed an overly broad rule that could supersede unrelated pending approval actions."
publishedAt: 2026-07-18
category: backend
activity: personal-project
tags: ["Spring Boot", "Async", "Concurrency", "MCP"]
project: ssu-platform
role: "Designed, implemented, and verified the ssuMCP confirmation API, approval-action scope, and reservation-intent status retrieval"
evidence:
  - "The synchronous throughput analysis and scoped-supersede decision in ssuMCP ADR-0086"
  - "Code and dependency inspection showing that the installed WebMVC MCP transport used a blocking call path"
validation:
  - "Regression tests for action ownership, TTL, explicit IDs, and the real schema in H2 PostgreSQL mode"
  - "Verification of immediate confirmation acceptance followed by the get_library_wait_status contract"
limitations:
  - "Asynchronous acceptance improves the request boundary but cannot guarantee success at the external university system"
  - "Owner-wide supersede remains intentional on the web and LMS paths because their existing UX contracts differ"
  - "The throughput figure is an upper-bound estimate, not a real PostgreSQL contention or external-reservation load test"
featured: true
draft: false
---

## Approval was holding the HTTP request open until the work finished

Library reservations use a `prepare → user approval → confirm` sequence so that a model cannot perform a write directly. That safety boundary existed, but the MCP `confirm_action` call waited as long as eight seconds for the external reservation result before returning.

The concern was not merely slow latency. I followed the installed Spring WebMVC MCP transport and confirmed that the tool call executed a blocking service path on a Tomcat request thread. If one request can occupy a thread for eight seconds, a 200-thread pool has a rough theoretical ceiling of about 25 such requests per second. A slower upstream therefore reduced our own admission capacity.

## I separated acceptance from completion

I changed confirmation from “the reservation has finished” to “the validated intent has been durably accepted.”

```text
prepare
  -> PENDING approval action (ActionAudit)
user approval
  -> confirm(actionId)
  -> accepted response + reservation intentId
reservation intent
  -> REQUESTED
  -> [WAITING_FOR_SEAT] -> RESERVING
  -> SUCCEEDED | FAILED_RACE | FAILED_AUTH | FAILED_UPSTREAM
  -> CANCELLED | EXPIRED
client
  -> get_library_wait_status(mcp_session_id, intent_id)
```

The request now performs only work that must be atomic at the boundary: validate ownership and TTL, reject duplicate consumption, persist an executable intent, and return its identifier. A worker calls the university system, while the client obtains the terminal outcome through a separate status operation.

This also distinguishes transport success from business success. The accepted response means that a traceable reservation intent exists; it is not an `ACCEPTED` enum state and does not claim that a seat has already been reserved.

## The pending-approval supersede key was too broad

The redesign exposed a separate, more dangerous transition. When `prepare` created an `ActionAudit`, it superseded every PENDING approval action owned by the same user. Consecutive preparations for different operations or seats could therefore invalidate one another even though they were unrelated.

MCP actions already carry a target, so I narrowed supersession to:

```text
(owner, actionType, targetKey)
```

Only a newer PENDING action for the same user, operation, and target replaces its predecessor. Approval actions for other targets remain independent. I deliberately retained owner-wide behavior on the web and LMS paths because those entry points had a different established contract. Reusing one rule everywhere would have been simpler in code but incorrect in meaning.

## Concurrency tests need to assert transitions, not only response time

The regression suite does more than verify an immediate response. Unit cases cover forged ownership, expired and consumed actions, and explicit IDs. A Flyway-built H2 schema in PostgreSQL mode proves that re-preparing the same target alone supersedes its predecessor while two different targets remain PENDING. Real PostgreSQL lock contention and external reservation load are outside this evidence. Returning a thread quickly is not sufficient; an asynchronous API must make duplicate execution impossible and its terminal outcome observable.

[ADR-0086](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0086-confirm-action-async-and-scoped-supersede.md) records the capacity reasoning, alternatives, and transition contract. The change decouples upstream latency from request-thread lifetime, but worker backlog and upstream failures still require metrics, expiry, and retry policy. Asynchrony did not remove failure. It placed failure in a state machine that the service could own and explain.
