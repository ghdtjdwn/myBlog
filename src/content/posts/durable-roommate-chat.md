---
title: "그룹 채팅에서 MySQL을 정본으로 유지한 방법"
description: "STOMP를 빠른 전달 계층으로만 사용하고, 멱등 키·transactional outbox·cursor 복구로 그룹 채팅의 저장과 실시간성을 연결한 설계입니다."
publishedAt: 2026-08-09
category: backend
activity: competition
tags: ["Transactional Outbox", "WebSocket", "Idempotency", "MySQL"]
project: cham-domi
role: "Cham Domi 프론트엔드와 roommate 백엔드·운영 인프라 구현"
evidence:
  - "메시지·멤버십·outbox를 같은 트랜잭션에 저장하는 Spring Boot 구현과 Flyway migration"
  - "REST cursor·STOMP ticket·클라이언트 request generation을 연결한 FE·BE 채팅 계약"
  - "private 팀 저장소의 roommate chat 결정 문서, 작업 로그와 배포 계보"
validation:
  - "서로 다른 2026-07-31 전달 기록의 BE 295건 실패·오류 0, FE 226/226과 Node 정책 8/8"
  - "MySQL 8에서 SKIP LOCKED worker 분할, lease 회수, stale claim 거부와 V11→V19 migration 검증"
  - "운영 공개 health, Prometheus target·규칙과 public actuator 차단 확인"
limitations:
  - "1:1 실시간 event에는 그룹 채팅과 같은 durable outbox가 아직 없음"
  - "단일 replica의 ticket·presence·일부 rate limit은 메모리 상태라 수평 확장 전 외부화가 필요함"
  - "실제 두 계정 변경 E2E와 기기별 Push 수신·클릭은 완료되지 않음"
featured: true
draft: false
---

## 실시간 연결을 데이터베이스 대신 믿지 않기로 했다

결과 통지에서 2026학년도 숭실대학교 컴퓨터학부 소프트웨어공모전 은상 수상을 확인한 Cham Domi에서는 룸메이트 모집글의 승인된 사용자들이 단체방으로 대화합니다. 사용자는 메시지가 즉시 보이길 기대하지만, WebSocket 연결은 모바일 네트워크 전환이나 브라우저 절전으로 언제든 끊길 수 있습니다.

STOMP broker에 전달됐다는 사실을 저장 성공으로 간주하면 연결이 끊긴 사용자가 메시지를 복구할 기준이 없습니다. 반대로 REST polling만 사용하면 즉시성이 부족합니다. 그래서 두 책임을 분리했습니다.

```text
HTTP command
  └─ MySQL transaction: message + membership state + outbox
       ├─ REST history and cursor: authoritative recovery path
       └─ outbox worker -> STOMP user queue: low-latency delivery
```

MySQL과 REST 이력은 권위 데이터이고 STOMP는 커밋된 변화를 빠르게 전하는 계층입니다. 실시간 event를 놓쳐도 마지막으로 확인한 메시지 ID 이후를 다시 읽으면 같은 상태로 수렴할 수 있습니다.

## 재시도는 저장을 한 번만 만들어야 한다

모바일 클라이언트는 응답을 받기 전에 연결이 끊기면 같은 전송을 다시 시도합니다. 서버가 매 요청을 새 메시지로 저장하면 사용자는 같은 문장을 여러 번 보게 됩니다.

클라이언트가 메시지마다 UUID `clientMessageId`를 만들고, DB는 `(sender_id, client_message_id)` unique constraint를 최종 직렬화 지점으로 사용합니다. 같은 방과 같은 내용의 재시도에는 기존 메시지를 반환하고, 같은 키를 다른 방이나 내용에 재사용하면 `409 Conflict`로 거부합니다.

unique 충돌 뒤 기존 행을 반환할 때도 현재 방 멤버십과 권한을 다시 확인합니다. 강퇴·퇴장·재가입으로 membership epoch가 바뀌었다면 과거 키의 성공을 현재 권한으로 재생하지 않습니다. 삭제된 메시지의 평문을 보존하지 않으면서도 payload 재사용을 판별하기 위해 도메인·발신자·방·키·원문을 length-prefix로 묶은 HMAC-SHA-256 지문을 사용합니다.

애플리케이션의 사전 조회만으로는 동시 요청을 막을 수 없습니다. 두 요청이 동시에 존재하지 않음을 읽은 뒤 모두 insert할 수 있기 때문입니다. DB unique constraint가 경쟁을 결정하고, 충돌 처리는 별도 트랜잭션에서 권위 행을 다시 읽습니다.

## DB commit과 STOMP publish 사이를 outbox로 연결했다

메시지를 저장한 뒤 즉시 STOMP로 publish하는 단순 구조에는 두 실패 창이 있습니다.

