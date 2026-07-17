---
title: "Cross-instance real-time updates without adding Redis"
description: "Using PostgreSQL NOTIFY only as invalidation, then combining authoritative rereads with SSE snapshots for a small multi-instance ECS service."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["PostgreSQL", "SSE", "ECS", "Distributed Systems"]
project: geuneul
role: "Designed and implemented the surge detection, trigger, listener, and SSE recovery contracts"
evidence:
  - "Geuneul ADR-0016 and its comparison of cross-instance invalidation alternatives"
  - "The PostgreSQL trigger, LISTEN/NOTIFY integration, SSE snapshot endpoint, and polling fallback"
validation:
  - "Integration tests using real PostgreSQL NOTIFY plus listener and SSE unit tests"
  - "Multi-instance path verification that each process rereads and emits the same latest snapshot"
limitations:
  - "LISTEN/NOTIFY is not a durable log; a listener can miss a signal while disconnected"
  - "The choice assumes at most three ECS instances and a low event rate, not a large event stream"
featured: true
draft: false
---

## An in-memory event cannot reach another instance

Geuneul sends an SSE update when congestion or risk signals surge in an area. An application event is sufficient in one process. With an ECS service that can scale to three instances, the process handling the change may differ from the one holding a user's SSE connection.

Kafka would provide a durable stream and replay, but its operational cost exceeded the feature's event rate and scale. Redis Pub/Sub was another option, but Redis already served as disposable cache. I did not want a cache outage to become the consistency boundary for real-time state.

PostgreSQL was the only authoritative state shared by every instance, so I used `pg_notify` as a cross-instance invalidation signal.

## Send “read again,” not the business state

A trigger on the committing transaction publishes only a small region identifier. Each application instance holds a dedicated `LISTEN` connection. On notification, it rereads the current state from PostgreSQL and emits that snapshot to its local SSE clients.

```text
transaction commit
  -> trigger / NOTIFY(region key)
  -> every instance LISTEN
  -> authoritative database reread
  -> local SSE clients receive snapshot
```

The payload deliberately does not contain the finished business event. NOTIFY is not a durable queue; a disconnected listener can miss it. Treating its payload as truth would permanently diverge application state. A missed signal does not delete the committed row, so the database reread remains the consistency boundary.

## Snapshot polling repairs disconnected time

The browser does not build state exclusively by applying SSE deltas. It fetches a snapshot on initial connection and reconnect, and uses low-frequency polling when the stream is unhealthy. SSE reduces latency; snapshots restore correctness.

The listener has reconnect and health handling. Its dedicated connection is separate from ordinary pooled queries, and shutdown closes both LISTEN resources and SSE emitters. Bursts for the same region are coalesced to avoid redundant rereads.

## Pay the consistency cost appropriate to the scale

Integration tests cover a real PostgreSQL trigger producing NOTIFY and the listener rereading state. Separate tests cover SSE connect, disconnect, snapshot replacement, and fallback behavior. The central assertion is not the number of delivered notifications; it is that the eventual snapshot equals the latest database state.

This design is specific to a low event rate and at most three instances. If ordering, long-term replay, or consumer offsets become requirements, a durable log is the better boundary. The goal was to respect distributed-state failure modes without operating a broker before it provided real value.
