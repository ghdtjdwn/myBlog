---
title: "좌표는 geometry로 저장하고 미터 검색은 geography로 계산한 이유"
description: "Hibernate·bounds 검색 호환성과 정확한 반경·kNN을 함께 얻기 위해 동일 표현식의 GiST 함수 인덱스를 설계한 기록입니다."
publishedAt: 2026-07-18
category: data
activity: personal-project
tags: ["PostGIS", "Spatial Index", "PostgreSQL", "Hibernate"]
project: geuneul
role: "그늘 좌표 타입, 반경·kNN·bounds query와 GiST 함수 인덱스 설계·검증"
evidence:
  - "그늘 ADR-0001과 Flyway V2·V3 migration, PlaceRepository native query"
  - "geometry degree 단위와 geography meter 단위 차이를 반영한 query·index 표현식"
validation:
  - "실제 PostGIS Testcontainers에서 500m·1.5km 반경 포함/제외와 거리 순서 검증"
  - "EXPLAIN으로 geography 함수 인덱스와 geometry bounds 인덱스 경로 확인"
limitations:
  - "SRID 4326 도시 규모 point 검색을 대상으로 한 설계"
  - "geometry와 geography용 GiST 두 개로 쓰기·저장 비용이 소폭 증가"
  - "표시용 distanceM도 DB ST_Distance 결과이며 애플리케이션은 소수점 반올림만 수행"
featured: true
draft: false
---

## SRID 4326의 숫자를 그대로 미터로 해석할 수 없다

그늘의 핵심 query는 “현재 위치에서 반경 N미터 안의 장소”와 “가장 가까운 화장실”입니다. 장소를 `geometry(Point, 4326)`로 저장하고 `ST_DWithin`에 800을 넘기면 800m가 아니라 좌표계 단위인 800도를 뜻합니다. 서울에서도 위도·경도의 1도 길이가 다르므로 단순 환산은 원형 반경을 보장하지 않습니다.

`geography`는 거리 단위를 미터로 제공하지만 Hibernate Spatial의 JTS mapping과 현재 viewport를 찾는 bounds query는 `geometry`가 자연스럽습니다. 한쪽 기능을 포기하거나 좌표 컬럼을 두 개 동기화하는 대신 저장과 연산 책임을 분리했습니다.

## 한 컬럼에 두 인덱스 표현을 사용했다

정본 좌표는 `geometry(Point, 4326)` 하나로 유지합니다. viewport 검색은 기존 geometry GiST와 `&& ST_MakeEnvelope`를 사용합니다. meter 반경과 nearest-neighbor는 query에서 `geography(geom)`로 변환하고 정확히 같은 표현식의 함수 인덱스를 만들었습니다.

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

함수 인덱스는 query expression과 index expression이 일치해야 planner가 사용할 수 있습니다. repository에 `geography(p.geom)` 형태를 의도적으로 고정했습니다. `p.geom::geography`는 SQL상 같지만 Spring Data native-query parser가 `:geography`를 named parameter로 오인할 수 있어 함수 표기를 선택했습니다.

## DB가 선별과 표시 거리를 함께 책임진다

모든 row를 읽어 Java에서 haversine으로 거르면 DB spatial index를 버리고 전체 scan과 network 전송을 떠안습니다. 현재 query는 PostGIS가 반경 후보와 순서를 결정하고 `ST_Distance(geography, geography)`로 표시용 `distanceM`도 함께 반환합니다. 애플리케이션 DTO는 이를 소수점 단위로 반올림할 뿐 공간 포함 여부를 다시 판정하지 않습니다.

[PostGIS ST_DWithin 문서](https://postgis.net/docs/ST_DWithin.html)는 geography 거리 단위가 meter이고 spatial index를 활용하는 bounding-box 비교를 포함한다고 설명합니다.

## 실제 PostGIS에서 표현식 계약을 고정했다

mock repository로 SQL 문자열만 확인하지 않았습니다. PostGIS Testcontainers에 Flyway migration을 적용하고 경계 안팎 point를 넣어 500m·1.5km 포함/제외, kNN 순서와 bounds 결과를 검증했습니다. EXPLAIN에서는 반경·kNN이 geography 함수 GiST, viewport가 geometry GiST를 사용하는지 확인했습니다.

[ADR-0001](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0001-geometry-storage-geography-function-index.md)은 geography 컬럼 저장, degree 근사, 앱 필터와 이중 컬럼 대안을 비교합니다.

타입 하나를 고르는 문제가 아니라 세 계약을 맞춘 결정이었습니다. 저장은 ORM과 viewport에 안정적이어야 하고, 거리 의미는 meter여야 하며, query와 index의 표현식은 planner가 동일하다고 볼 수 있어야 합니다. 이 세 층을 분리해 geometry와 geography의 장점을 한 정본 좌표에서 사용했습니다.