- DB commit 전 publish하면 rollback된 메시지가 화면에 나타날 수 있습니다.
- DB commit 후 process가 종료되면 저장된 메시지가 실시간으로 전달되지 않습니다.

그룹 메시지와 읽음·멤버십 변화는 같은 DB transaction 안에서 outbox 행과 함께 저장합니다. worker는 commit된 event만 claim하고 STOMP로 보냅니다. 전달은 at-least-once이므로 event ID와 메시지 ID를 기준으로 클라이언트 상태가 중복 event에 수렴하도록 만들었습니다.

여러 worker가 같은 행을 처리하지 않도록 MySQL 8의 `FOR UPDATE SKIP LOCKED`로 batch를 나눕니다. claim에는 token과 30초 lease를 기록합니다. 느린 worker가 lease 만료 뒤 돌아와 새 worker의 결과를 완료 처리하지 못하도록 token이 일치할 때만 성공을 반영합니다. 일시 실패는 backoff 후 최대 8회 재시도하고, 반복 실패는 dead letter로 격리합니다.

이 구조가 exactly-once 전달을 보장한다고 표현하지 않습니다. 저장은 unique constraint로 한 번에 수렴하지만 event 전달은 at-least-once이며, 중복을 받아도 같은 화면 상태가 되도록 설계한 것입니다.

## 재연결 뒤에는 cursor와 revision으로 수렴한다

클라이언트는 REST 응답과 WebSocket event의 도착 순서를 신뢰하지 않습니다. 방마다 revision과 마지막 message ID를 보관하고, 재연결하면 `afterId` cursor로 누락된 이력을 조회합니다. 오래된 방 목록 snapshot이 최신 메시지나 삭제 상태를 되살리지 못하게 request generation과 high-watermark를 비교합니다.

읽음 cursor는 단조 증가합니다. 늦게 도착한 서버 snapshot이 현재 unread 값을 다시 늘리지 못하게 하고, 같은 삭제 REST 응답과 WebSocket event가 중복 도착해도 unread를 두 번 줄이지 않습니다. 방을 나가기 전에 시작된 요청도 완료 시점의 session·request generation이 달라졌다면 폐기합니다.

실시간 연결 인증에는 장기 JWT를 URL query로 보내지 않습니다. 브라우저는 Next.js BFF의 HttpOnly 세션으로 30초 유효한 1회용 ticket을 받고 STOMP CONNECT header로 전달합니다. 서버는 사용자당 session과 message burst에 상한을 두어 채팅 연결이 일반 REST 요청을 고갈시키지 않게 했습니다.

## 검증은 경쟁과 실패 창을 직접 만들었다

작은 단위 테스트만으로는 transaction과 worker 경쟁을 확인하기 어렵습니다. MySQL 8 통합 테스트에서 두 outbox 행을 두 worker가 겹치지 않게 나눠 claim하는지, lease 만료 전후 회수와 오래된 token의 완료 거부가 동작하는지 확인했습니다. 메시지 저장은 동시 같은 UUID, 다른 payload 충돌, 현재 멤버십 재검증과 cursor 단조 증가를 검증했습니다.

서로 다른 2026-07-31 전달 기록을 구분해 읽었습니다. 프론트엔드 PR #45는 226/226과 배포 정책 Node test 8/8을, 별도 BE·infra 전달은 백엔드 295건 실패·오류 0과 실제 MySQL V11→V19 migration 검증을 남겼습니다. 운영에서는 outbox 결과·oldest pending age·WebSocket 사용량을 저카디널리티 metric으로 수집하고 public application port에서 actuator가 노출되지 않는지 확인했습니다.

이 글을 작성하며 해당 기록과 현재 구현을 대조했지만 전체 제품 테스트를 새로 실행하지는 않았습니다. 따라서 숫자는 7월 31일 시점의 검증으로 표시합니다.

## 지금의 한계가 다음 확장 조건이다

현재 백엔드는 단일 replica라 1회용 ticket, presence와 일부 rate limit이 process memory에 있습니다. replica를 늘리기 전 Redis 같은 공유 TTL 상태와 외부 STOMP broker가 먼저 필요합니다. 1:1 실시간 event에도 아직 그룹 채팅과 같은 durable outbox가 없어 연결 단절 시 REST cursor가 복구 경로를 맡습니다.

실제 두 계정으로 승인·강퇴·퇴장·재가입과 재연결을 연속 수행하는 브라우저 E2E, 기기별 Push 권한·수신·클릭도 남아 있습니다. Alertmanager 외부 receiver가 없어 metric과 rule 검증을 실제 알림 전달 완료로 넓히지 않습니다. 이 제한을 닫기 전에는 단일 노드 공모전 서비스를 다중 replica 채팅 시스템으로 소개하지 않습니다.
