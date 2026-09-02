---
title: "Cham Domi (참 도미)"
summary: "2026학년도 숭실대학교 컴퓨터학부 소프트웨어공모전 은상 수상작으로, 기숙사 탐색과 설명 가능한 룸메이트 매칭·채팅을 연결한 운영 서비스입니다."
status: operating
statusNote: "공개 웹과 백엔드 health가 운영 중입니다. 2026-08-09 공개 경로를 다시 확인했으며, 실제 두 계정의 전체 변경 흐름과 기기별 Push 수신은 추가 검증 과제로 남아 있습니다."
activity: competition
visibility: mixed
role: "프론트엔드 전반·roommate 백엔드·운영 인프라"
teamScope: "Google·Kakao 인증의 백엔드 핵심과 기숙사 검색·자격 판정은 팀원 소유이며, 저는 해당 계약의 프론트엔드 통합과 회귀·배포 검증을 담당했습니다."
contributionEvidence:
  - "FE 전반과 Spring Boot domain.roommate 구현, OpenAPI 기반 FE·BE 계약 동기화"
  - "룸메이트 매칭·채팅 테스트와 2026-07-31 기준 FE 226/226·BE 295건 검증 기록"
  - "OCI ARM64 k3s·Helm 배포, backup/restore 검증, Prometheus 경계와 배포 계보 기록"
image: "../../assets/projects/chamdomi-matching-flow.png"
imageAlt: "8개 생활 성향에서 DB 후보 생성, 백엔드 권위 재채점과 Stable Roommates 자동 배정으로 이어지는 흐름도"
screenshots:
  - image: "../../assets/projects/chamdomi-match.png"
    alt: "생활 성향 태그와 100점·89점 궁합 점수를 보여주는 Cham Domi 룸메이트 추천 화면"
    caption: "추천 결과 — 총점과 생활 성향 태그를 함께 보여주고 상세 화면에서 항목별 점수 기여도를 확인할 수 있습니다."
  - image: "../../assets/projects/chamdomi-filter.png"
    alt: "수면, 흡연, 청소, 성격, 소음과 생활 조건을 고르는 Cham Domi 상세 필터 화면"
    caption: "설명 가능한 필터 — 점수와 별개인 dealbreaker를 먼저 적용하고 생활 성향별 조건을 사용자가 직접 조절합니다."
  - image: "../../assets/projects/chamdomi-chat.png"
    alt: "룸메이트 후보와 생활 습관을 대화하는 Cham Domi 1대1 채팅 화면"
    caption: "채팅 — MySQL·REST 이력을 정본으로 두고 STOMP를 실시간 전달에 사용하며, 재연결 후 ID cursor로 누락을 복구합니다."
tags: ["Spring Boot", "Next.js", "Stable Roommates", "WebSocket"]
infra: ["MySQL", "Transactional Outbox", "k3s", "Helm", "Prometheus"]
metrics:
  - { label: "Award", value: "은상" }
  - { label: "Latest test records", value: "FE 226 · BE 295" }
order: 10
live: "https://chamdomi.vercel.app"
repositories: []
recordPlan: "비공개 팀 저장소의 코드·ADR·작업 로그를 원본으로 유지하고, 개인 기여와 공개 가능한 설계·검증·한계만 블로그 사례로 재구성합니다. 인증과 기숙사 도메인을 제 구현으로 주장하지 않습니다."
recordLinks: []
---

## 은상 수상과 현재 상태

