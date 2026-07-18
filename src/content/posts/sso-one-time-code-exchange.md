---
title: "Set-Cookie 파싱 장애를 일회용 SSO code exchange로 없앤 과정"
description: "다중 Set-Cookie와 프록시 경계에서 깨진 로그인 전달을 256-bit 일회용 코드, Redis 원자 소비와 same-origin 교환으로 재설계한 기록입니다."
publishedAt: 2026-07-18
category: backend
activity: personal-project
tags: ["SSO", "Redis", "Cookies", "Security"]
project: ssu-platform
role: "ssuAI·ssuMCP SSO callback 장애 진단과 일회용 authorization code 교환 프로토콜 설계·검증"
evidence:
  - "ssuMCP ADR-0095와 ssuAI ADR-0089의 다중 Set-Cookie 원인 분석"
  - "Traefik affinity cookie가 추가된 실제 응답과 프록시의 단일 cookie 파싱 경로 비교"
validation:
  - "Redis get-and-delete 기반 1회 소비·120초 만료·재사용 거부 단위 테스트"
  - "callback 200·무쿠키 응답, exchange token/cookie 계약과 frontend single-flight 자동 테스트"
limitations:
  - "authorization code는 짧은 시간 URL·browser history·access log에 노출될 수 있음"
  - "Redis 장애 시 로그인을 fail-closed로 중단하며 별도 가용성 비용이 생김"
  - "브라우저 기반 first-party SSO 흐름을 대상으로 하며 범용 OAuth server 구현은 아님"
  - "수정 후 전체 운영 browser exchange는 기록된 검증 근거에 포함되지 않음"
featured: true
draft: false
---

## 처음 의심한 것은 302 redirect였다

로그인 callback은 ssuMCP가 세션 cookie를 발급하고 ssuAI로 redirect하는 구조였습니다. 로컬에서는 동작했지만 운영 프록시를 거치면 브라우저에 필요한 cookie가 남지 않았습니다. 처음에는 302 응답과 Vercel redirect가 `Set-Cookie`를 잃는다고 가정했습니다.

패킷과 실제 헤더를 비교하자 원인은 달랐습니다. Traefik의 affinity 기능이 두 번째 `Set-Cookie`를 추가했고, 중간 프록시 코드는 여러 cookie 헤더를 하나의 문자열처럼 파싱했습니다. 세션 cookie 자체는 올바르게 발급됐지만 전달 계층이 다중 헤더 의미를 보존하지 못했습니다.

단일 cookie를 골라 복사하는 응급 수정도 가능했지만, backend domain의 session cookie를 frontend proxy가 해석하고 재발급하는 구조 자체가 취약했습니다.

## callback은 자격증명이 아니라 짧은 수명의 코드를 전달한다

SSO 완료 후 256-bit 난수 code를 만들고 Redis의 code 기반 key에 학번만 120초 동안 저장합니다. callback은 cookie를 프록시하지 않고 code만 브라우저로 전달합니다.

```text
1. ssuMCP callback authenticates the user
2. store exchange-code key -> studentId in Redis
3. return 200 page with a JavaScript redirect
4. ssuAI sends same-origin POST /api/auth/exchange
5. ssuMCP atomically consumes the code
6. exchange response returns an access token + HttpOnly refresh cookie
```

302 대신 200 HTML과 JavaScript redirect를 사용한 이유는 Vercel이 redirect 응답을 별도 처리한다는 가설 때문이 아닙니다. 브라우저가 code를 받은 뒤 frontend의 same-origin endpoint에서 명시적으로 교환하게 하여 cookie 설정 주체를 하나로 만들기 위해서입니다.

## 일회용이라는 말은 원자 연산으로 보장한다

code 조회 후 별도 삭제를 하면 동시에 들어온 두 요청이 같은 code를 사용할 수 있습니다. Redis의 get-and-delete 의미를 사용해 읽기와 소비를 한 연산으로 묶었습니다. code는 Redis key에 포함되고 값은 학번 하나입니다. 교환 시 학생을 다시 조회한 뒤 access JWT와 refresh cookie를 발급하며, 다음 조건을 강제했습니다.

- 120초가 지나면 교환할 수 없다.
- 한 번 성공한 code는 즉시 사라진다.
- 실패한 code를 session cookie로 승격하지 않는다.
- Redis를 사용할 수 없으면 임시 우회 cookie를 만들지 않고 로그인에 실패한다.

code는 URL에 잠시 등장하므로 browser history나 access log 노출 가능성이 완전히 사라지지는 않습니다. 짧은 TTL, 1회 소비, HTTPS와 로그 redaction으로 위험을 줄였지만 이 한계를 문서에 남겼습니다.

## 헤더 복사 문제를 프로토콜 경계로 바꿨다

[ssuMCP ADR-0095](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0095-sso-authorization-code-exchange.md)와 [ssuAI ADR-0089](https://github.com/ghdtjdwn/ssuAI/blob/main/docs/adr/0089-sso-code-exchange.md)은 처음 가설, 반증과 교환 계약을 양쪽 서비스 관점에서 기록합니다. backend 테스트는 callback의 200·무쿠키 응답, code의 소비·만료·재사용 거부와 exchange 응답 계약을 고정하고, frontend 테스트는 StrictMode 중복 실행에서도 교환을 한 번만 보내는지 확인합니다. 수정 후 전체 운영 browser 교환은 기록된 검증으로 주장하지 않습니다.

핵심은 `Set-Cookie` split 함수를 더 정교하게 만드는 데 있지 않았습니다. 서비스 A의 cookie를 서비스 B가 중계하던 암묵적 결합을 없애고, 짧은 수명의 capability를 명시적인 POST로 교환하는 프로토콜을 만든 것이 해결이었습니다.
