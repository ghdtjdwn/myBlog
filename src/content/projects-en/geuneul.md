---
title: "Geuneul — Summer Survival Map"
summary: "A map service that combines more than 150,000 public POIs, PostGIS spatial search, and real-time reports to help people find nearby shelter during heat waves and rain."
status: complete
statusNote: "Development ended after the web app, API, PWA, and AWS infrastructure were implemented and verified. The public URL and repository remain available as completed evidence."
activity: personal
visibility: public
role: "End-to-end ownership of product, data, backend, and infrastructure"
teamScope: "Solo project"
contributionEvidence: ["168 commits", "117 PRs", "Public Terraform and performance evidence"]
image: "../../assets/projects/geuneul-prototype.png"
imageAlt: "Desktop view of Geuneul showing the place list and map side by side"
architecture:
  - image: "../../assets/projects/geuneul-architecture.png"
    alt: "Geuneul architecture showing the Vercel BFF, CloudFront, ALB, ECS Fargate, RDS PostGIS, Redis, S3, and EventBridge deployment"
    caption: "Geuneul — the diagram connects the same-origin Vercel BFF to CloudFront, ALB, and ECS Fargate, alongside RDS PostGIS, ElastiCache, S3, EventBridge, and OIDC delivery boundaries."
tags: ["Spring Boot", "PostGIS", "Next.js", "PWA"]
infra: ["AWS ECS", "RDS", "ElastiCache", "CloudFront", "Terraform"]
metrics:
  - { label: "Public POIs", value: "150k+" }
  - { label: "Radius p95", value: "~1.4s" }
  - { label: "k6 checks", value: "564 / 564" }
order: 2
featured: true
live: "https://geuneul.vercel.app"
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/geuneul" }
recordPlan: "The public repository's README, architecture, DEPLOY, ADRs, and work log are the sources of truth for the completed result. The blog links selected performance, data, and operations cases centered on the problem and its validation."
recordLinks:
  - { label: "Runtime, data, and deployment architecture", url: "https://github.com/ghdtjdwn/geuneul/blob/main/docs/architecture.md" }
  - { label: "Architecture Decision Records", url: "https://github.com/ghdtjdwn/geuneul/tree/main/docs/adr" }
  - { label: "PostGIS load and plan-tuning ADR", url: "https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0012-k6-load-explain-index-tuning.md" }
  - { label: "Captured PostGIS EXPLAIN results", url: "https://github.com/ghdtjdwn/geuneul/blob/main/perf/explain/RESULTS.md" }
---

## Problem

Public data exists, but on a hot day it is still difficult for users to decide quickly where they can go nearby. I unified different nationwide datasets into one location model and built a service that presents distance together with recent reports.

Simply placing locations on a map was not enough. Users need to judge whether a place is within walking distance, whether they can actually rest there, whether recent reports exist, and whether it suits rain or extreme heat. The service connects public POIs, user reports, weather, and amenity signals in one discovery flow.

## Data and search

I built an idempotent ETL pipeline using the natural key `source + source_external_id`, so repeated runs do not create duplicates. Radius search, nearest-neighbor kNN, and map-bounds queries use PostGIS and GiST indexes. I examined execution plans and tail latency with `EXPLAIN ANALYZE` and k6.

Nationwide datasets differ in identifiers, coordinates, and update schedules. The pipeline preserves the source and external ID as a natural key and upserts records so ingestion can be rerun safely. Locations are stored as PostGIS geography values, and I evaluated separate execution plans for radius, nearest-neighbor, and current-map-area query goals.

Under the same local conditions, the recorded radius-search p95 fell from about 2.68 seconds to 1.39 seconds, while kNN fell from 238 ms to 98 ms. This is a relative comparison from an ARM64 Mac emulating an amd64 PostGIS container, not an absolute Production RDS latency claim.

## Real-time behavior and product boundaries

Report changes flow from PostgreSQL `LISTEN/NOTIFY` to the server's SSE stream. I treated cross-instance event delivery and client resynchronization after a disconnected stream as separate boundaries. The survival score computes signals in SQL and combines them in a Java policy, keeping data selection separate from product rules rather than mixing both in one query.

## Infrastructure

Terraform declares the VPC, public and private subnets, ECS Fargate, ECR, RDS/PostGIS, ElastiCache, ALB, CloudFront, S3, EventBridge, and OIDC deployment permissions. The frontend runs on Vercel, and the API is served through CloudFront.

The ECS service scales from a minimum of 1 task to a maximum of 3 using a 60% CPU target. GitHub Actions assumes its deployment role through OIDC instead of using a long-lived AWS key. ADRs capture CloudFront-to-ALB origin access, RDS encryption, backup and restore, and observability cost so the infrastructure can be explained as a set of operating decisions rather than only as a diagram.

## Completed state

I published and verified the web app, API health endpoint, PWA installation path, and signed APK, completing the planned development scope. The public demo, code, design records, and performance evidence remain available for review, but there is no active feature roadmap. Data freshness and continuous infrastructure availability are not guaranteed after completion.

## Limitations

The performance numbers are before-and-after measurements from the same environment, with an ARM64 Mac emulating an amd64 PostGIS image. They are not presented as absolute Production RDS latency.

Some shade and amenity information depends on public-data update times and user reports. “150,000 places” describes collection coverage; it does not mean that every location's current condition is guaranteed in real time.
