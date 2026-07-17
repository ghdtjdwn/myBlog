---
title: "Reducing 100 same-seat requests to one upstream write"
description: "A durable reservation queue using Postgres intents, short claim leases, an outbox, and seat-level coordination around a non-idempotent school API."
publishedAt: 2026-07-17
category: backend
activity: personal-project
tags: ["PostgreSQL", "SKIP LOCKED", "Outbox", "Concurrency"]
project: ssu-platform
role: "Designed and implemented the intent state machine, worker, outbox, recovery contract, and load validation"
evidence:
  - "ssuMCP ADR-0022, ADR-0047, ADR-0079, and the library-agent k6 baseline"
  - "Cross-checked database, WireMock, and metric evidence from a 100-user same-seat burst"
validation:
  - "Observed one SUCCESS, 99 FAILED_RACE outcomes, and exactly one upstream reserve POST"
  - "Re-measured cache and single-flight reducing 24,000 reads to roughly 42 upstream calls"
  - "Observed zero upstream calls while about 1,000 requests continued during an open circuit"
limitations:
  - "WireMock delays and local absolute latency are not presented as real Pyxis performance"
  - "A successful upstream write followed by failed terminal persistence still requires read-after-uncertainty and operational review"
  - "The Redis seat lock has no fencing and is an efficiency mechanism, not the final correctness authority"
featured: true
draft: false
---

## A row lock does not serialize competition for the same seat

The initial reservation path executed the external Pyxis write on the request thread after `prepare → confirm`. A pessimistic lock on one action row prevented the same consent from being consumed twice. It did not stop 100 users from owning 100 different action rows that targeted one seat.

The first burst converged to two successes and 98 race failures with no action left in an executing state. The per-row state machine was consistent, but all 100 writes reached the school system and correctness ultimately depended on the upstream race.

The target changed from “our rows eventually settle” to “send only the upstream writes that are necessary.”

## Intents execute; audit rows prove consent

The design keeps distinct responsibilities:

- `action_audit` preserves what the user approved;
- `library_reservation_intents` is the durable worker execution unit;
- `library_reservation_outbox` records events atomically with state transitions.

```text
REQUESTED → WAITING_FOR_SEAT → RESERVING → SUCCEEDED
                                      ↘ FAILED_RACE
                                      ↘ FAILED_AUTH
                                      ↘ FAILED_UPSTREAM
```

An immediate confirmation can move directly from `REQUESTED` to `RESERVING`. A wait intent backs off into `WAITING_FOR_SEAT` when no candidate is available. `wait_for_library_seat` is the explicit exception where registration itself is consent.

## Do not hold a claim transaction across HTTP

The worker selects eligible rows with `FOR UPDATE SKIP LOCKED`, writes `RESERVING` and `locked_until`, and commits. Only then does it call the external read and reservation APIs.

Holding database locks across a slow network call would couple other workers, vacuum, and status queries to upstream latency. A lease carries temporary ownership; a second short transaction stores the terminal state and outbox event together.

The process can die after Pyxis accepted a write but before terminal persistence. Blindly retrying a non-idempotent `reserve` call is unsafe. The lease reaper instead reads `getCurrentCharge()`:

```text
charge exists       → SUCCEEDED
no current charge   → FAILED_UPSTREAM
credential rejected → FAILED_AUTH
```

An uncertain response becomes a read-after-uncertainty decision, not a write replay.

## Collapsing a burst across worker ticks

Within one worker tick, intents are grouped by seat and only one winner reaches Pyxis. The first improved run already returned one success and 99 race failures, but WireMock still observed two POSTs when the burst crossed tick boundaries.

A narrow suppression rule therefore closes later immediate groups locally when the same seat already has a recent terminal attempt within the action TTL. Across pods, a Redisson seat lock further reduces simultaneous calls.

The Redis lock is not the correctness source. Without fencing, it cannot prove mutual exclusion through every GC pause or network partition. Postgres state and observed upstream results remain authoritative; the lock exists to reduce upstream cost.

## Accepting more latency for upstream protection

The same local harness produced:

| Path | direct confirm | intent worker |
| --- | ---: | ---: |
| upstream reserve POSTs | 100 | 1 |
| outcome | 2 success / 98 race | 1 success / 99 race |
| confirm p95 | 1.50s | 3.08s |

Waiting for a worker tick and durable transitions increased user latency. The improvement is not a faster confirmation. It is a 100-to-1 reduction in write amplification from a single egress IP to a school system.

A later run showed the complementary read and failure boundaries. Cache plus single-flight reduced 24,000 reads to roughly 42 upstream calls. During a 25 RPS injected failure, the open circuit received about 1,000 application requests over roughly 40 seconds while sending zero calls upstream. Reads, contended writes, and upstream outages are protected by different mechanisms and measured independently.
