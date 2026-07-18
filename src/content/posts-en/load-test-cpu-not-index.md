---
title: "Why I added CPU instead of another index for a 2.68-second spatial p95"
description: "A small production read-only load test and EXPLAIN analysis that separated a CPU-bound spatial path from two unrelated missing user-query indexes."
publishedAt: 2026-07-18
category: data
activity: personal-project
tags: ["k6", "PostGIS", "ECS Fargate", "Performance"]
project: geuneul
role: "Ran Geuneul's gentle production load, analyzed EXPLAIN plans, and tuned Fargate CPU and only the evidenced indexes"
evidence:
  - "Geuneul ADR-0025, before/after perf/k6 results, and recorded perf/explain plans"
  - "Evidence that radius, kNN, and selective bounds used GiST while two user-activity queries had unnecessary sequential scans"
validation:
  - "Before and after k6 measurements at four VUs for 70 seconds using read-only requests"
  - "Seq Scan to Bitmap Index Scan after Flyway V18 and confirmation of 512 CPU units on the live task"
limitations:
  - "A four-VU gentle test does not establish maximum capacity or performance for all internet users"
  - "The before/after figures describe the production data and Fargate state at that time, not a universal ratio"
  - "Moving from 0.25 to 0.5 vCPU increases compute cost, whose long-term amount depends on actual usage"
featured: true
draft: false
---

## I did not add an index merely because a spatial query was slow

I exercised Geuneul's radius, kNN, bounds, and recommendation endpoints in production with four VUs for 70 seconds using only read-only GET requests. Radius search reached a 2.68-second p95 while the other spatial queries took hundreds of milliseconds. A missing GiST index was an easy assumption, but EXPLAIN showed that radius and kNN already used the geography index.

The stronger hypothesis was CPU saturation on a 0.25-vCPU Fargate task when the scoring join and response work overlapped. Adding indexes without evidence would have increased write cost while preserving the actual bottleneck.

## I changed one capacity lever first

Memory, application configuration, and the script remained fixed while task CPU moved from 0.25 to 0.5 vCPU. I updated the live task definition, Terraform default, and image-deployment path so later releases retained 512 CPU units. The same script produced:

| query | before | after |
| --- | ---: | ---: |
| radius p95 | 2.68s | 1.39s |
| kNN p95 | 238ms | 98ms |
| bounds p95 | 395ms | 210ms |
| throughput | 1× | 2.1× |
| boot | 93s | 70s |

Radius p95 fell by about 48%, and throughput was 2.1 times the baseline. This small experiment does not imply that doubling CPU always doubles performance. It does provide strong evidence for the bottleneck at that time because existing index use had been established and only one capacity variable changed.

## Two separate sequential scans received two separate indexes

EXPLAIN found missing `user_id` paths on “my comments” and “my reactions,” unrelated to the spatial endpoint:

```sql
CREATE INDEX idx_review_comments_user
ON review_comments (user_id, created_at DESC);

CREATE INDEX idx_reactions_user
ON reactions (user_id, target_type, created_at DESC);
```

After Flyway V18, those plans changed from sequential scans to bitmap index scans. Reviews, following, radius, kNN, selective small bounds, and corridor searches already had indexed plans and were left unchanged. A large bounds query over a dense region had low selectivity and `LIMIT 100`, so PostgreSQL intentionally chose an early-exit sequential scan. Performance work did not justify speculative indexes elsewhere.

## Unchanged knobs also had evidence

ECS autoscaling remained at one to three tasks with a 60% CPU target. Increasing per-task capacity naturally delays scale-out for the same traffic. Hikari stayed at ten connections per task, at most 30 across three tasks, because neither the database limit nor the load evidence indicated connection waiting.

[ADR-0025](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0025-scale-prep-load-based-tuning.md) records the k6 conditions, plans, and intentionally retained settings. The larger CPU allocation has an explicit cost trade-off.

Performance tuning was not an exercise in moving every knob. The load test identified the symptom, EXPLAIN separated query paths, and a controlled before/after tested the CPU hypothesis. Being able to explain both the two changes and the two non-changes makes the metrics engineering evidence rather than decoration.
