---
title: "Why a 3/3 connection indicator still left private tools unavailable"
description: "A three-service authentication incident resolved by separating web identity, provider credentials, and MCP session grants."
publishedAt: 2026-07-17
category: backend
activity: personal-project
tags: ["Spring Security", "Transactions", "MCP", "Identity"]
project: ssu-platform
role: "Designed, implemented, and validated persistent credential copies, MCP grants, and the frontend connection contract"
evidence:
  - "Provider grant and status contracts in ssuMCP PR #223 and ssuAI PR #245"
  - "The 2026-07-16 incident record reproducing web-session 500s and the false 3/3 state"
validation:
  - "Integration tests for proxied transactions, partial grants, compensation cleanup, and subject verification"
  - "Successful backend and frontend main CI and Security workflows"
  - "Production full-grant academic E2E, unauthenticated 401, hostile-Origin 403, and absence of new web-session 5xx responses"
limitations:
  - "Pre-V17 in-memory credentials cannot be recovered and require one provider reconnection"
  - "Full production E2E for partial grants and focus or JWT rotation remains"
  - "This record does not claim direct ArgoCD or running-Pod verification from the current kube context"
featured: true
draft: false
---

## A valid login is not a provider connection

The ssuAI header reported u-SAINT, LMS, and the library as connected. Private academic and LMS questions nevertheless returned connection guidance, while `POST /api/mcp/auth/web-session` produced HTTP 500.

The agent prompt and the user's login were plausible first suspects. Prometheus placed the 500 before the agent boundary, however, and the access token was valid. That evidence separated three facts that the old UI had collapsed:

```text
web identity         the server authenticated this user
provider credential  a durable credential can access an upstream school system
MCP session grant    this particular MCP session received a usable credential copy
```

A valid JWT does not prove that a SAINT or LMS credential row exists. A past successful query does not prove that a newly issued MCP session can use that credential either.

## How a transactional method ran without a transaction

When a credential row existed, the integration reproduction failed because `findForUpdate()` ran outside an active transaction. A persistence method did carry `@Transactional`, but `copyForSession()` invoked that method on the same bean.

Spring's default proxy-based transaction interceptor runs when a call crosses the proxy. Self-invocation bypassed it, leaving the locking query without the transaction its name suggested.

The missing-row case was quieter. Session creation returned 201 with no linked providers, and the old response could not express that empty grant. The UI therefore displayed 3/3 for a session that could not access either private provider.

## Treat the server-issued grant as the source of truth

The complete `copyForSession()` operation now owns the outer transaction. It preserves source expiry and health, re-encrypts the credential under a new opaque owner key, and includes only successfully copied providers in `linkedProviders`.

If issuance fails midway, compensation removes both the MCP session and credentials already copied for it. One missing provider does not disable an independent library-only flow, but it is no longer reported as connected.

ssuAI also stopped inferring connection state from an access token or cached request history. Before a private stream or HITL flow, it waits for a single-flight issuance and uses the returned grant as its only authority. The status endpoint verifies subject ownership for JWT-backed sessions or an active library session for library-only mode, then reloads the current grant for the exact session id.

Using `studentId` as a shared provider principal was rejected. It would let multiple MCP sessions share one mutable credential namespace and blur revocation boundaries. Web identity proves the user; the provider grant proves what this session can actually use.

## Evidence used to close the incident

[ssuMCP PR #223](https://github.com/ghdtjdwn/ssuMCP/pull/223) and [ssuAI PR #245](https://github.com/ghdtjdwn/ssuAI/pull/245) added regressions for:

- persistent copies invoked through the real Spring proxy;
- empty and partially successful grants;
- expiry and health preservation plus compensation cleanup;
- status subject and expiry checks;
- fail-closed frontend handling of missing fields, JWT rotation, and identity races.

After main CI and Security workflows passed, a production full 3/3 grant completed a personal academic-requirements E2E. Unauthenticated requests returned 401, hostile origins returned 403, and the new process interval showed no web-session 5xx series.

Credentials that existed only in the pre-V17 JVM store cannot be reconstructed. Those users must reconnect once. Preserving that limitation is more accurate than turning a valid identity into a false provider grant.
