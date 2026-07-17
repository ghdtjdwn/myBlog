---
title: "Testcontainers가 살아 있는데 Spring 테스트가 죽은 이유"
description: "클래스 수명 container와 재사용되는 Spring context의 수명 불일치를 해결하고, 예약 worker가 fixture를 훔치던 두 번째 CI flake까지 제거한 기록입니다."
publishedAt: 2026-07-17
category: engineering
activity: personal-project
tags: ["Testcontainers", "Spring", "CI", "Concurrency"]
project: ssu-platform
role: "ssuMCP 통합 테스트의 container·context 수명 분석과 비결정적 worker 격리"
evidence:
  - "ssuMCP TROUBLESHOOTING의 ApplicationContext failure threshold와 scheduler race 기록"
  - "CI 전체 suite 순서에서만 실패하던 mapped port·예약 fixture 재현"
validation:
  - "singleton container 전환 후 개별·전체 통합 테스트 반복 실행"
  - "예약 worker mock과 요청 상관관계 기반 delta assertion으로 CI 순서 의존성 제거"
limitations:
  - "테스트 환경의 수명주기 문제를 해결한 사례이며 운영 container orchestration을 검증한 것은 아님"
  - "동시성 회귀는 결정론적으로 통제했지만 모든 가능한 thread interleaving을 탐색하지는 않음"
featured: false
draft: false
---

## 단독으로는 통과하고 전체 suite에서만 실패했다

ssuMCP 통합 테스트 일부는 개별 실행하면 통과했지만 CI 전체 suite에서는 `ApplicationContext failure threshold exceeded`로 무너졌습니다. 뒤쪽 테스트가 참조한 PostgreSQL mapped port는 이미 닫혀 있었습니다.

초기 구성은 테스트 클래스마다 static `@Container`를 가졌습니다. Testcontainers는 클래스 종료 시 container를 내렸지만, Spring은 같은 설정의 `ApplicationContext`를 cache에 보관했습니다. 이후 다른 클래스가 그 context를 재사용하면 datasource는 종료된 container의 port를 계속 가리켰습니다.

```text
Test class lifecycle  : container 시작 ─ 테스트 ─ container 종료
Spring context cache  : context 생성 ───────────── 다른 클래스에서 재사용
```

두 수명주기가 서로 다른데도 정적 port를 하나의 계약처럼 공유한 것이 원인이었습니다. 실패한 context가 cache threshold에 걸리면서 뒤의 테스트까지 연쇄 실패해, 최초 원인보다 증상이 훨씬 크게 보였습니다.

## suite가 소유하는 singleton으로 수명을 맞췄다

container를 공통 singleton holder가 소유하고 JVM test suite 동안 유지하도록 바꿨습니다. Spring context가 재사용되는 동안 datasource endpoint도 살아 있게 만든 것입니다. 테스트마다 context를 강제로 버리는 방법도 있었지만 suite 시간이 늘고 실제 cache 동작을 피하는 데 그칩니다.

수정 뒤 개별 클래스와 전체 suite를 모두 실행했습니다. 이 순서가 중요합니다. 단독 성공만 보면 원래 문제를 재현하지 못하고, 전체 suite만 보면 어느 lifecycle 경계가 깨졌는지 좁히기 어렵습니다.

## 다음 flake는 존재하지 않는 설정 뒤에 숨어 있었다

container 문제를 제거하자 예약 관련 테스트가 간헐적으로 실패했습니다. 테스트는 `spring.task.scheduling.enabled=false`로 background worker를 끈다고 가정했지만, 이 설정은 해당 worker를 비활성화하는 실제 계약이 아니었습니다.

테스트가 만든 outbox row를 assertion 전에 scheduled worker가 소비했습니다. 그래서 “row가 생성되지 않았다”는 실패처럼 보였지만 실제로는 더 빨리 처리된 것입니다. 병렬 suite에서는 이전 테스트의 WireMock 호출까지 합쳐져 고정 호출 횟수 assertion도 흔들렸습니다.

예약 통합 테스트에서는 worker bean 자체를 mock해 비동기 소비를 명시적으로 멈췄습니다. 외부 호출 수는 suite 전체의 절대값 대신 요청 correlation id별 전후 delta로 검증했습니다. 비동기 기능을 문자열 설정에 기대어 끄는 것보다, 테스트가 경쟁 주체를 직접 소유하도록 만든 셈입니다.

## 비결정성을 없애되 현실도 잃지 않는다

통합 테스트에서 외부 자원과 background worker는 모두 독립적인 생명주기를 가집니다. 안정적인 suite는 다음을 명시해야 합니다.

- 자원을 누가 시작하고 언제 종료하는가
- cached context가 어떤 endpoint를 계속 참조하는가
- assertion 시점에 어떤 worker가 같은 row를 소비할 수 있는가
- 외부 호출을 전역 절대값이 아니라 해당 요청의 불변식으로 셀 수 있는가

worker를 mock한 테스트만으로 동시성 안전을 증명할 수는 없습니다. 별도의 worker 통합 테스트에서는 실제 소비와 상태 전이를 검증하고, fixture의 생성 계약을 보는 테스트에서만 경쟁자를 통제했습니다. 결정론과 현실성을 서로 다른 테스트 경계에 배치한 선택입니다.
