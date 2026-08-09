---
title: "Keeping MySQL authoritative in group chat"
description: "How STOMP became a fast delivery layer while idempotency keys, a transactional outbox, and cursor recovery connected durable group-chat state to real-time UX."
publishedAt: 2026-08-09
category: backend
activity: competition
tags: ["Transactional Outbox", "WebSocket", "Idempotency", "MySQL"]
project: cham-domi
role: "Implemented the Cham Domi frontend, roommate backend, and operating infrastructure"
evidence:
  - "Spring Boot and Flyway implementation that stores messages, membership changes, and outbox rows transactionally"
  - "The FE/BE chat contract connecting REST cursors, STOMP tickets, and client request generations"
  - "Roommate-chat decisions, work logs, and deployment provenance retained in the private team repositories"
validation:
  - "Separate 2026-07-31 delivery records: 295 BE tests with zero failures or errors, 226/226 FE tests, and 8/8 Node policy tests"
  - "MySQL 8 validation of SKIP LOCKED worker partitioning, lease recovery, stale-claim rejection, and V11-to-V19 migrations"
  - "Operating public health, Prometheus target and rules, and blocked public actuator exposure"
limitations:
  - "One-to-one real-time events do not yet use the durable outbox used by group chat"
  - "Single-replica tickets, presence, and some rate limits remain in memory and must move to shared state before horizontal scaling"
  - "Full two-account mutation E2E and device-level Push receipt and click flows are incomplete"
featured: true
draft: false
---

## I chose not to trust a real-time connection as the database

Cham Domi, whose result notification confirmed a Silver Prize at the 2026 Soongsil University School of Computer Science Software Competition, creates a group room for users accepted through a roommate recruitment post. Users expect messages to appear immediately, but a WebSocket can disappear whenever a phone changes networks or a browser enters a power-saving state.

Treating STOMP delivery as a successful write leaves no authoritative recovery point for a disconnected user. REST polling alone, however, lacks immediacy. I separated those responsibilities.

```text
HTTP command
  └─ MySQL transaction: message + membership state + outbox
       ├─ REST history and cursor: authoritative recovery path
       └─ outbox worker -> STOMP user queue: low-latency delivery
```

MySQL and REST history own the state. STOMP carries committed changes quickly. If a client misses a real-time event, it can converge by loading messages after its last known ID.

## A retry must converge to one stored message

A mobile client may retry the same send after losing its connection before receiving a response. Storing every attempt as a new row gives the user duplicate messages.

The client generates a UUID `clientMessageId`, and the database uses a `(sender_id, client_message_id)` unique constraint as the final serialization point. A retry with the same room and content returns the existing message. Reusing the key for another room or payload returns `409 Conflict`.

The conflict path revalidates current membership and permissions before returning the authoritative row. If removal, leaving, or rejoining changed the membership epoch, an old success cannot be replayed under new permissions. When message plaintext is removed, a length-prefixed HMAC-SHA-256 fingerprint over the domain, sender, room, key, and content preserves payload comparison without retaining the original text.

An application-level existence check cannot close the race: two requests can both observe absence and then insert. The database constraint decides the conflict, and a separate transaction reloads the authoritative row afterward.

## A transactional outbox closes the commit-to-publish gap

Saving a message and publishing it directly to STOMP creates two failure windows.

- Publishing before commit can expose a message that later rolls back.
- Crashing after commit can leave a durable message without real-time delivery.

Group messages plus read or membership changes store an outbox row in the same database transaction. A worker claims only committed events and publishes them to STOMP. Delivery is at least once, so the client converges duplicate events using event and message identities.

MySQL 8 `FOR UPDATE SKIP LOCKED` partitions batches across workers. Each claim records a token and a 30-second lease. A slow worker returning after lease recovery cannot complete the new worker's claim because completion requires the current token. Transient failures back off for up to eight attempts, and repeated failures move to a dead-letter state.

I do not describe this as exactly-once delivery. The unique constraint makes message storage converge once, while event delivery is at least once and consumers are designed to make duplicate delivery harmless.

## Cursors and revisions converge after reconnect

The client does not trust the arrival order of REST responses and WebSocket events. It retains a room revision and last message ID, then loads history with an `afterId` cursor after reconnect. Request generations and high-watermarks prevent an older room-list snapshot from reviving newer messages or deletion state.

Read cursors increase monotonically. A late server snapshot cannot raise the current unread value, and duplicate deletion responses from REST and WebSocket cannot decrement unread twice. A request started before leaving a room is discarded if the session or request generation changed by completion time.

Real-time authentication does not place a long-lived JWT in a URL query. The browser uses the HttpOnly session at the Next.js BFF to obtain a 30-second, single-use ticket and sends it in the STOMP CONNECT header. Per-user session and message-burst limits keep chat connections from exhausting ordinary REST capacity.

## Validation creates the race and failure windows

Small unit tests cannot validate transaction and worker competition by themselves. MySQL 8 integration tests checked that two workers divide two outbox rows without overlap, that a claim is recoverable only after lease expiry, and that a stale token cannot complete the recovered claim. Message tests cover concurrent use of the same UUID, conflicting payloads, current-membership revalidation, and monotonic cursors.

I kept the separate 2026-07-31 delivery records distinct. Frontend PR #45 recorded 226/226 tests and 8/8 deployment-policy Node tests. A separate backend and infrastructure delivery recorded 295 backend tests with zero failures or errors plus real MySQL V11-to-V19 migration validation. Operations expose low-cardinality metrics for outbox outcomes, oldest pending age, and WebSocket capacity, while the public application port blocks actuator access.

For this article, I checked those records against the current implementation but did not rerun the entire product suite. I therefore label the counts as validation from July 31.

## Current limits define the next scaling gate

The backend currently has one replica, so single-use tickets, presence, and some rate limits remain in process memory. A shared TTL store such as Redis and an external STOMP broker are prerequisites to safe horizontal scaling. One-to-one real-time events also lack the durable outbox used by group chat, with REST cursors providing recovery after a disconnect.

Full browser E2E across two accounts—acceptance, removal, leaving, rejoining, and reconnect—and device-level Push permission, receipt, and click flows remain incomplete. There is no external Alertmanager receiver, so validated metrics and loaded rules are not presented as completed notification delivery. Until those boundaries close, I describe this as an operating single-node competition service rather than a horizontally scaled chat platform.
