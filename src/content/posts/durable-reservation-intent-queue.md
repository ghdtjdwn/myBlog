---
title: "동일 좌석 100건을 외부 쓰기 1건으로 줄인 예약 큐"
description: "비멱등 학교 시스템 쓰기를 Postgres intent, 짧은 claim lease, outbox와 좌석 단위 조정으로 보호한 동시성 설계입니다."
publishedAt: 2026-07-17
category: backend
activity: personal-project
tags: ["PostgreSQL", "SKIP LOCKED", "Outbox", "Concurrency"]
project: ssu-platform
role: "예약 intent 상태머신·worker·outbox·복구 계약 설계, 구현과 부하 검증"
evidence:
  - "ssuMCP ADR-0022, ADR-0047, ADR-0079와 도서관 에이전트 k6 baseline"
  - "동일 좌석 100명 burst의 DB·WireMock·metric 대조 기록"
validation:
  - "100건에서 SUCCESS 1·FAILED_RACE 99와 외부 reserve POST 1건 확인"
  - "24,000 read를 약 42 upstream call로 접은 cache·single-flight 재측정"
  - "서킷 OPEN 동안 약 1,000 요청이 계속 들어와도 upstream call 0건 확인"
limitations:
  - "WireMock 지연과 로컬 환경의 절대 latency를 실제 Pyxis 성능으로 일반화하지 않음"
  - "upstream write 성공 후 DB terminal 저장 실패는 read-after-uncertainty와 운영 확인이 필요함"
  - "Redis seat lock은 fencing 없는 효율 장치이며 correctness의 최종 근거가 아님"
featured: true
draft: false
---

## row lock 하나로는 같은 좌석 경쟁을 막을 수 없다

초기 도서관 예약은 `prepare → confirm` 뒤 요청 thread가 외부 Pyxis에 바로 쓰는 구조였습니다. action row의 pessimistic lock은 한 사용자가 같은 action을 두 번 소비하는 일은 막았지만, 서로 다른 사용자 100명이 같은 좌석을 확인하면 100개의 서로 다른 row가 모두 외부 쓰기에 도달했습니다.

첫 부하 실험에서 동일 좌석 100건은 `SUCCESS 2`, `FAILED_RACE 98`로 수렴했습니다. 잔류 action은 0이어서 각 row의 상태머신은 맞았습니다. 하지만 외부 시스템에 100번 쓰고 그곳의 경합 결과에 correctness를 맡기는 구조였습니다.

목표를 “내 DB에서 결과가 정리된다”에서 “학교 시스템에는 필요한 쓰기만 보낸다”로 바꿨습니다.

## intent가 실행 단위이고 audit은 동의 증거다

두 책임을 한 row에 합치지 않았습니다.

- `action_audit`은 사용자가 어떤 쓰기에 동의했는지 보존합니다.
- `library_reservation_intents`는 worker가 claim하고 실행하는 내구성 상태입니다.
- `library_reservation_outbox`는 상태 전이와 같은 transaction에서 생긴 event를 나중에 전달합니다.

상태는 다음처럼 진행합니다.

```text
REQUESTED → WAITING_FOR_SEAT → RESERVING → SUCCEEDED
                                      ↘ FAILED_RACE
                                      ↘ FAILED_AUTH
                                      ↘ FAILED_UPSTREAM
```

즉시 confirm은 `REQUESTED → RESERVING`으로 갈 수 있고, 대기 예약은 자리가 없으면 backoff 후 `WAITING_FOR_SEAT`로 돌아갑니다. 등록 자체가 동의인 `wait_for_library_seat`만 일반 `prepare → confirm`의 명시적 예외입니다.

## claim transaction 안에서 HTTP를 호출하지 않는다

worker는 `FOR UPDATE SKIP LOCKED`로 실행 가능한 row를 짧게 claim하고 `RESERVING`, `locked_until`을 기록한 뒤 transaction을 끝냅니다. 그다음에 외부 좌석 조회와 예약을 수행합니다.

HTTP 호출 동안 row lock을 잡으면 다른 worker, vacuum과 상태 조회까지 느린 upstream에 묶입니다. 대신 lease가 worker 소유권을 나타내고, terminal 상태와 outbox event를 두 번째 짧은 transaction에서 함께 저장합니다.

process가 외부 예약 성공 뒤 DB 저장 전에 죽을 수 있습니다. 이때 비멱등 `reserve`를 다시 호출하지 않습니다. 만료 lease의 reaper는 `getCurrentCharge()`라는 read로 실제 좌석 상태를 확인합니다.

```text
현재 charge 있음 → SUCCEEDED
charge 없음       → FAILED_UPSTREAM
credential 거부  → FAILED_AUTH
```

응답 유실을 write retry로 덮지 않고 read-after-uncertainty로 해석합니다.

## 100건을 1건으로 접은 두 경계

한 worker tick 안에서는 같은 seat id를 group으로 묶어 winner 하나만 외부로 보냅니다. 첫 개선 뒤 사용자 결과는 이미 1/99였지만, burst가 여러 tick에 나뉘면 WireMock에서 두 번째 POST가 보였습니다.

그래서 action TTL 안에 같은 좌석의 최근 immediate terminal attempt가 있으면 다음 group을 로컬 `FAILED_RACE`로 닫는 좁은 억제를 추가했습니다. 여러 pod에서는 Redisson seat lock이 같은 시점의 중복 호출을 더 줄입니다.

Redis lock을 correctness의 근거로 쓰지는 않습니다. fencing token이 없는 lock은 GC pause나 network partition에서 절대적 상호배제를 증명하지 못합니다. Postgres 상태와 외부 결과가 최종 근거이고, seat lock은 upstream 비용을 줄이는 효율 장치입니다. lock을 못 잡으면 요청을 외부에 보내지 않고 경합으로 닫는 현재 운영 계약도 테스트로 고정했습니다.

## latency를 늘려 upstream을 보호한 선택

같은 로컬 조건의 비교는 다음과 같습니다.

| 경로 | 직접 confirm | intent worker |
| --- | ---: | ---: |
| 외부 reserve POST | 100 | 1 |
| 결과 | 성공 2 / 경합 98 | 성공 1 / 경합 99 |
| confirm p95 | 1.50s | 3.08s |

worker tick과 DB 전이를 기다리므로 사용자 latency는 늘었습니다. 이 변경의 성과는 응답 시간 개선이 아니라 단일 egress IP에서 학교 시스템에 보내는 write amplification을 100분의 1로 줄인 것입니다.

후속 재측정에서는 24,000 read가 cache와 single-flight를 거쳐 약 42 upstream call로 접혔고, 25 RPS 장애 주입 중 circuit breaker가 열린 약 40초 동안 약 1,000 요청이 계속 들어와도 upstream call은 0건이었습니다. 읽기, 쓰기 경합, upstream 장애가 각각 다른 보호 장치로 닫혔음을 수치로 확인했습니다.
