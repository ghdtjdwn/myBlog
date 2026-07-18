---
title: "테스트는 통과했는데 운영에서만 Bearer 요청이 401이 된 이유"
description: "Auth0용 Spring Security filter chain이 모든 경로를 선점해 다른 JWT를 거부한 운영 장애를 matcher 범위와 production-like 테스트로 해결한 기록입니다."
publishedAt: 2026-07-18
category: troubleshooting
activity: personal-project
tags: ["Spring Security", "JWT", "OAuth2", "Integration Test"]
project: ssu-platform
role: "ssuMCP 다중 JWT 보안 체인 장애 재현, matcher 분리와 운영형 OIDC 통합 테스트 구현"
evidence:
  - "ssuMCP ADR-0074의 MCP Auth0 resource-server filter chain 장애 분석"
  - "테스트의 rs-enabled=false와 운영의 true 차이를 비교한 설정·filter trace"
validation:
  - "rs-enabled=true와 WireMock OIDC issuer로 운영형 애플리케이션 컨텍스트 부팅"
  - "SmartID 정상·비정상 웹 요청, MCP invalid bearer challenge와 PRM discovery 계약 4건 검증"
limitations:
  - "두 JWT 체계의 현재 claim·issuer 계약을 대상으로 한 사례"
  - "permitAll은 선택된 filter chain의 인증 필터 실행 자체를 건너뛰게 하지 않음"
  - "향후 인증 진입점이 추가되면 matcher 순서와 겹침을 다시 검토해야 함"
featured: true
draft: false
---

## 같은 애플리케이션에 두 종류의 JWT가 있었다

ssuMCP 웹 API는 서블릿 레벨 `JwtAuthFilter`에서 내부 SmartID HS256 bearer를 검증하고, 표준 MCP endpoint는 Spring Security의 Auth0 OAuth resource-server 체인으로 보호합니다. 여기에 나머지 경로를 허용하는 fallback Spring 체인이 있었지만, Auth0 체인 자체에는 경로 matcher가 없었습니다.

운영에서 resource server 기능을 켠 뒤 웹 API의 정상 bearer 요청이 401로 바뀌었습니다. authorization rule에는 해당 경로가 `permitAll`로 보였기 때문에 처음에는 principal 변환이나 토큰 만료를 의심했습니다. 그러나 응답은 웹 체인까지 도달하기 전에 Auth0의 bearer filter가 HS256 토큰을 자기 issuer 토큰으로 해석하다 거부한 결과였습니다.

## permitAll은 앞선 인증 필터를 무효화하지 않는다

Spring Security의 `FilterChainProxy`는 요청과 일치하는 `SecurityFilterChain`을 선택하고 그 체인의 필터들을 실행합니다. `permitAll`은 authorization 결정이지, 이미 선택된 체인의 bearer authentication filter를 제거하는 명령이 아닙니다.

```text
request
  -> first matching SecurityFilterChain
  -> Auth0 BearerTokenAuthenticationFilter
  -> HS256 SmartID token rejected
  -> authorization rule never reached
```

해결은 토큰 파서를 느슨하게 만드는 것이 아니라 Auth0 체인의 책임 범위를 정확히 제한하는 것이었습니다.

```java
http.securityMatcher("/mcp", "/mcp/**", "/.well-known/**");
```

MCP와 discovery 경로만 Auth0 체인을 타고, 나머지는 permissive fallback Spring 체인이 받아 기존 서블릿 `JwtAuthFilter`의 웹 인증을 방해하지 않습니다. 이 구조는 “토큰이 어느 체계인지 시도해 보고 고른다”가 아니라 URL 경계에서 인증 프로토콜을 결정합니다.

## 왜 테스트는 모두 초록색이었나

기존 테스트 환경에서는 `rs-enabled=false`였습니다. 운영에서만 활성화되는 bean과 filter chain이 아예 만들어지지 않았으므로 웹 API 회귀 테스트가 통과하는 것은 당연했습니다. mock JWT 테스트도 개별 decoder 동작은 확인했지만 여러 chain이 함께 있을 때 누가 먼저 요청을 잡는지는 검증하지 않았습니다.

WireMock으로 OIDC discovery와 실제 공개 JWKS를 제공하고 운영과 같은 `rs-enabled=true` 조합으로 애플리케이션 컨텍스트를 띄웠습니다. 이 테스트는 Auth0 토큰을 서명하지 않습니다. 대신 장애와 경계 계약을 다음 네 사례로 고정했습니다.

- 정상 SmartID JWT로 `GET /api/auth/me`를 호출하면 200과 학번이 반환된다.
- 잘못된 bearer로 같은 웹 API를 호출하면 MCP challenge가 아닌 기존 웹 401 envelope가 반환된다.
- 잘못된 bearer로 `POST /mcp`를 호출하면 RFC 9728 `resource_metadata` challenge가 유지된다.
- 보호 리소스 metadata 문서는 `authorization_servers`를 계속 광고한다.

## 보안 설정도 라우팅 테이블처럼 검증한다

[Spring Security 문서](https://docs.spring.io/spring-security/reference/7.0/servlet/architecture.html)는 request matcher가 filter chain 호출을 결정한다고 설명합니다. [ADR-0074](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0074-mcp-oauth-chain-scoping.md)에는 실제 설정 차이와 복구 검증을 남겼습니다.

이 장애 이후 보안 체인을 단순 bean 목록이 아니라 우선순위가 있는 라우팅 테이블로 봅니다. 각 chain은 “무엇을 허용하는가”뿐 아니라 “어떤 요청을 소유하는가”를 명시해야 합니다. 그리고 운영에서만 켜지는 security flag는 production-like 테스트 조합에 반드시 포함해야 합니다. 가장 위험한 보안 버그는 테스트가 실패한 설정이 아니라 테스트에서는 존재하지 않았던 설정에서 나왔습니다.
