---
title: "Making a 50,000-record spatial import safe to rerun"
description: "Natural keys, incremental persistence, and real HTTP contract tests for geocoding a coordinate-free public CSV into PostGIS."
publishedAt: 2026-07-17
category: data
activity: personal-project
tags: ["ETL", "PostGIS", "Geocoding", "Idempotency"]
project: geuneul
role: "Designed and implemented the public-data ingest pipeline, geocoding concurrency control, natural-key upserts, and production verification"
evidence:
  - "Geuneul ADR-0002 and ADR-0003 on natural keys, bulk upserts, and geocode reuse"
  - "The pre-import audit of 59,768 standard-toilet CSV rows and the production import incident record"
validation:
  - "Provider-response converter tests, chunk-upsert integration tests, and reruns of the same input"
  - "The first 46,897-row import, reuse of all 46,897 coordinates on rerun, 5,437 additions, and zero source-key duplicates"
limitations:
  - "After retry, 1,756 legacy or incomplete addresses still could not be resolved"
  - "The pipeline depends on public geocoding quotas and address quality; coordinates were not all field-verified"
featured: true
draft: false
---

## The first requirement was not volume but restartability

The standard public-toilet CSV contained 59,768 rows and no map-ready coordinates. Each address had to pass through an external geocoding API before becoming PostGIS geometry. Partial failure is normal in a job with tens of thousands of network calls, so I optimized for safe restart rather than a single perfect run.

A generated database ID cannot identify the same facility across imports. I retained the source identifier and defined `(source, source_external_id)` as the natural key, enforced by a unique constraint and `ON CONFLICT` upsert. Re-reading a file updates operational attributes without multiplying logical facilities.

## Geocode before insertion, preserve each success

One option was to insert source rows first and backfill coordinates. That would expose coordinate-free facilities to spatial queries and blur the difference between failed and unprocessed rows. A row that requires geocoding is inserted only after it satisfies the coordinate contract.

Conversely, an existing natural key with stored coordinates does not call the provider again. Imports commit independent chunks of 1,000 rows. If the process fails near the end, earlier coordinates and upserts survive.

Virtual threads reduce waiting overhead, but a semaphore limits provider concurrency to eight. The ability to create many threads is not permission to create unlimited provider load. The semaphore is explicit backpressure for quota and connection pressure.

```text
CSV row
  ├─ natural key and coordinate exist -> reuse stored coordinate
  └─ coordinate absent -> normalize address -> geocoder (max 8)
                                             -> quality check
                                             -> chunk upsert (1,000)
```

## A fake hid a JSON-generation mismatch

The local fake geocoder passed, while the production import quietly returned zero results. After a Spring Boot 4 migration, the HTTP client used a Jackson 3 converter while the response type expected Jackson 2's `JsonNode`. Even a 200 response produced no usable body.

The fake returned a finished object and bypassed HTTP message conversion entirely. I added a `MockRestServiceServer` test with provider-shaped JSON and aligned the response type with the Jackson generation used by the application. I then scanned similar clients for the same mixed contract.

## Validate meaning as well as count

The first successful production run loaded 46,897 facilities with coordinates. A later rerun reused all 46,897 stored coordinates without provider calls and resolved 5,437 previous failures, raising the total to 52,334 without creating a natural-key duplicate. Checks also covered geometry SRID, coordinate ranges, and duplicate keys by source.

After retry, 1,756 of the 59,768 inputs still had legacy or incomplete addresses the provider could not resolve. I do not present this as complete coverage. The engineering result is a pipeline that separates failures, retains progress, and safely adds only newly successful results on the same input.
