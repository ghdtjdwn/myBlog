---
title: "승인 카드는 떴는데 예약은 실행되지 않은 이유"
description: "MCP content block, LangGraph checkpoint fork와 stale action을 차례로 분리해 승인 이후까지 검증 가능한 HITL 상태머신으로 만든 기록입니다."
publishedAt: 2026-07-17
category: ai-systems
activity: personal-project
tags: ["LangGraph", "HITL", "Checkpoint", "MCP"]
project: ssu-platform
role: "ssuAgent의 MCP 결과 정규화, interrupt·resume와 turn-scope 승인 경계 설계·구현·E2E"
evidence:
  - "ssuAgent ADR-0016, ADR-0017, ADR-0019와 PR #39·#40·#44"
  - "승인 카드 미표시, resume 무음 종료와 stale action 재실행 트러블슈팅 기록"
validation:
  - "실제 content_and_artifact StructuredTool과 실제 supervisor graph·checkpointer 회귀 테스트"
  - "prepare→interrupt→승인→confirm_action→worker success 운영 E2E"
  - "현재 사용자 턴 이전의 action id가 승인 게이트를 다시 열지 않는 조합 검증"
limitations:
  - "실제 학교 쓰기는 검증 당시 통제된 좌석 예약 한 건이며 일반 부하 성능을 증명하지 않음"
  - "provider와 LangGraph 버전이 바뀌면 event·message shape 계약을 다시 확인해야 함"
  - "외부 write 성공 후 내부 terminal 저장이 실패하는 불확실성은 별도 복구 경계"
featured: true
draft: false
---

## HITL은 카드 렌더링에서 끝나지 않는다

도서관 예약 도구는 `prepare` 결과의 action id를 발견하면 LangGraph를 interrupt하고, 사용자가 카드에서 승인한 뒤 `confirm_action`을 실행합니다. 이 흐름에서 서로 가려져 있던 세 결함이 차례로 드러났습니다.

1. backend에는 PENDING action이 생겼지만 승인 카드가 나타나지 않았습니다.
2. 카드를 살린 뒤에는 승인 요청이 HTTP 200으로 끝나도 confirm이 실행되지 않았습니다.
3. resume까지 고친 뒤 재감사에서는 과거에 거절한 action이 다음 사용자 턴에서 다시 승인될 수 있었습니다.

“interrupt가 발생한다”와 “사용자가 승인한 정확한 action이 한 번 실행된다”는 전혀 다른 완료 조건이었습니다.

## 실제 MCP tool 결과는 JSON 문자열이 아니었다

기존 테스트 fixture는 일반 `@tool`처럼 문자열을 반환했습니다. 설치된 `langchain_mcp_adapters`는 MCP 도구를 `content_and_artifact` 형식으로 만들었고, bare args로 호출할 때 결과는 다음 모양이었습니다.

```json
[{"type":"text","text":"{\"status\":\"OK\",\"actionId\":66}"}]
```

코드는 list 전체를 다시 JSON 문자열로 저장했습니다. action 추출기가 한 번 `json.loads`한 결과는 dict가 아니라 list여서 `actionId`를 영원히 찾지 못했습니다.

경계 함수 `tool_result_to_text()`를 한 곳에 두고 content block을 먼저 평탄화했습니다. 회귀 fixture도 일반 mock tool이 아니라 실제 `content_and_artifact` `StructuredTool`을 사용했습니다. `actionId=0` 같은 no-op sentinel에는 카드를 띄우지 않고, 양수 id만 승인 대상으로 인정했습니다.

## `update_state`가 대기 중인 interrupt를 없앴다

승인 카드가 나타난 뒤 `/agent/resume`은 200을 반환했지만 아무 메시지도 없었고 backend action은 PENDING으로 만료됐습니다.

resume 직전 최신 MCP session을 넣으려고 호출한 `aupdate_state()`가 원인이었습니다. 이 연산은 현재 checkpoint를 단순 수정하는 것이 아니라 `source="fork"`인 새 checkpoint를 만들고 다음 task를 다시 계산했습니다. 자식 subgraph의 `check_approval`에 걸려 있던 pending interrupt가 새 fork에서 사라져 `Command(resume=...)`가 재개할 대상을 잃었습니다.

LangGraph가 제공하는 원자 경계는 따로 있었습니다.

```python
Command(resume=decision, update={"mcp_session_id": current_session})
```

resume과 update를 한 Command에 넣으면 pending task를 보존한 채 현재 checkpoint에 상태가 반영됩니다. 단일 노드 toy graph가 아니라 실제 parent graph, embedded subgraph와 checkpointer로 구 코드를 재현하고 새 command builder를 검증했습니다.

## 승인 대상은 현재 사용자 턴 안에서만 찾는다

후속 감사에서는 `_extract_action_id`가 최근 메시지 10개를 사용자 턴과 무관하게 역탐색하고 있었습니다. 사용자가 예약을 거절해도 backend PENDING action을 취소하지 않으면, 이후 단순 좌석 조회 턴이 과거 action id를 다시 발견할 수 있었습니다. 그 가짜 카드에서 승인하면 사용자가 거절했던 예약이 실행될 수 있었습니다.

탐색은 역순으로 진행하되 최신 `HumanMessage`에서 멈춥니다. 현재 턴에 생성된 action만 승인 대상으로 삼고, deny는 backend action 취소까지 전달합니다. inline gate와 router gate가 서로 다른 탐색 규칙을 갖지 않도록 공통 함수를 사용했습니다.

## 모델이 아니라 상태머신이 보장하는 것

prompt에는 도구 순서와 승인 정책을 설명하지만, 다음 조건은 코드가 강제합니다.

- `prepare`와 `confirm`을 같은 model turn에 실행하지 않습니다.
- 양수 action id 하나가 현재 사용자 턴에 있어야 합니다.
- MCP 결과가 block, string 또는 ToolMessage여도 같은 정규화 seam을 통과합니다.
- 승인·거절은 pending checkpoint의 정확한 interrupt를 재개합니다.
- confirm 뒤 “접수됨”과 worker의 최종 성공을 구분합니다.

[ssuAgent PR #39](https://github.com/ghdtjdwn/ssuAgent/pull/39), [#40](https://github.com/ghdtjdwn/ssuAgent/pull/40), [#44](https://github.com/ghdtjdwn/ssuAgent/pull/44)는 실제 adapter shape, 실제 graph/checkpointer와 현재 턴 경계를 회귀로 남겼습니다. 운영 E2E는 recommend, prepare, interrupt, 사용자 승인, `confirm_action`, 비동기 worker 성공과 audit terminal까지 확인했습니다.

카드가 보인다는 사실은 HITL의 절반입니다. 승인 이후 정확한 checkpoint와 action이 연결되고, 거절한 action이 다시 살아나지 않아야 사람의 통제가 실제 실행 경계가 됩니다.
