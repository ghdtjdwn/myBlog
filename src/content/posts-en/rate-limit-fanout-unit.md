---
title: "What should a rate limiter count when one API call fans out six times?"
description: "A redesign of a limiter that returned 429 during a normal seat search because its unit did not match the actual upstream call graph."
publishedAt: 2026-07-18
category: backend
activity: personal-project
tags: ["Rate Limiting", "Redis", "Redisson", "Resilience"]
project: ssu-platform
role: "Designed and verified separate library read/write budgets, shared multi-pod caps, and configuration-change semantics"
evidence:
  - "Fan-out, single-flight, and 429 analyses across ssuMCP ADR-0077, 0080, 0085, 0093, and 0097"
  - "The actual call graph in which one all-room search performs six room reads"
validation:
  - "Regression tests showing six normal reads pass, the former 2/s cap fails, and the 2/1 write caps remain"
  - "Redis integration coverage proving a rate-versioned key applies new configuration without a Redis reset"
limitations:
  - "The 20/s cluster and 8/s user values are sized for the current six-room fan-out and observed upstream behavior"
  - "The Redisson limiter does not guarantee strict request ordering or fairness"
  - "Long-term upstream quotas and policy changes require another capacity calculation"
featured: true
draft: false
---

## The user clicked once, but the upstream received six calls

“Find any available seat” is one logical request. The service, however, reads and compares the current state of six library rooms. The initial per-user limit was two calls per second, so our own limiter returned 429 on the third room read. A safeguard against abusive bursts made the normal product path impossible.

```text
1 user request
  -> room A read
  -> room B read
  -> room C read  x old 2/s cap
  -> room D read
  -> room E read
  -> room F read
```

Caching and single-flight reduce duplicate reads for the same key, but they cannot combine six different room keys. The remaining error was the unit consumed by the limiter.

## Reads and writes do not spend the same risk budget

A normal read fans out and does not mutate external state. A reservation write changes an upstream state and carries a higher burst risk. I separated their budgets instead of forcing one number onto both:

```text
read:  cluster 20/s, user 8/s
write: cluster 2/s,  user 1/s
```

Eight user reads accommodate the six-room operation plus a small margin. The conservative write limits remain unchanged. This is not simply a larger limit; it assigns capacity according to the real cost and side effects of each operation.

## The fairness cap must be consumed first

In a multi-pod deployment, Redis shares a per-user cap and a cluster-wide cap. Their order matters. If a request consumes cluster capacity before failing its user cap, one abusive caller can exhaust global budget without sending any corresponding upstream work.

The user cap is therefore acquired first, and only an accepted request spends cluster capacity. The two acquisitions are not a fully atomic transaction with rollback, which is a documented trade-off. The ordering nevertheless prevents rejected requests from burning the common pool before their fairness check.

## A configuration change did not change an existing limiter

A second defect appeared when tuning the value. Redisson's `trySetRate` does not overwrite a limiter that is already configured. Deployment configuration could say 8/s while an existing Redis key continued enforcing 2/s.

The [Redisson reference](https://redisson.pro/docs/data-and-services/objects/#ratelimiter) documents that first-configuration behavior. I encoded the rate version in the limiter key and gave inactive keys a TTL:

```text
library:read:user:{id}:r8
library:read:cluster:r20
```

A changed configuration selects a new key immediately; the old state expires naturally. This makes the relationship between deployment configuration and Redis state explicit without overwriting shared state on every request or requiring a manual key deletion.

## A 429 can be a successful safeguard and a product failure

The regression contract recorded in [ADR-0097](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0097-pyxis-read-cap-fanout-sizing.md) proves that six reads pass, write limits do not drift, and a new configured rate takes effect. Upstream `Retry-After` is also preserved where available.

A limiter returning 429 may be operating exactly as implemented. If the rejected request is the product's primary use case, however, the capacity model is wrong. The correct starting point was not the number of public endpoints, but the upstream fan-out produced by one user action, the different risks of reads and writes, and fairness across users.
