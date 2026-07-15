---
title: "Aligning identity boundaries from the browser to private MCP tools"
description: "How discarding client-claimed principals and separating a server-verified subject from an explicit MCP session prevents IDOR on principal-owned threads and silent privilege downgrade."
publishedAt: 2026-07-15
category: backend
activity: personal-project
tags: ["Authentication", "IDOR", "MCP", "LangGraph"]
project: ssu-platform
role: "Designed, implemented, and validated identity propagation across ssuAI, ssuAgent, and ssuMCP"
evidence:
  - "ssuMCP ADR-0098 and the 52-tool live-audit remediation record"
  - "ssuAI ADR-0086 for client-principal stripping and server-subject injection"
  - "ssuAgent ADR-0011 for stable-principal thread binding and lazy migration"
validation:
  - "No-binding, random, invalidated, and mismatched-session denial across 28 private MCP tools"
  - "17 ssuAI agent-proxy tests for stripping, the three-second verifier, and fail-closed 401/503 behavior"
  - "Eight core ssuAgent ownership tests for re-login, foreign principals, and lazy migration"
limitations:
  - "No real university-account writes; write paths use mocked connectors and an isolated database"
  - "sha256(principal) minimizes stored plaintext; anti-forgery comes from the server proxy and service API-key boundary"
  - "Unauthenticated traffic retains the existing session and anonymous contract"
  - "Ownerless anonymous threads remain accessible to anyone under the existing contract and sit outside the authenticated-principal ownership guarantee"
featured: true
draft: false
---

## A rotating session ID is not a user identity

Using `mcp_session_id` as the owner of a conversation thread initially looks reasonable. The value rotates on re-login, however. The same person can lose access to an earlier conversation, while loose session resolution can expose or confirm state that belongs to another session.

The audit found the more dangerous version. When a private MCP tool received an invalid explicit session ID, some paths resolved again through the transport-bound session. The requested session was invalid, yet execution silently fell back to whichever other session happened to be connected.

I did not make one identifier solve both problems.

- Long-lived conversation ownership uses a stable, server-verified subject.
- University credentials and tool state use an exactly resolved MCP session.

## Split trust across three boundaries

```text
Browser
  │  bearer token + message (body principal is untrusted)
  ▼
ssuAI server proxy
  │  remove body principal → verify through ssuMCP /api/auth/me → inject subject
  ▼
ssuAgent
  │  authenticate proxy with service API key → compare sha256(subject) ownership
  ▼
ssuMCP
     resolve an explicit session exactly and bind private tool state to that owner
```

The ssuAI proxy removes `principal` from the browser body regardless of its value. It validates the bearer through ssuMCP `/api/auth/me` and injects only the verified subject into ssuAgent. The JWT itself does not travel into the orchestration service, so token verification retains one owner.

In production, ssuAgent trusts only requests that pass the service API-key boundary. It stores `sha256(principal)` instead of the plaintext subject. This minimizes plaintext in the ownership index; it is not anti-forgery. An enumerable identifier remains guessable after hashing. Authenticity comes from server-only injection and proxy authentication.

## Do not downgrade authentication failures to anonymous

A request with no bearer may use the existing anonymous or session path. Once a bearer is presented, the outcome is explicit.

| Verification result | Behavior |
| --- | --- |
| Valid subject | Remove the client principal and inject the verified subject |
| Expired or rejected token | Stop with 401 |
| Verifier timeout, 5xx, or malformed response | Stop with 503 |

Falling back to a session owner after verification failure silently changes the authorization tier. It can reopen a principal-owned thread under a new session or make conversation history appear to disappear. The verifier therefore has a three-second budget, but failure stops before ssuAgent is called.

## An explicit MCP session must mean exactly that session

[ssuMCP ADR-0098](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0098-authoritative-mcp-session-resolution.md) defines the separate tool-state boundary.

1. A nonblank explicit ID is looked up exactly.
2. Missing, expired, or invalidated IDs return `INVALID_SESSION` without transport fallback.
3. A valid explicit ID different from the current transport binding returns `SESSION_MISMATCH`.
4. Only an omitted ID may use the current transport binding.
5. Denial responses reveal neither another session ID nor a login URL.

Provider credentials, actions, wait intents, LMS previews, and exports belong to the resolved MCP owner. A stable subject owning conversation history does not collapse provider credentials into the same identifier.

## Upgrade existing threads exactly once

Threads written before the change had no stable subject. A batch job cannot infer a subject the system never stored.

Lazy migration upgrades a session-owned row only on the first request that presents both the rightful existing session and a server-verified principal. Future MCP sessions with the same principal can use the thread; an old session without the principal is rejected after the upgrade. Tests fix the invariant that this migration happens once.

## Validate denial combinations, not just test totals

The [live-tool audit record](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/audits/2026-07-14-live-tool-hardening.md) verifies the contract inventory for 52 registered tools. It sends no-binding, random explicit, invalidated explicit, and valid-but-different explicit IDs through 28 private tools. Every path must deny access without disclosing private data or session information.

ssuAI tests cover client-value stripping, subject injection, verifier timeout, and distinct 401/503 failures. ssuAgent tests cover re-login with the same principal, foreign-principal takeover attempts, anonymous compatibility, one-time migration, and rejection of session-only access after migration. No real university-account write was performed; write flows remain within mocked connectors and an isolated database.

The important result is not another identifier. It is a contract for what each value proves and whether failure may ever be reinterpreted as a different identity. The proxy decision is in [ssuAI ADR-0086](https://github.com/ghdtjdwn/ssuAI/blob/main/docs/adr/0086-server-side-principal.md), and thread ownership is in [ssuAgent ADR-0011](https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0011-thread-stable-principal-binding.md).
