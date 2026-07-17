---
title: "Redis 없이 3개 인스턴스에 실시간 급증을 전달한 방법"
description: "PostgreSQL NOTIFY는 무효화 신호로만 쓰고 DB 재조회와 SSE snapshot 복구를 결합해 작은 ECS 서비스의 멀티 인스턴스 실시간 경계를 설계했습니다."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["PostgreSQL", "SSE", "ECS", "Distributed Systems"]
project: geuneul
role: "Geuneul 실시간 surge 감지·전파 구조, trigger·listener·SSE 복구 계약 설계·구현"
evidence:
  - "Geuneul ADR-0016의 cross-instance invalidation 선택과 대안 비교"
  - "PostgreSQL trigger·LISTEN/NOTIFY, SSE snapshot endpoint와 fallback polling 구현"
validation:
  - "실제 PostgreSQL NOTIFY를 포함한 통합 테스트와 listener·SSE 단위 테스트"
  - "멀티 인스턴스 조건에서 DB 재조회 뒤 동일한 최신 snapshot을 전달하는 경로 검증"
limitations:
  - "LISTEN/NOTIFY는 durable event log가 아니며 listener 단절 중 신호가 유실될 수 있음"
  - "최대 3개 ECS 인스턴스와 낮은 event rate를 전제로 한 선택이며 대규모 event stream에 적합하지 않음"
featured: true
draft: false
---

## in-memory event는 다른 인스턴스에 도달하지 않는다

Geuneul은 특정 지역의 혼잡·위험 signal이 급증하면 연결된 browser에 SSE로 갱신을 보냅니다. 단일 process에서는 application event만으로 충분하지만 ECS service가 최대 3개 인스턴스로 늘어나면 문제가 생깁니다. 변경을 처리한 인스턴스와 사용자의 SSE connection을 가진 인스턴스가 다를 수 있습니다.

Kafka는 durable stream과 replay가 필요할 때 강력하지만, 이 기능의 event rate와 운영 규모에는 broker 비용이 더 컸습니다. Redis Pub/Sub도 후보였지만 Redis는 이미 없어져도 되는 cache 역할이었습니다. cache 장애가 실시간 정합성 경계까지 가져가는 구조를 피하고 싶었습니다.

데이터를 최종 확정하는 PostgreSQL이 모든 인스턴스가 공유하는 유일한 상태였습니다. 그래서 `pg_notify`를 cross-instance invalidation signal로 사용했습니다.

## payload가 아니라 “다시 읽으라”는 신호를 보낸다

변경 transaction의 trigger가 channel에 작은 식별자만 알립니다. 각 application instance는 전용 connection으로 `LISTEN`하고 있다가 알림을 받으면 PostgreSQL에서 현재 상태를 다시 조회합니다. SSE client에는 이 최신 snapshot을 보냅니다.

```text
transaction commit
  -> trigger / NOTIFY(region key)
  -> every instance LISTEN
  -> authoritative DB re-read
  -> local SSE connections receive snapshot
```

NOTIFY payload에 완성된 business event를 담지 않은 이유는 전달 보장 때문입니다. NOTIFY는 durable queue가 아니며 listener가 잠시 끊기면 event를 놓칠 수 있습니다. payload를 사실로 취급하면 그 순간 application 상태가 영구적으로 갈라집니다. 신호를 놓쳐도 DB의 최신 row는 남아 있으므로 재조회가 정합성 경계가 됩니다.

## snapshot polling이 끊긴 시간의 복구 경로다

browser도 SSE event만 누적 적용하지 않습니다. 최초 연결과 reconnect 때 snapshot endpoint를 조회하고, 연결이 불안정하면 낮은 빈도의 polling으로 최신 상태를 다시 맞춥니다. SSE는 지연을 줄이고 snapshot은 정확성을 회복합니다.

listener에는 reconnect와 health 상태를 두었습니다. connection을 계속 점유하므로 일반 connection pool query와 역할을 분리하고, shutdown 때 LISTEN connection과 SSE emitter를 정리합니다. 알림 처리 중 동일한 지역 key가 몰리면 재조회를 합쳐 불필요한 burst도 줄였습니다.

## 규모에 맞는 일관성 비용을 선택했다

통합 테스트는 실제 PostgreSQL trigger가 NOTIFY를 발생시키고 listener가 DB를 다시 읽는 경로를 포함합니다. 별도 테스트는 SSE 연결·해제, snapshot 교체와 fallback을 검증했습니다. 핵심 assertion은 event를 몇 번 받았는지가 아니라 최종 snapshot이 database의 최신 상태와 같은지였습니다.

이 설계는 최대 3개 인스턴스와 낮은 event rate에 맞춘 것입니다. 순서 보장, 장기 replay, 소비자별 offset이 필요해지면 durable log가 더 적절합니다. 작은 시스템에서도 분산 경계를 무시하지 않되, 아직 필요하지 않은 broker를 운영하지 않는 선택이었습니다.
