---
title: "8초짜리 승인 요청을 비동기 intent로 바꾼 이유"
description: "MCP confirm이 Tomcat 요청 스레드를 붙잡던 구조를 접수·상태 조회로 분리하고, 서로 다른 승인 action이 지워지던 범위 오류까지 함께 고친 기록입니다."
publishedAt: 2026-07-18
category: backend
activity: personal-project
tags: ["Spring Boot", "Async", "Concurrency", "MCP"]
project: ssu-platform
role: "ssuMCP 쓰기 도구의 confirm API, 승인 action 범위와 실행 intent 상태 조회 설계·구현·검증"
evidence:
  - "ssuMCP ADR-0086의 동기 confirm 처리량 분석과 scoped supersede 결정"
  - "설치된 WebMVC MCP transport가 blocking 호출 경로를 사용한다는 코드·의존성 확인"
validation:
  - "action 소유권·TTL·명시 action id와 H2 PostgreSQL mode 실스키마 회귀 테스트"
  - "confirm 즉시 접수 응답과 get_library_wait_status 후속 조회 계약 검증"
limitations:
  - "비동기 접수는 처리량 경계를 개선하지만 외부 학교 시스템의 성공을 보장하지 않음"
  - "웹·LMS 경로의 owner-wide supersede는 기존 UX 계약 때문에 의도적으로 유지"
  - "처리량 계산은 상한 추정이며 실제 PostgreSQL 경쟁이나 외부 예약 부하 측정값이 아님"
featured: true
draft: false
---

## 승인을 받는 HTTP 요청이 실제 작업까지 기다리고 있었다

도서관 좌석 예약은 모델이 바로 실행하지 못하게 `prepare → 사용자 승인 → confirm`으로 나눴습니다. 안전 경계는 생겼지만 MCP의 `confirm_action`이 외부 예약 결과를 최대 8초 동안 기다린 뒤 응답하는 동기 구조였습니다.

문제는 단지 응답이 느리다는 데 있지 않았습니다. 설치된 Spring WebMVC MCP transport를 따라가 보니 confirm 도구도 일반 MVC 요청처럼 Tomcat 스레드에서 blocking 서비스 호출을 수행했습니다. 요청 하나가 최대 8초를 점유한다면 200개 스레드의 이론상 상한은 초당 약 25건입니다. 외부 시스템이 느려질수록 우리 서버의 요청 수용량도 같이 줄어드는 결합이었습니다.

## 완료 응답과 접수 응답을 분리했다

confirm의 의미를 “예약이 끝났다”에서 “검증된 intent를 실행 큐에 접수했다”로 바꿨습니다.

```text
prepare
  -> PENDING approval action (ActionAudit)
user approval
  -> confirm(actionId)
  -> accepted response + reservation intentId
reservation intent
  -> REQUESTED
  -> [WAITING_FOR_SEAT] -> RESERVING
  -> SUCCEEDED | FAILED_RACE | FAILED_AUTH | FAILED_UPSTREAM
  -> CANCELLED | EXPIRED
client
  -> get_library_wait_status(mcp_session_id, intent_id)
```

confirm 요청에서 반드시 끝내야 하는 일만 남겼습니다. action의 소유자와 TTL을 검증하고, 중복 confirm을 차단하고, 실행 가능한 intent를 영속화한 뒤 식별자를 반환합니다. 외부 학교 시스템 호출은 worker가 수행하고, 클라이언트는 별도 상태 조회로 최종 결과를 확인합니다.

이렇게 하면 HTTP 성공과 업무 성공도 구분됩니다. “접수됨” 응답은 서버가 추적 가능한 예약 intent를 만들었다는 뜻이지, `ACCEPTED`라는 상태가 생겼거나 좌석이 이미 확보됐다는 뜻이 아닙니다.

## 이전 승인 action을 무효화하는 키가 너무 넓었다

비동기화 과정에서 별개의 모델에 있던 더 위험한 상태 전이도 발견했습니다. `prepare`가 새 `ActionAudit`을 만들 때 기존 PENDING 승인 action을 supersede하는 범위가 사용자 한 명 전체였습니다. 같은 사용자가 서로 다른 좌석이나 작업을 연속으로 준비하면 나중 요청이 앞의 무관한 승인 대기까지 지울 수 있었습니다.

MCP 경로에는 이미 action id와 target 정보가 있으므로 범위를 다음 키로 좁혔습니다.

```text
(owner, actionType, targetKey)
```

같은 사용자의 같은 대상에 대한 새 PENDING action만 이전 action을 대체합니다. 다른 좌석이나 다른 작업 종류의 승인 대기는 독립적으로 남습니다. 반면 웹·LMS의 기존 owner-wide 동작은 제품 계약이 달라 일괄 변경하지 않았습니다. 공통화 자체보다 각 진입점이 약속한 의미를 보존하는 편을 택했습니다.

## 동시성 테스트는 상태 전이를 검증해야 한다

단위 테스트에서는 즉시 응답만 확인하지 않았습니다. action 소유권 위조, 만료·소비된 action과 명시 action id를 검사하고, Flyway가 만든 H2 PostgreSQL mode 스키마에서 같은 target 재준비만 supersede되고 다른 target 두 건은 동시에 PENDING으로 남는지 고정했습니다. 실제 PostgreSQL lock 경쟁이나 외부 예약 부하는 이번 근거에 포함하지 않습니다. 비동기 API에서 중요한 것은 “스레드를 빨리 돌려준다”가 아니라 중복 실행 없이 최종 상태를 추적할 수 있다는 점입니다.

[ADR-0086](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0086-confirm-action-async-and-scoped-supersede.md)은 처리량 계산, 대안과 상태 전이 근거를 남깁니다. 이 변경으로 느린 외부 시스템을 요청 스레드 수명에서 분리했지만, worker 정체와 외부 실패는 여전히 관측·재시도·만료 정책으로 다뤄야 합니다. 비동기는 실패를 없애는 기술이 아니라 실패가 머무를 올바른 경계를 만드는 기술이었습니다.
