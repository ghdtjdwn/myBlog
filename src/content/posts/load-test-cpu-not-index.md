---
title: "공간 검색 p95 2.68초에서 인덱스 대신 CPU를 늘린 근거"
description: "작은 production read-only 부하와 EXPLAIN을 분리해 공간 query의 CPU 병목과 별도 사용자 조회의 index 누락만 정확히 고친 기록입니다."
publishedAt: 2026-07-18
category: data
activity: personal-project
tags: ["k6", "PostGIS", "ECS Fargate", "Performance"]
project: geuneul
role: "그늘 production gentle load, EXPLAIN 분석과 Fargate CPU·선별 index 튜닝"
evidence:
  - "그늘 ADR-0025, perf/k6 전후 결과와 perf/explain 실행 계획"
  - "반경·kNN·선택적 bounds는 기존 GiST를 사용하고 사용자 활동 두 query만 불필요한 seq scan이었던 증거"
validation:
  - "4 VU·70초 read-only 조건의 전후 k6 측정"
  - "Flyway V18 적용 전후 Seq Scan→Bitmap Index Scan과 live task CPU 512 확인"
limitations:
  - "4 VU gentle test는 대규모 용량 한계나 인터넷 전체 사용자 성능을 증명하지 않음"
  - "before/after는 당시 production 데이터·Fargate 상태의 관측이며 보편적 비율이 아님"
  - "0.25→0.5 vCPU로 compute 비용이 증가하며 장기 비용은 실제 사용량에 따라 달라짐"
featured: true
draft: false
---

## 느린 spatial query를 보고 index부터 추가하지 않았다

그늘의 반경·kNN·bounds·추천 endpoint를 production에서 4 VU, 70초, read-only GET으로 조심스럽게 측정했습니다. 반경 검색 p95가 2.68초로 튀었고 다른 query도 수백 ms였습니다. 공간 검색이 느리니 GiST가 빠졌다고 추측하기 쉽지만 EXPLAIN은 반경과 kNN이 이미 geography GiST를 사용한다고 보여줬습니다.

0.25 vCPU Fargate task에서 scoring join과 JSON 응답이 겹칠 때 CPU가 빠르게 포화되는 쪽이 더 일관된 설명이었습니다. index를 무작정 늘리면 write cost만 추가하고 실제 병목은 남습니다.

## 한 가지 capacity lever만 먼저 바꿨다

memory 1GiB와 애플리케이션 설정을 유지한 채 task CPU만 0.25에서 0.5 vCPU로 바꿨습니다. live task definition을 수정한 뒤 Terraform default와 image deployment path도 512 CPU unit을 보존하게 맞췄습니다. 같은 부하 script로 다시 측정했습니다.

| query | before | after |
| --- | ---: | ---: |
| radius p95 | 2.68s | 1.39s |
| kNN p95 | 238ms | 98ms |
| bounds p95 | 395ms | 210ms |
| throughput | 1× | 2.1× |
| boot | 93s | 70s |

반경 p95는 약 48% 줄었고 처리량은 2.1배가 됐습니다. 한 번의 작은 측정이므로 “CPU를 두 배로 주면 항상 성능도 두 배”라고 일반화하지 않습니다. 다만 기존 index 사용을 확인한 상태에서 한 변수만 바꾼 전후 결과는 당시 병목이 CPU였다는 강한 근거였습니다.

## 다른 query에서 발견한 seq scan은 별도로 고쳤다

공간 검색이 아닌 “내 댓글”과 “내 반응” 조회에서는 `user_id` filter가 seq scan이었습니다. 이 두 경로에만 Flyway V18 index를 추가했습니다.

```sql
CREATE INDEX idx_review_comments_user
ON review_comments (user_id, created_at DESC);

CREATE INDEX idx_reactions_user
ON reactions (user_id, target_type, created_at DESC);
```

적용 뒤 Bitmap Index Scan으로 바뀌었습니다. review, following, radius, kNN, 선택적인 작은 bounds와 corridor query는 이미 index path여서 건드리지 않았습니다. 밀집 지역을 덮는 큰 bounds는 `LIMIT 100`을 빨리 채우는 낮은 선택도 조건이라 planner가 의도적으로 조기 종료 Seq Scan을 골랐습니다. “성능 작업”이라는 이유로 관련 없는 index를 한꺼번에 만드는 대신 실행 계획이 가리킨 두 곳만 수정했습니다.

## 바꾸지 않은 knob에도 근거가 있다

ECS autoscaling은 min 1, max 3과 CPU 60% target을 유지했습니다. task 하나의 capacity가 늘었으므로 같은 traffic에서 scale-out은 자연스럽게 늦어집니다. Hikari pool도 task당 10, 최대 세 task에서 30 connection으로 RDS 한도 안에 있었고 부하에서 connection wait가 병목이라는 증거가 없었습니다.

[ADR-0025](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0025-scale-prep-load-based-tuning.md)는 k6 조건, 실행 계획과 유지한 설정까지 기록합니다. compute 비용은 늘지만 당시 범위에서 대략 두 배 수준의 CPU allocation을 의식적으로 수용했습니다.

성능 튜닝은 모든 knob를 움직이는 작업이 아니었습니다. load test는 느린 증상을 찾고, EXPLAIN은 query path를 분리하며, 한 변수의 전후 측정은 원인 가설을 검증합니다. 바꾼 두 곳과 바꾸지 않은 두 곳을 모두 설명할 수 있어야 결과 수치가 기술 판단의 근거가 됩니다.
