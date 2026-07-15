---
title: "When an expiry predicate dominates a PostGIS spatial query"
description: "How execution plans over 300,000 synthetic places and 210,000 reports showed that expiry aggregation—not the spatial GiST index—was the bottleneck."
publishedAt: 2026-07-15
updatedAt: 2026-07-15
category: data
activity: personal-project
tags: ["PostGIS", "PostgreSQL", "Performance", "EXPLAIN ANALYZE"]
project: geuneul
role: "Owned the data model, spatial queries, index choice, and load validation"
evidence:
  - "Geuneul ADR-0012 documents the synthetic data, environment, and before/after plans"
  - "perf/explain/RESULTS.md and the Flyway V8 expiry index"
  - "A k6 scenario that replays radius, KNN, bounds, and recommendation queries"
validation:
  - "Compared EXPLAIN (ANALYZE, BUFFERS) with 300,000 places and 210,000 reports"
  - "View build 256→133ms and scored 800m radius query 361→172ms after the expiry index"
  - "564/564 k6 checks, 0% errors, and 1.40s radius-query p95"
limitations:
  - "Separates the service's 150,000+ public POIs from the 300,000-row synthetic performance seed"
  - "Relative comparison on a 2-vCPU ARM64 Mac emulating an AMD64 PostGIS image"
  - "Does not generalize the absolute latency or improvement ratio to production RDS"
featured: true
draft: false
---

## The spatial index was already doing its job

Geuneul's radius query combines location with the freshness of user reports. `ST_DWithin` looked like the obvious suspect, but repeated plans with the same parameters showed that the GiST paths reducing place candidates were already working.

- Radius search used a Bitmap Index Scan on `idx_places_geom_geography`.
- Nearest search used a `<->` KNN Index Scan and visited only the top five candidates.
- A selective small map window used `idx_places_geom`.
- For a dense, large window with `LIMIT 100`, the planner intentionally chose an early-terminating sequential scan.

I did not force an index merely because a sequential scan appeared. Selectivity and the limit determine which plan actually performs less work.

## The bottleneck was the time axis of expired reports

Scored searches join `place_report_signals`. The view aggregates only reports where `expires_at > now()`, but expired reports remain as history. The number of rows discarded by the filter therefore grows over time.

Because the place predicate could not be pushed through the grouped view far enough, reducing the radius to a few dozen places did not reduce report aggregation in the same way. I separated this from the service's 150,000+ public POIs with a reproducible synthetic seed.

| Data | Rows |
| --- | ---: |
| Places | 300,000 |
| Valid reports | 10,000 |
| Expired reports | 200,000 |

The seed used a 70% capital-area and 30% nationwide distribution. Both sides of the comparison used the same data and query parameters.

## Why the fix is a full `expires_at` B-tree

Flyway V8 adds one index.

```sql
CREATE INDEX idx_reports_expires ON reports (expires_at);
```

A partial index with `WHERE expires_at > now()` looks smaller, but PostgreSQL requires immutable expressions in an index predicate. The current time changes, so `now()` cannot be used there. A full B-tree still supports the range scan that reads currently valid rows.

I also avoided forcing location and expiry into one composite index. They belong to different tables and selectivity patterns, and the place GiST path was already correct. The change addresses only the measured bottleneck.

## Validate the plan and the load together

The before/after comparison in the same environment was:

| Target | Before | After | Plan change |
| --- | ---: | ---: | --- |
| Report-signal view build | 256 ms | 133 ms | reports Seq Scan → expiry Bitmap Index Scan |
| Scored 800m radius query | 361 ms | 172 ms | spatial GiST unchanged; report aggregation changed |

A k6 iteration then called radius, KNN, bounds, and recommendation paths in sequence. A warm 4-VU run passed 564 of 564 checks with a 0% error rate; radius-query p95 was 1.40 seconds.

That does not mean production search takes 1.40 seconds. The run used an AMD64 PostGIS image under QEMU on a 2-vCPU ARM64 Mac, so absolute latency is inflated. The useful evidence is the relative plan change and equivalent results. The k6 thresholds detect possible performance regression, while the separately captured `EXPLAIN (ANALYZE, BUFFERS)` plans confirm index use.

## The condition for a larger redesign

I considered correlated LATERAL subqueries, a materialized view, and composite indexes. LATERAL would duplicate aggregation across three search queries, while a materialized view would reduce report freshness. One index removed the measured bottleneck without that cost.

I would revisit the design if the view again dominates on native staging hardware or real traffic demonstrates the limit of on-demand aggregation. Until then, [ADR-0012](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0012-k6-load-explain-index-tuning.md), the [captured plans](https://github.com/ghdtjdwn/geuneul/blob/main/perf/explain/RESULTS.md), and [Flyway V8](https://github.com/ghdtjdwn/geuneul/blob/main/backend/src/main/resources/db/migration/V8__reports_expires_index.sql) remain the reproducible evidence.