Cham Domi는 기숙사 지원 조건 확인, 생활 성향 기반 룸메이트 추천과 커뮤니티를 한 모바일 웹 흐름으로 연결한 3인 팀 프로젝트입니다. 결과 통지에서 2026학년도 숭실대학교 컴퓨터학부 소프트웨어공모전 은상 수상을 확인했습니다. 공개된 [대회 안내](https://cse.ssu.ac.kr/bbs/board.php?bo_table=notice&wr_id=4932)는 대회명·일정·시상 체계를 설명하며, 심사 결과는 LMS와 팀장 개별 메일로 통지되는 방식입니다.

초기 프로토타입 이후 실제 API·인증 계약, 실시간 채팅, 운영 배포와 복구 경계를 닫았습니다. 2026-08-09 기준 `chamdomi.vercel.app`의 웹과 BFF, 공개 백엔드 health가 응답하는 것을 다시 확인했습니다. 이 확인은 공개 경로의 가용성을 뜻하며, 모든 로그인 사용자 흐름이 영구적으로 정상이라는 주장으로 넓히지 않습니다.

## 직접 맡은 범위와 팀 경계

프론트엔드 전반과 Spring Boot의 `domain.roommate`, FE·BE API 계약 통합, 전용 k3s 운영 인프라를 맡았습니다. 룸메이트 생활 성향, 추천·자동 배정, 모집글, 1:1·단체 채팅, 알림과 그 데이터 정합성이 직접 구현 범위입니다.

Google·Kakao 인증의 백엔드 핵심과 기숙사 공고 분석·검색·자격 판정은 팀원이 구현했습니다. 저는 해당 기능을 프론트엔드에 통합하고 OpenAPI snapshot과 생성 타입을 동기화했으며, 팀 변경이 roommate·배포 경계를 깨지 않는지 회귀 검증했습니다. 제품 전체 성과와 개인 기술 기여를 구분해 설명합니다.

## 설명 가능한 룸메이트 추천과 안정 배정

추천 점수는 수면, 흡연, 청소, 소음, 소통, 성격, 온도와 물건 공유의 8개 생활 성향을 가중 합산합니다. 단순 일치만 세지 않고 순서형 거리와 부분 유사도를 적용하며, 비흡연·수면·소음 같은 절대 조건은 점수 계산 전 dealbreaker로 제외합니다. 결과에는 총점뿐 아니라 항목별 점수 기여도를 함께 반환해 사용자가 추천 이유를 확인할 수 있게 했습니다.

TypeScript와 Java의 반올림 차이가 순위를 바꾸지 않도록 각 기여도를 0.1점 정수 단위로 누적한 뒤 양수 half-up으로 최종 점수를 만듭니다. MySQL은 전체 후보에 조건을 적용해 Top 400을 만들고, Spring Boot가 같은 계약으로 다시 계산해 Top 200을 권위 결과로 반환합니다. 동점은 profile ID 오름차순으로 고정합니다.

여러 사용자의 자동 배정에는 Irving의 Stable Roommates를 적용했습니다. 작은 입력의 모든 완전 매칭을 열거하는 brute-force oracle과 `n=4`, `n=6` 무작위 입력을 각각 400회 비교해 blocking pair가 없는지와 해 없음 판정을 검증했습니다.

## DB 정본 위에 실시간 채팅을 더한 구조

WebSocket을 데이터 원본으로 두지 않았습니다. 메시지와 읽음·멤버십은 MySQL과 REST 이력이 정본이고, STOMP/WebSocket은 커밋된 상태를 빠르게 전달하는 계층입니다. 연결이 끊기면 마지막 메시지 ID 이후를 REST로 다시 읽어 누락을 복구합니다.

클라이언트 UUID와 `(sender_id, client_message_id)` unique constraint로 재시도 중복 저장을 막았습니다. 단체 채팅은 메시지·멤버십 변경과 outbox 행을 같은 트랜잭션에 저장하고, 여러 worker가 `FOR UPDATE SKIP LOCKED`로 이벤트를 나눠 처리합니다. claim token과 30초 lease, backoff와 dead letter를 두어 오래된 worker의 완료 처리와 반복 실패를 분리했습니다.

브라우저는 REST 인증 토큰을 읽지 않습니다. Next.js BFF가 HttpOnly 세션을 보관하고 mutation의 origin을 검사합니다. WebSocket은 장기 JWT를 URL에 넣는 대신 30초 유효한 1회용 연결 ticket을 STOMP CONNECT header로 전달합니다.

## 배포·복구·관측을 완료 조건에 포함

프론트엔드는 Vercel, 백엔드는 OCI ARM64 단일 노드의 k3s에 배포했습니다. 운영 전달은 exact Git SHA와 OCI digest를 대조하고, 배포 직전 backup과 restore verification을 통과한 뒤 Helm rollout과 Flyway migration을 수행합니다. 설치 bundle, chart·runtime digest와 실제 Deployment revision이 다르면 HTTP가 정상이어도 health check를 실패시키도록 drift 검사를 구성했습니다.

Prometheus에는 outbox 처리 결과·가장 오래된 pending event·WebSocket 사용량을 사용자나 방 식별자 없이 기록합니다. management port는 공개 application port와 분리하고 NetworkPolicy로 monitoring namespace의 허용된 Pod만 접근하게 했습니다. 외부 Alertmanager receiver는 아직 없어 경보 규칙이 실제 알림 전달까지 완료됐다고 표현하지 않습니다.

## 검증과 한계

서로 다른 2026-07-31 전달 기록을 최신 스냅샷으로 구분해 사용했습니다. 프론트엔드 PR #45 기록은 Vitest 226/226와 배포 정책 Node test 8/8을, 별도 BE·infra 전달 기록은 백엔드 295건 실패·오류 0, OpenAPI 75개 경로 생성 일치, 실제 MySQL V11→V19 migration과 Helm·Kubernetes schema·backup/restore·배포 경계 검증을 남겼습니다. 하나의 통합 실행으로 합치지 않으며, 이 페이지를 갱신하면서 제품 테스트를 새로 실행한 값처럼 쓰지 않습니다.

현재 백엔드는 단일 replica입니다. 연결 ticket, presence와 일부 rate limit은 메모리 기반이므로 replica 수만 늘릴 수 없습니다. 자동 배정 결과도 아직 영속하지 않으며, 1:1 실시간 event에는 단체 채팅과 같은 durable outbox가 없습니다. 실제 두 계정의 로그인·상태 변경 E2E와 각 기기의 Push 승인·수신·클릭은 추가 검증이 필요합니다.
