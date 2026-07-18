---
title: "Why valid bearer requests returned 401 only in production"
description: "A Spring Security incident where an Auth0 filter chain captured every path, rejected another JWT format, and remained invisible under the test profile."
publishedAt: 2026-07-18
category: troubleshooting
activity: personal-project
tags: ["Spring Security", "JWT", "OAuth2", "Integration Test"]
project: ssu-platform
role: "Reproduced the multi-JWT security-chain incident, scoped its matchers, and added production-like OIDC integration tests"
evidence:
  - "The MCP Auth0 resource-server filter-chain analysis in ssuMCP ADR-0074"
  - "Configuration and filter traces comparing rs-enabled=false in tests with true in production"
validation:
  - "Application-context boot with rs-enabled=true and a WireMock OIDC issuer"
  - "Four contracts covering valid and invalid SmartID web requests, the invalid-bearer MCP challenge, and PRM discovery"
limitations:
  - "The case covers the current claims and issuer contracts of two JWT systems"
  - "permitAll does not bypass authentication filters that already belong to the selected chain"
  - "New authentication entry points will require another overlap and matcher-order review"
featured: true
draft: false
---

## One application accepted two kinds of JWT

The ssuMCP web API validates its internal SmartID HS256 bearer in a servlet-level `JwtAuthFilter`, while the standards-based MCP endpoint uses Spring Security's Auth0 OAuth resource-server chain. A permissive fallback Spring chain covered everything else, but the Auth0 chain itself had no path matcher.

Once resource-server support was enabled in production, valid web bearer requests began returning 401. Because the authorization rules appeared to mark that path as `permitAll`, I first investigated principal conversion and token expiry. The request had actually failed earlier: the Auth0 bearer filter interpreted the HS256 token as one of its issuer tokens and rejected it before the web chain could run.

## permitAll does not remove an earlier authentication filter

Spring Security's `FilterChainProxy` chooses a matching `SecurityFilterChain` and invokes its filters. `permitAll` is an authorization outcome; it does not erase a bearer authentication filter that is already part of the chosen chain.

```text
request
  -> first matching SecurityFilterChain
  -> Auth0 BearerTokenAuthenticationFilter
  -> HS256 SmartID token rejected
  -> authorization rule never reached
```

The fix was not to make token parsing permissive. It was to define the Auth0 chain's ownership precisely:

```java
http.securityMatcher("/mcp", "/mcp/**", "/.well-known/**");
```

Only MCP and discovery requests enter the Auth0 chain. All other paths enter the permissive fallback Spring chain, which leaves web authentication to the existing servlet `JwtAuthFilter`. Authentication is selected by an explicit URL protocol boundary instead of trying decoders until one accepts a token.

## Why every test had remained green

The existing test profile set `rs-enabled=false`. The production-only beans and chain were never created, so web API regression tests could not expose their interference. Mock-JWT tests covered each decoder in isolation but not which chain would capture a request when both existed.

I added an application context with `rs-enabled=true` and a WireMock server for OIDC discovery and a real public JWKS. The suite deliberately signs no Auth0 token. Instead, it fixes the incident and routing contract with four cases:

- a valid SmartID JWT returns 200 and the student ID from `GET /api/auth/me`;
- an invalid bearer on that web API returns the existing web 401 envelope, without an MCP challenge;
- an invalid bearer on `POST /mcp` returns the RFC 9728 `resource_metadata` challenge;
- the protected-resource metadata document continues to advertise `authorization_servers`.

## I now test security configuration as a routing table

The [Spring Security architecture reference](https://docs.spring.io/spring-security/reference/7.0/servlet/architecture.html) explains that request matchers determine filter-chain invocation. [ADR-0074](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0074-mcp-oauth-chain-scoping.md) records the concrete configuration difference and operational verification.

I now treat multiple security chains as an ordered routing table. Each chain must state not only what it permits, but also which requests it owns. Production-only security flags also belong in a production-like test matrix. The most consequential failure did not come from a configuration that failed tests; it came from a configuration that did not exist in tests at all.
