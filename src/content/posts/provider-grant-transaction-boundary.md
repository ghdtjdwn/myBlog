---
title: "3/3 연결인데 개인 도구가 열리지 않은 이유"
description: "웹 로그인, provider credential, MCP session grant를 분리하고 실제 복사 성공만 연결 상태로 인정한 3서비스 인증 장애 기록입니다."
publishedAt: 2026-07-17
category: backend
activity: personal-project
tags: ["Spring Security", "Transactions", "MCP", "Identity"]
project: ssu-platform
role: "ssuMCP credential 영속화·세션 grant와 ssuAI 연결 상태 계약 설계·구현·검증"
evidence:
  - "ssuMCP PR #223과 ssuAI PR #245의 provider grant·status 계약"
  - "web-session 500과 거짓 3/3 표시를 재현한 2026-07-16 트러블슈팅 기록"
validation:
  - "실제 Spring proxy를 통과하는 credential 복사, 부분 grant, 보상 삭제와 subject 검증 통합 테스트"
  - "backend·frontend main CI와 Security workflow 성공"
  - "운영 3/3 full-grant 졸업요건 E2E, 무인증 401, 악성 Origin 403과 web-session 5xx 부재 확인"
limitations:
  - "V17 이전 JVM 메모리 credential은 복구하지 못해 해당 사용자는 provider를 한 번 다시 연결해야 함"
  - "partial grant와 focus·JWT 회전의 전체 운영 E2E는 남아 있음"
  - "현재 kube context에서 ArgoCD·실행 Pod 상태를 직접 확인했다고 주장하지 않음"
featured: true
draft: false
---

## 로그인 성공과 서비스 연결은 같은 사실이 아니다

ssuAI 상단에는 u-SAINT, LMS, 도서관이 모두 연결됐다고 표시됐지만, 채팅에서 개인 학사나 LMS 질문을 보내면 연결 안내가 반복됐습니다. 같은 시점에 `POST /api/mcp/auth/web-session`은 HTTP 500을 반환했습니다.

처음에는 agent의 인증 prompt나 사용자 로그인 실패를 의심할 수 있었습니다. 그러나 Prometheus에서 500은 agent에 도달하기 전 web-session endpoint에서 발생했습니다. 유효한 access token도 확인됐습니다. 이 증거로 다음 세 상태를 분리했습니다.

```text
웹 identity        서버가 사용자를 인증했는가
provider credential 외부 학교 시스템에 접근할 수 있는 영속 자격이 있는가
MCP session grant   이 MCP 세션에 어떤 credential이 실제로 복사됐는가
```

JWT가 유효하다는 사실은 SAINT나 LMS credential row가 존재한다는 뜻이 아닙니다. 과거 쿼리가 성공했다는 UI 기억도 지금 새 MCP 세션이 그 credential을 사용할 수 있음을 증명하지 못합니다.

## `@Transactional`이 있어도 transaction이 없었던 이유

credential row가 있는 통합 재현에서는 `findForUpdate()`가 활성 transaction 없이 실행돼 실패했습니다. 겉으로는 저장 메서드에 `@Transactional`이 붙어 있었습니다. 문제는 `copyForSession()`이 같은 bean의 transactional 메서드를 내부 호출했다는 점입니다.

Spring의 기본 proxy 기반 transaction은 외부에서 proxy를 통과할 때 시작됩니다. 같은 객체 안의 self-invocation은 proxy를 우회합니다. 결과적으로 row lock query는 transaction 밖에서 실행됐습니다.

credential row가 아예 없는 경우는 더 조용했습니다. 세션 생성 자체는 201로 끝났지만 연결된 provider는 하나도 없었습니다. 구 응답과 UI는 이 차이를 표현하지 못해 빈 세션까지 `3/3 연결`로 보이게 했습니다.

## 서버가 발급한 grant만 연결 상태로 사용한다

수정 뒤 `copyForSession()` 전체가 외부 transaction 경계가 됐습니다. source credential의 만료와 health를 보존하고 새 opaque owner key로 재암호화한 뒤, 복사에 성공한 provider만 `linkedProviders`에 넣습니다.

발급 중간에 실패하면 이미 만든 MCP session과 복사된 credential을 함께 보상 삭제합니다. provider 하나가 없다고 도서관-only 사용까지 막지는 않지만, 실패한 provider를 성공처럼 표시하지도 않습니다.

ssuAI도 access token이나 과거 요청 결과로 연결 상태를 추정하지 않습니다. private stream이나 HITL을 시작하기 전에 single-flight로 세션 발급을 기다리고, 서버가 반환한 grant를 유일한 근거로 사용합니다. status endpoint는 JWT 사용 시 subject 일치, 도서관-only 사용 시 활성 library session을 확인한 뒤 같은 session id의 현재 grant를 다시 읽습니다.

`studentId`를 provider principal로 바로 공유하는 안은 선택하지 않았습니다. 여러 MCP session이 하나의 mutable credential namespace를 같이 쓰면 세션 격리와 폐기 경계가 흐려집니다. 웹 identity는 사용자를 증명하고, provider grant는 이 세션이 실제로 사용할 수 있는 외부 자격을 증명하도록 역할을 나눴습니다.

## 복구를 어떤 증거로 완료했나

[ssuMCP PR #223](https://github.com/ghdtjdwn/ssuMCP/pull/223)과 [ssuAI PR #245](https://github.com/ghdtjdwn/ssuAI/pull/245)에 다음 회귀를 고정했습니다.

- 실제 Spring proxy를 통과하는 영속 credential 복사
- 빈 grant와 provider 일부만 성공한 partial grant
- 만료·health 보존과 중간 예외의 보상 삭제
- status의 subject·expiry 검증
- frontend의 필드 누락·빈 목록 fail-closed, JWT 회전과 identity 경쟁

두 저장소의 main CI와 Security workflow가 성공한 뒤 운영에서 full `3/3` grant로 개인 졸업요건 E2E를 확인했습니다. 무인증 요청은 401, 허용하지 않은 Origin은 403이었고 새 process 구간에서 web-session 5xx가 다시 나타나지 않았습니다.

다만 V17 이전에 JVM 메모리에만 있던 credential은 DB로 이관할 수 없습니다. 그 상태의 사용자는 한 번 재연결해야 합니다. 이 한계를 숨기지 않는 것도 연결 상태 계약의 일부입니다.
