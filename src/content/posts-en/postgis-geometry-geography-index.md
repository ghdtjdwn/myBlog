---
title: "Why I store coordinates as geometry but calculate meter searches as geography"
description: "A PostGIS design using expression-identical GiST indexes to preserve Hibernate and bounds-query compatibility without sacrificing correct radius and kNN semantics."
publishedAt: 2026-07-18
category: data
activity: personal-project
tags: ["PostGIS", "Spatial Index", "PostgreSQL", "Hibernate"]
project: geuneul
role: "Designed and verified Geuneul's coordinate type, radius, kNN, bounds queries, and GiST expression index"
evidence:
  - "Geuneul ADR-0001, Flyway V2 and V3 migrations, and PlaceRepository native queries"
  - "Query and index expressions accounting for geometry degrees versus geography meters"
validation:
  - "Real PostGIS Testcontainers coverage for 500 m and 1.5 km inclusion boundaries and distance ordering"
  - "EXPLAIN confirmation of geography expression indexes and the geometry bounds index"
limitations:
  - "The design targets SRID 4326 point searches at city scale"
  - "Maintaining separate geometry and geography GiST indexes adds some write and storage cost"
  - "Display distanceM also comes from database ST_Distance; the application only rounds it"
featured: true
draft: false
---

## SRID 4326 values cannot be interpreted directly as meters

Geuneul's primary queries are “places within N meters” and “the nearest restroom.” Calling `ST_DWithin` with 800 on `geometry(Point, 4326)` means 800 coordinate-system degrees, not 800 meters. Even around Seoul, one degree of latitude and longitude represents different lengths, so a single degree conversion cannot preserve a circular radius.

`geography` provides meter-based distance semantics, while Hibernate Spatial JTS mapping and viewport bounds queries are more natural with `geometry`. Instead of sacrificing one behavior or synchronizing duplicate coordinate columns, I separated storage from distance computation.

## One column supports two indexed expressions

The source of truth remains one `geometry(Point, 4326)` column. Viewport queries use its geometry GiST index with `&& ST_MakeEnvelope`. Meter-radius and nearest-neighbor queries cast through `geography(geom)` and use an expression-identical functional index:

```sql
CREATE INDEX idx_places_geom_geography
ON places USING GIST (geography(geom));

WHERE ST_DWithin(
  geography(p.geom),
  geography(:origin),
  :meters
)

ORDER BY geography(p.geom) <-> geography(:origin)
```

The planner can use an expression index only when the query expression matches. Repository queries deliberately preserve `geography(p.geom)`. Although `p.geom::geography` is valid SQL, the Spring Data native-query parser can mistake `:geography` for a named parameter, so the functional notation is also the safer parser contract.

## The database owns selection and display distance

Loading every row and filtering with Java haversine would discard the spatial index and pay for a full scan and transfer. Current queries let PostGIS select and order candidates and return display `distanceM` through `ST_Distance(geography, geography)`. The application DTO only rounds that value and never redecides spatial inclusion.

The [PostGIS ST_DWithin reference](https://postgis.net/docs/ST_DWithin.html) documents meter units for geography and the index-aware bounding-box comparison.

## The expression contract was fixed against real PostGIS

I did not stop at a mocked repository or SQL string assertion. Flyway migrations run in a PostGIS Testcontainer with points placed inside and outside 500-meter and 1.5-kilometer boundaries. Tests cover inclusion, kNN ordering, and viewport results. EXPLAIN confirms geography-expression GiST paths for radius and kNN and the geometry GiST path for bounds.

[ADR-0001](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0001-geometry-storage-geography-function-index.md) compares geography storage, degree approximations, application filtering, and duplicate columns.

This was not a binary choice between two types. Storage had to remain stable for the ORM and viewport, distance had to mean meters, and the query expression had to match the index expression. Separating those contracts let one coordinate source of truth use the strengths of both geometry and geography.
