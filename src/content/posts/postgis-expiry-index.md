---
title: "PostGIS 공간 검색에서 만료 조건이 인덱스를 무력화할 때"
description: "30만 합성 장소와 21만 제보의 실행계획을 비교해, 공간 GiST가 아니라 만료 제보 집계가 병목임을 좁힌 과정입니다."
publishedAt: 2026-07-15
updatedAt: 2026-07-15
category: data
activity: personal-project
tags: ["PostGIS", "PostgreSQL", "Performance", "EXPLAIN ANALYZE"]
project: geuneul
role: "데이터 모델, 공간 쿼리, 인덱스와 부하 검증"
evidence:
  - "geuneul ADR-0012의 합성 데이터·실행 환경·before/after 기록"
  - "perf/explain/RESULTS.md와 Flyway V8 만료 인덱스"
  - "같은 분포를 재생하는 k6 반경·kNN·bounds·추천 시나리오"
validation:
  - "places 300,000건과 reports 210,000건에서 EXPLAIN (ANALYZE, BUFFERS) 비교"
  - "만료 인덱스 적용 뒤 뷰 256→133ms, 800m 반경 스코어드 361→172ms"
  - "k6 564/564 체크 성공, 오류율 0%, 반경 p95 1.40초"
limitations:
  - "실서비스의 150,000+ 공공 POI와 성능 실험의 300,000건 합성 시드를 구분함"
  - "ARM64 Mac의 2 vCPU 환경에서 AMD64 PostGIS를 에뮬레이션한 상대 비교"
  - "프로덕션 RDS의 절대 성능이나 보편적인 개선 배수로 일반화하지 않음"
featured: true
draft: false
---

## 공간 인덱스는 이미 제 역할을 하고 있었다

그늘의 반경 검색은 장소 위치뿐 아니라 사용자가 남긴 제보의 신선도도 함께 계산합니다. 처음에는 `ST_DWithin`이 느린 원인이라고 생각하기 쉽지만, 같은 파라미터로 실행계획을 반복해서 보니 장소 후보를 줄이는 GiST 경로는 이미 정상적으로 선택되고 있었습니다.

- 반경 검색은 `idx_places_geom_geography`의 Bitmap Index Scan을 사용했습니다.
- 최근접 검색은 `<->` KNN Index Scan으로 상위 5개만 찾았습니다.
- 선택적인 작은 지도 영역은 `idx_places_geom`을 사용했습니다.
- 밀집된 큰 영역과 `LIMIT 100`에서는 초기에 필요한 행을 바로 채울 수 있어 플래너가 의도적으로 Seq Scan을 골랐습니다.

“Seq Scan이 보인다”는 이유만으로 인덱스를 강제하지 않았습니다. 선택도와 `LIMIT`까지 포함해 어떤 계획이 실제로 더 적은 일을 하는지 먼저 확인했습니다.

## 병목은 만료 제보의 시간축에 있었다

스코어드 검색은 `place_report_signals` 뷰를 조인합니다. 이 뷰는 `expires_at > now()`인 유효 제보만 집계하지만, 만료된 제보도 이력으로 남기기 때문에 시간이 지날수록 필터에서 버리는 행이 늘어납니다.

문제는 `GROUP BY`가 있는 뷰 안으로 장소 조건이 충분히 밀려들지 않아, 검색 반경이 장소를 수십 건으로 줄여도 제보 쪽 집계는 전체 누적량에 비례했다는 점입니다. 이를 분리해 보기 위해 실서비스의 15만여 공공 POI와 별개로 다음 합성 시드를 만들었습니다.

| 데이터 | 건수 |
| --- | ---: |
| 장소 | 300,000 |
| 유효 제보 | 10,000 |
| 만료 제보 | 200,000 |

수도권 70%, 전국 30% 분포를 사용하고, 변경 전후에 같은 데이터와 쿼리를 실행했습니다. 원본 조건을 바꿔 더 좋은 수치를 만드는 대신 실행계획의 후보 행, 필터 제거 행과 실제 시간을 함께 비교했습니다.

## `expires_at` 전체 B-tree를 선택한 이유

Flyway V8에는 다음 인덱스 하나만 추가했습니다.

```sql
CREATE INDEX idx_reports_expires ON reports (expires_at);
```

`WHERE expires_at > now()`만 담은 부분 인덱스가 더 작아 보이지만 PostgreSQL 인덱스 predicate에는 immutable 표현식이 필요합니다. 현재 시각은 계속 변하므로 `now()`를 predicate에 넣을 수 없습니다. 대신 전체 B-tree의 범위 스캔으로 현재 유효한 행만 읽게 했습니다.

장소 위치와 만료 시각을 하나의 복합 인덱스에 억지로 묶지도 않았습니다. 공간 조건과 시간 조건은 서로 다른 테이블과 선택도를 가지며, 실행계획상 장소 GiST는 이미 최적 경로였습니다. 확인된 병목 하나만 고치는 쪽을 선택했습니다.

## 실행계획과 부하를 함께 확인했다

동일 환경의 before/after는 다음과 같았습니다.

| 대상 | 변경 전 | 변경 후 | 계획 변화 |
| --- | ---: | ---: | --- |
| 제보 신호 뷰 빌드 | 256 ms | 133 ms | reports Seq Scan → expires Bitmap Index Scan |
| 광화문 800m 반경 스코어드 | 361 ms | 172 ms | 공간 GiST 유지, 제보 집계만 전환 |

그다음 k6 한 이터레이션에서 반경, KNN, bounds, 추천 네 경로를 연속 호출했습니다. 4 VU warm run에서 564개 체크가 모두 성공했고 오류율은 0%였습니다. 반경 검색 p95는 1.40초였습니다.

이 수치는 “프로덕션 검색이 1.40초”라는 뜻이 아닙니다. 로컬 2 vCPU ARM64 Mac에서 AMD64 PostGIS 이미지를 QEMU로 실행했기 때문에 절대 지연은 부풀려져 있습니다. 여기서 유효한 증거는 같은 환경에서 계획이 어떻게 바뀌었는지와 결과가 같았는지입니다. k6 threshold는 성능 회귀 가능성을 탐지하고, 인덱스 사용 여부는 별도로 캡처한 `EXPLAIN (ANALYZE, BUFFERS)`에서 확인했습니다.

## 더 큰 리팩터를 보류한 기준

상관 LATERAL 서브쿼리, materialized view, 복합 인덱스도 검토했습니다. LATERAL은 세 검색 쿼리에 집계 로직을 중복시키고, materialized view는 실시간 제보 신선도를 낮춥니다. 단일 인덱스로 확인된 병목을 절반 수준으로 줄인 상황에서 구조를 크게 바꿀 근거는 부족했습니다.

재검토 조건은 명확합니다. 네이티브 스테이징에서 같은 뷰가 다시 지배적인 비용이 되거나, 실제 트래픽이 온디맨드 집계 한계를 보여줄 때입니다. 그전까지는 [ADR-0012](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0012-k6-load-explain-index-tuning.md), [실행계획 결과](https://github.com/ghdtjdwn/geuneul/blob/main/perf/explain/RESULTS.md), [Flyway V8](https://github.com/ghdtjdwn/geuneul/blob/main/backend/src/main/resources/db/migration/V8__reports_expires_index.sql)을 재현 가능한 근거로 유지합니다.
