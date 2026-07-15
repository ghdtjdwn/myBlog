---
title: "브라우저에서 MCP 도구까지, 세 서비스의 신원 경계를 맞춘 과정"
description: "클라이언트가 주장한 principal을 버리고 서버 검증 subject와 명시 MCP 세션을 분리해 인증된 principal 소유 thread의 IDOR과 조용한 권한 강등을 막은 설계입니다."
publishedAt: 2026-07-15
category: backend
activity: personal-project
tags: ["Authentication", "IDOR", "MCP", "LangGraph"]
project: ssu-platform
role: "ssuAI·ssuAgent·ssuMCP의 신원 전달과 소유권 계약 설계·구현·검증"
evidence:
  - "ssuMCP ADR-0098과 52-tool live audit remediation record"
  - "ssuAI ADR-0086의 client principal strip·server subject injection"
  - "ssuAgent ADR-0011의 stable principal thread binding과 lazy migration"
validation:
  - "28개 private MCP tool의 no-binding·random·invalidated·mismatch 거부"
  - "ssuAI agent proxy 테스트 17개에서 strip, 3초 verifier, 401/503 fail-closed 검증"
  - "ssuAgent thread 소유권 핵심 테스트 8개에서 재로그인·타 principal·lazy migration 검증"
limitations:
  - "실제 대학 계정에 대한 쓰기 동작은 수행하지 않고 mock connector와 격리 DB로 검증"
  - "sha256(principal)은 원문 최소화 수단이며 위조 방어는 서버 프록시와 service API key 경계가 담당"
  - "로그인하지 않은 익명 흐름은 기존 세션·익명 계약을 유지"
  - "owner가 없는 익명 thread는 누구나 접근 가능한 기존 계약이므로 인증 principal 소유권 보장 범위 밖"
featured: true
draft: false
---

## 회전하는 세션 ID는 사용자 신원이 아니다

대화 thread의 소유자를 `mcp_session_id`로 저장하면 처음에는 자연스럽습니다. 그러나 이 값은 재로그인할 때마다 바뀝니다. 같은 사용자가 새 세션으로 돌아오면 이전 대화를 잃고, 반대로 세션 해석이 느슨하면 다른 세션의 상태를 읽거나 확정할 수 있습니다.

감사에서는 더 위험한 경로도 확인했습니다. private MCP tool에 잘못된 명시 세션 ID가 들어왔을 때 일부 코드가 transport-bound 세션으로 다시 해석했습니다. 호출자가 지정한 세션은 유효하지 않은데도, 우연히 연결된 다른 세션으로 조용히 fallback한 것입니다.

두 문제를 한 식별자로 해결하려 하지 않았습니다.

- 대화의 장기 소유권에는 서버가 검증한 안정 subject를 사용합니다.
- 대학 시스템 credential과 tool state에는 정확히 해석된 MCP 세션을 사용합니다.

## 신뢰 경계를 세 단계로 나눴다

```text
Browser
  │  bearer token + message (body principal은 신뢰하지 않음)
  ▼
ssuAI server proxy
  │  body principal 제거 → ssuMCP /api/auth/me 검증 → subject만 주입
  ▼
ssuAgent
  │  service API key로 프록시 확인 → sha256(subject)로 thread 소유권 비교
  ▼
ssuMCP
     명시 session은 정확히 조회하고 private tool state를 그 owner에 귀속
```

브라우저가 body에 `principal`을 넣어 보내도 ssuAI 프록시가 무조건 제거합니다. 프록시는 bearer를 ssuMCP의 `/api/auth/me`로 검증하고, 성공 응답의 subject만 ssuAgent에 주입합니다. JWT 자체를 orchestration 서비스까지 전달하지 않아 각 서비스가 토큰 검증을 중복 소유하지 않게 했습니다.

ssuAgent는 운영에서 service API key를 통과한 프록시 요청만 신뢰합니다. 검증된 subject는 원문 대신 `sha256(principal)`로 저장하지만, 이것은 DB에서 원문을 줄이기 위한 조치일 뿐입니다. 열거 가능한 식별자를 해시한다고 위조가 막히지는 않습니다. 위조 방어는 “서버 프록시만 주입한다”와 “ssuAgent가 프록시를 인증한다”는 두 경계에서 나옵니다.

