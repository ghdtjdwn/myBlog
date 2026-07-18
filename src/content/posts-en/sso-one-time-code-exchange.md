---
title: "Replacing a broken Set-Cookie proxy with a one-time SSO code exchange"
description: "How multiple Set-Cookie headers exposed a fragile proxy boundary and led to a 256-bit, atomically consumed Redis authorization-code protocol."
publishedAt: 2026-07-18
category: backend
activity: personal-project
tags: ["SSO", "Redis", "Cookies", "Security"]
project: ssu-platform
role: "Diagnosed the ssuAI–ssuMCP SSO callback failure and designed and verified the one-time authorization-code exchange"
evidence:
  - "The multi-Set-Cookie root-cause analysis in ssuMCP ADR-0095 and ssuAI ADR-0089"
  - "Comparison of the live response containing a Traefik affinity cookie with the proxy's single-cookie parsing path"
validation:
  - "Unit tests for Redis get-and-delete consumption, 120-second expiry, and replay rejection"
  - "Automated callback, exchange token/cookie-contract, and frontend single-flight tests"
limitations:
  - "The authorization code can briefly appear in a URL, browser history, and access logs"
  - "Authentication fails closed during Redis unavailability, creating an explicit availability cost"
  - "This is a first-party browser SSO flow, not a general-purpose OAuth authorization server"
  - "A complete post-fix production browser exchange is not part of the recorded validation evidence"
featured: true
draft: false
---

## My first hypothesis blamed the 302 redirect

The login callback issued a session cookie at ssuMCP and redirected the browser to ssuAI. It worked locally, but the required cookie disappeared after the production proxy path. I initially assumed that the 302 response or Vercel redirect handling was dropping `Set-Cookie`.

Comparing the actual headers disproved that story. Traefik affinity added a second `Set-Cookie` header, while an intermediate proxy parsed multiple cookie headers as one string. The backend had issued the session correctly; the forwarding layer had lost the semantics of repeated headers.

I could have patched the parser to select one cookie. The more durable problem was that a frontend proxy had to understand and reissue a backend domain's session credential at all.

## The callback now carries a short-lived code, not a credential

After SSO succeeds, ssuMCP generates a 256-bit random code and stores only the student ID under a code-derived Redis key for 120 seconds. The callback sends only the code to the browser.

```text
1. ssuMCP callback authenticates the user
2. store exchange-code key -> studentId in Redis
3. return a 200 page with a JavaScript redirect
4. ssuAI sends same-origin POST /api/auth/exchange
5. ssuMCP atomically consumes the code
6. the exchange response returns an access token + HttpOnly refresh cookie
```

The 200 page and JavaScript redirect are not a workaround for a presumed Vercel defect. They make the browser complete an explicit exchange through the frontend's same-origin endpoint, leaving one component responsible for setting the application cookie.

## “One time” is an atomic property

A separate Redis read and delete would let two concurrent requests observe the same code. I used get-and-delete semantics so retrieval and consumption form one operation. The code is part of the Redis key and the value is only the student ID. The exchange reloads that student, then issues an access JWT and refresh cookie. The protocol enforces:

- no exchange after the 120-second TTL;
- immediate removal after one successful use;
- no session promotion for an invalid code;
- no fallback credential when Redis is unavailable.

The code does appear briefly in a URL, so browser history and access-log exposure are not eliminated. Short TTL, one-time use, HTTPS, and log redaction reduce that risk, and the remaining window is stated explicitly rather than hidden.

## A header-copying bug became an explicit protocol boundary

[ssuMCP ADR-0095](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0095-sso-authorization-code-exchange.md) and [ssuAI ADR-0089](https://github.com/ghdtjdwn/ssuAI/blob/main/docs/adr/0089-sso-code-exchange.md) preserve the first hypothesis, disconfirming evidence, and contract from both services. Backend tests fix the callback's 200 response without a cookie, code consumption, expiry, replay denial, and the exchange response contract. Frontend tests verify a single exchange even under duplicate StrictMode effects. I do not present a complete post-fix production browser exchange as recorded evidence.

The durable fix was not a more clever `Set-Cookie` splitter. It removed an implicit dependency in which service B relayed service A's cookie and replaced it with a narrowly scoped capability exchanged through an explicit POST.
