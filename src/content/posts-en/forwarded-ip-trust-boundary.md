---
title: "Trusting the first X-Forwarded-For value broke rate limiting"
description: "Redesigning client-IP trust across ALB and a BFF, then bounding the rate-limiter map that attacker-controlled keys could grow indefinitely."
publishedAt: 2026-07-17
category: troubleshooting
activity: personal-project
tags: ["Security", "Rate Limiting", "HTTP", "Memory Safety"]
project: geuneul
role: "Designed and verified Geuneul's client-IP trust model and bounded in-memory rate limiter"
evidence:
  - "Geuneul TROUBLESHOOTING records for X-Forwarded-For spoofing and ineffective bucket eviction"
  - "ALB append behavior, the BFF-only header contract, and rate-limiter implementation tests"
validation:
  - "Seven resolver tests covering trusted BFF, direct ALB, malformed, and multi-hop headers"
  - "A 50,000-key adversarial test that retained the map bound plus live fixed-header verification"
limitations:
  - "The limiter is an instance-local approximation and does not share quota across ECS tasks"
  - "Clearing at capacity protects memory but discards some recent history for legitimate clients"
featured: true
draft: false
---

## A proxy header is user input unless its writer is trusted

Geuneul used the first `X-Forwarded-For` value as the key for per-IP rate limiting. That pattern is common in examples, but the actual path was browser, BFF, ALB, and backend.

ALB appends the peer address it observed to the right side of the header. If an external caller sends an arbitrary left value directly, the first value remains attacker-controlled while the address observed by ALB appears last. Rotating the left value on every request creates a new bucket.

```text
attacker header: X-Forwarded-For: fake-1
ALB result     : X-Forwarded-For: fake-1, observed-source
old resolver   : fake-1
```

The mistake was inferring a trusted hop from position alone. A forwarded header is ordinary user input without separate evidence that a trusted proxy wrote it.

## Give BFF and direct traffic different contracts

The BFF knows the browser-facing client address and sends a separate `X-Client-Ip`. The backend accepts that header only when a BFF shared-secret check succeeds. The secret is injected through deployment configuration and never placed in code or logs.

Without that proof, a request arriving directly through ALB uses the rightmost `X-Forwarded-For` value—the address appended by ALB. One resolver normalizes malformed tokens, unexpected multi-hop input, and IPv4 and IPv6 representations.

This replaces rules such as “left is real” or “right is real” with a contract: which proxy may assert a value, and under what proof.

## Spoofing also became a memory-safety failure

The rate limiter stored one in-memory bucket per client key. Cleanup removed old buckets, but every key from the attack was new, so time-based eviction removed nothing. The same input that bypassed a limit could grow the map without bound.

I added a hard capacity. At the limit, the map is cleared to protect process memory. This is coarser than a full LRU, but the limiter is an instance-local buffer rather than the sole security boundary. Losing short rate history is preferable to losing the whole service to OOM.

## Make adversarial input the regression

Seven resolver tests cover trusted BFF, missing or incorrect proof, direct ALB, forged leftmost input, malformed values, and multiple hops. A separate test inserts 50,000 distinct keys and asserts that the map remains within its bound.

Live verification confirmed that requests under a fixed header path map to the same client bucket. I do not claim an end-to-end production attack from arbitrary source addresses; the sandbox could not vary that network property conclusively.

Because each ECS task owns its limiter, this is not a strict global quota. A strong cross-instance limit would require shared or edge enforcement. The repaired boundary prevents unauthenticated input from breaking both identity attribution and process memory.