## 인증 실패를 익명으로 낮추지 않는다

bearer가 아예 없는 요청은 기존 익명·세션 흐름을 사용할 수 있습니다. 반면 bearer를 제시했다면 결과는 셋 중 하나입니다.

| 검증 결과 | 동작 |
| --- | --- |
| 유효한 subject | client principal을 버리고 검증 subject를 주입 |
| 토큰 만료·거부 | 401로 종료 |
| verifier timeout·5xx·잘못된 응답 | 503으로 종료 |

검증 실패를 session owner로 fallback하면 같은 요청의 권한 수준이 조용히 바뀝니다. 이미 principal 소유로 승격된 thread를 새 session thread로 열거나, 사용자에게 대화가 사라진 것처럼 보일 수 있습니다. 그래서 verifier에는 3초 제한을 두되 실패하면 ssuAgent 호출 전에 멈춥니다.

## 명시 MCP 세션은 정확히 그 세션이어야 한다

ssuMCP의 [ADR-0098](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0098-authoritative-mcp-session-resolution.md)은 별도의 tool-state 경계를 정의합니다.

1. 비어 있지 않은 명시 ID는 정확히 조회합니다.
2. 없거나 만료·무효면 `INVALID_SESSION`이며 transport 세션으로 fallback하지 않습니다.
3. 명시 ID와 현재 transport binding이 다르면 `SESSION_MISMATCH`입니다.
4. ID가 생략됐을 때만 현재 transport binding을 사용할 수 있습니다.
5. 거부 응답은 다른 세션 ID나 로그인 URL을 노출하지 않습니다.

provider credential, action, wait intent, LMS preview와 export는 이렇게 해석한 MCP owner에 귀속됩니다. 안정 subject가 대화 히스토리를 소유한다고 해서 외부 시스템 credential까지 subject 하나로 합치지 않았습니다.

## 기존 thread는 요청 시점에 한 번만 승격한다

배포 전에 저장된 thread에는 안정 subject가 없었습니다. 원문 subject를 알지 못하는 배치 작업으로 과거 행을 추측할 수는 없습니다.

그래서 lazy migration을 선택했습니다. 기존 session 소유자가 같은 요청에서 올바른 세션과 서버 검증 principal을 함께 제시한 첫 순간에만 `owner_kind`를 `principal`로 바꿉니다. 이후에는 같은 principal이면 새 MCP 세션에서도 같은 thread를 사용하고, principal 없이 돌아온 예전 세션은 거부합니다. 승격을 여러 번 반복하지 않는 조건도 테스트로 고정했습니다.

## 테스트 수보다 거부 조합을 본다

[live-tool 감사 기록](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/audits/2026-07-14-live-tool-hardening.md)은 등록된 52개 도구의 계약을 확인하고, 28개 private tool에 no-binding, random explicit, invalidated explicit, valid-but-different explicit 조합을 보냈습니다. 모두 private data와 session 정보를 노출하지 않고 거부해야 통과합니다.

ssuAI에서는 client 값 제거, 검증 subject 주입, verifier timeout과 401/503 분리를 검사했습니다. ssuAgent에서는 같은 principal의 재로그인, 다른 principal의 탈취 시도, 익명 흐름, 기존 session thread의 1회 승격과 승격 후 session-only 거부를 확인했습니다. 실제 대학 계정 쓰기는 수행하지 않았고, 외부 write 경로는 mock connector와 격리 DB 범위로 남겼습니다.

이 설계의 핵심은 식별자를 많이 추가한 것이 아닙니다. 각 값이 무엇을 증명하는지와, 실패했을 때 다른 값으로 재해석해도 되는지를 서비스 경계마다 고정한 것입니다. 자세한 프록시 결정은 [ssuAI ADR-0086](https://github.com/ghdtjdwn/ssuAI/blob/main/docs/adr/0086-server-side-principal.md), thread 소유권은 [ssuAgent ADR-0011](https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0011-thread-stable-principal-binding.md)에 남겼습니다.
