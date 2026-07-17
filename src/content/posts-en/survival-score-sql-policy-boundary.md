---
title: "Why the survival score has a SQL layer and a Java layer"
description: "PostGIS derives facts while a pure policy function handles weights and missing data, making a composite score explainable and testable."
publishedAt: 2026-07-17
category: backend
activity: personal-project
tags: ["PostGIS", "Domain Modeling", "SQL", "Testing"]
project: geuneul
role: "Designed and implemented the spatial aggregation view, score policy, and missing-feature contract"
evidence:
  - "Geuneul ADR-0007, ADR-0009, and ADR-0017 on scoring, review separation, and trust policy"
  - "SQL for freshness, trust, comfort, and risk features plus domain score tests"
validation:
  - "Unit tests for boundaries and missing-feature weight normalization"
  - "PostGIS integration tests and real queries covering GPS-verified reviews and request-scoped weather"
limitations:
  - "Weights are product hypotheses, not the result of a user-outcome experiment"
  - "Sparse reviews and region-level weather cannot fully represent personalization or microclimates"
featured: true
draft: false
---

## One large query can calculate a score but cannot explain it well

Geuneul's survival score is more than a count of nearby facilities. It combines data freshness, source trust, operating state, GPS-verified reviews, and weather risk. Putting every weight and exception into one SQL statement would reduce round trips but make policy changes and regressions difficult to explain.

I split the computation into two layers:

```text
PostGIS SQL view  -> observable features
pure Java policy -> score and explanation from those features
```

SQL aggregates facilities, distance, operating state, freshness, and trust within a radius. A Java function applies weights, caps, risk penalties, and missing-data policy to the feature vector. The database owns spatial facts; the application owns product policy.

## Do not punish an unobserved value as zero

Some areas have no reviews, and a weather provider may omit a signal. Replacing every absence with zero would turn “not observed” into “bad.”

The policy sums only available feature weights and normalizes the result back to a 100-point range. If comfort is absent, it does not inject a zero comfort score; it preserves the relative weights of freshness, trust, and risk. The response lists included and excluded signals so the basis of the number remains visible.

Not every absence is optional. Missing location or an invalid radius prevents calculation. The contract distinguishes features that may be omitted from inputs required for the score to mean anything.

## Keep reviews separate from public facility facts

Writing user reviews onto source facility rows would couple subjective assessments to the lifecycle of public data. Reviews remain a separate aggregate, and only those meeting GPS and state requirements contribute a feature. Source trust and user experience stay distinct in the explanation.

Weather is also fetched once per search, not once per facility. A request-scoped snapshot is injected into every candidate calculation, avoiding inconsistent weather within one response and limiting external calls.

## A pure policy creates a precise test boundary

The policy has no database or clock dependency and returns the same output for the same input. Table-driven tests cover boundaries, caps, risk penalties, and weight normalization when features are missing. PostGIS integration tests separately verify distances and aggregated facts.

When a score looks wrong, the investigation becomes specific:

- Did SQL produce the wrong feature?
- Is a policy weight or cap incorrect?
- Which signal was absent and caused normalization?
- Did a review satisfy its GPS and state contract?

The current weights are product hypotheses rather than experimentally optimized values. The value of the boundary is that a future experiment can replace policy while keeping spatial facts and regression tests stable.
