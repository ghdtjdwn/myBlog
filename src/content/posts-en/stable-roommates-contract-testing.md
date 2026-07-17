---
title: "Contract-testing duplicated scores and Stable Roommates"
description: "Shared fixtures kept parallel frontend and backend scoring aligned, while a small brute-force oracle checked the matching algorithm independently."
publishedAt: 2026-07-17
category: engineering
activity: team-project
tags: ["Stable Roommates", "Contract Testing", "Next.js", "Spring Boot"]
project: cham-domi
role: "Owned the entire frontend and implemented scoring, Stable Roommates, posts, and chat in the roommate backend domain"
evidence:
  - "The team role and API contract plus equivalent living-habit fixtures in FE and BE"
  - "The Stable Roommates implementation and a brute-force oracle that enumerates small matchings"
validation:
  - "Nine FE Vitest cases, pure BE JUnit score tests, and representative 100/89-point parity"
  - "400 random preference profiles each at n=4 and n=6 compared with the brute-force oracle"
limitations:
  - "Authentication and dormitory eligibility belong to teammates and are outside this implementation scope"
  - "Real authentication integration, CI, public deployment, and user operation are not complete"
  - "Rules are duplicated rather than generated from one package, so removing contract tests would reintroduce drift risk"
featured: true
draft: false
---

## Parallel teams do not stay consistent by reading the same document

Cham Domi is a team prototype for finding compatible dormitory roommates. I owned the Next.js frontend and the Spring Boot roommate domain. Authentication and dormitory eligibility were teammates' responsibilities.

To develop screens before the backend was ready, all data access sat behind mock and real API adapters. This enabled parallel work, but the living-habit score existed in both TypeScript for immediate UI feedback and Java for the persisted decision.

Writing weights in a shared document was not enough. Either side could change rounding or dealbreaker behavior without breaking compilation. I made executable fixtures the contract.

## The same input must produce the same score and reason

Each fixture contains habit answers, weights, dealbreakers, and expected output. FE Vitest and BE JUnit execute semantically identical cases. Representative full-match and partial-match inputs produce 100 and 89 points, while tests also cover weight totals, boundaries, and dealbreakers.

```text
shared semantic fixture
  ├─ TypeScript score -> UI preview
  └─ Java score       -> persisted matching decision
       both: score + dealbreaker outcome
```

Checking only the final number could let two errors cancel each other. Assertions also cover per-item contribution and the dealbreaker result, making drift attributable.

A generated shared schema or backend-only source would be stronger in a mature system. For the prototype, contract fixtures caught drift without creating another deployment boundary.

## Do not build the test oracle with the same algorithm

Scores become each participant's preference order, and Stable Roommates finds pairs. A few hand-written examples may miss edge cases in proposals and rotations. A second optimized implementation could reproduce the same mistaken assumptions.

For small even `n`, I built a brute-force oracle that enumerates perfect matchings and checks every pair for blocking. It is intentionally slow and structurally different, but tractable at `n=4` and `n=6`.

For 400 generated preference profiles at each size, the comparison checked:

- any returned matching has no blocking pair under the oracle;
- a reported no-solution case also has no stable matching in enumeration;
- every participant appears once, with no self or duplicate pair.

Random generation uses reproducible seeds so a failure can become a permanent example.

## Publish the verified boundary and the team boundary together

The frontend has nine Vitest cases; the backend has pure score tests and H2-backed domain tests. A Playwright flow exercises screens with the mock adapter. There is no completed end-to-end path through team authentication, CI, public deployment, or operational usage.

I therefore do not describe these results as production reliability. Nor do I present authentication or dormitory eligibility as my work. The evidence covers the frontend and roommate domain I owned, where duplicated contracts and a nontrivial matching algorithm were checked with independent oracles.
