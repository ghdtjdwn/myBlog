---
title: "모든 Pod가 받아야 하는 SSE 이벤트를 Kafka consumer group으로 설계하기"
description: "Redis·PostgreSQL 기반 전달에서 Kafka KRaft로 전환하며 broadcast semantics, bean cutover 장애와 broker 중단 복구까지 검증한 기록입니다."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["Kafka", "SSE", "Kubernetes", "Event-Driven"]
project: ssu-platform
role: "ssuMCP intent event bus의 Kafka 설계, 무중단 cutover 장애 복구와 운영 중단 실험"
evidence:
  - "ssuMCP ADR-0071·0089·0090·0091의 도입 기준, KRaft 구성과 intent bus 계약"
  - "cutover 중 LibraryIntentStatusBus 중복 bean으로 새 Pod가 crash-loop한 실제 rollout 기록"
validation:
  - "두 backend Pod의 unique consumer group 구독, topic 생성과 2/2 Ready 확인"
  - "Kafka 강제 삭제 중 약 32초 event-bus 중단, 약 47초 broker 회복과 health 유지 관측"
limitations:
  - "단일 broker·replication factor 1이라 Kafka 자체 고가용성을 제공하지 않음"
  - "새 Pod는 auto.offset.reset=latest이므로 연결 전 과거 이벤트 전체를 재생하지 않음"
  - "실제 예약부터 terminal SSE까지의 현장 E2E는 ADR 작성 시 남은 검증이었음"
featured: true
draft: false
---

## 처음에는 Kafka를 도입하지 않는 것이 맞았다

초기 intent 상태 전달은 PostgreSQL 정본과 가벼운 알림 경로로 충분했습니다. 영속 replay consumer, 서비스 간 독립 구독이나 운영할 broker가 없는데 Kafka를 넣으면 장애 지점과 메모리 비용만 늘어납니다. 그래서 ADR-0071에서는 명확한 도입 trigger가 생길 때까지 outbox와 기존 저장소를 유지했습니다.

이후 tool-call 관측 이벤트와 여러 Pod의 예약 intent SSE가 생겼습니다. producer와 consumer 수명이 분리되고 broker 장애 뒤 복구할 event pipeline이라는 실제 요구가 생겨서야 Kafka KRaft 단일 broker를 제한된 노드에 배치했습니다.

## 일반적인 같은 group 분산이 SSE에는 틀렸다

Kafka에서 같은 consumer group의 consumer들은 partition을 나눠 처리합니다. 작업 큐에는 맞지만, 어느 Pod에 연결될지 모르는 SSE client를 깨뜨립니다. intent A의 이벤트를 Pod 1만 받았는데 client가 Pod 2에 연결돼 있다면 terminal 상태가 화면에 오지 않습니다.

```text
Kafka topic
  -> group pod-1 -> ssuMCP Pod 1 -> its SSE clients
  -> group pod-2 -> ssuMCP Pod 2 -> its SSE clients
```

각 Pod가 고유 consumer group을 사용해 모든 새 이벤트를 받도록 했습니다. event key는 `intentId`로 두어 같은 intent의 순서를 같은 partition에서 보존합니다. 새 Pod가 과거 전체를 다시 방송하지 않도록 `latest`에서 시작하고, client 재연결 시에는 DB의 현재 상태를 먼저 조회합니다.

## 교체 순간에는 구현이 두 개 존재했다

cutover flag가 켜지자 Kafka delegate인 `kafkaLibraryIntentStatusBus`와 그 delegate를 반환하는 정식 facade/factory `libraryIntentStatusBus`가 모두 `LibraryIntentStatusBus` 타입 bean으로 노출됐습니다. 이전 bus가 함께 남은 문제가 아니라, 같은 Kafka 인스턴스로 이어지는 두 bean 정의의 타입 모호성이었습니다. `@Primary`가 없어서 새 Pod는 application context 생성 단계에서 crash-loop했고, unit test는 개별 adapter만 띄워 이 조합을 잡지 못했습니다.

다행히 Deployment의 `maxUnavailable: 0`가 이전 Ready Pod를 남겨 실제 서비스 중단은 없었습니다. 정식 facade/factory bean을 `@Primary`로 지정하고, 실제 Spring context와 EmbeddedKafka를 함께 띄우는 통합 테스트를 추가했습니다. cutover 테스트의 단위는 새 클래스가 아니라 “조건부 delegate와 정식 bean이 함께 생성되는 전체 애플리케이션”이어야 했습니다.

## broker를 실제로 끊어 보았다

bounded executor로 producer callback이 요청 경로를 무한정 막지 않게 하고, event 발행 실패가 핵심 API health를 즉시 내리지 않는 fail-open 경계를 뒀습니다. 그 정책이 문서에만 있지 않도록 운영에서 broker Pod를 강제로 삭제했습니다.

관측 결과 event bus는 약 32초 동안 사용할 수 없었고 broker는 약 47초 뒤 회복했습니다. 그동안 애플리케이션 health와 기존 API는 유지됐고, 재연결 뒤 consumer가 다시 구독했습니다. 두 backend Pod가 각각 고유 group으로 구독하고 topic이 생성된 사실은 확인했지만, 실제 좌석 예약부터 terminal SSE까지의 현장 E2E는 ADR 작성 시 남은 검증으로 명시했습니다.

## Kafka 채택보다 전달 의미가 먼저다

[ADR-0091](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0091-reservation-intent-bus-kafka.md)은 unique group, ordering key, 시작 위치와 장애 정책을 함께 기록합니다. 단일 broker이므로 Kafka 고가용성을 주장하지 않으며, SSE의 최종 안전망은 DB 상태 조회입니다.

이 사례에서 중요한 결정은 broker 제품이 아니었습니다. 어떤 이벤트를 모든 Pod가 받아야 하는지, 어디까지 replay할지, broker가 죽을 때 핵심 요청도 실패시킬지 먼저 정한 뒤 그 의미에 맞게 consumer group을 사용한 것이 핵심이었습니다.
