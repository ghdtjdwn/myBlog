---
title: "LangGraph SSE에서 node 이름 대신 runnable tag를 신뢰한 이유"
description: "mock과 달랐던 실제 event metadata, tool 전 narration 누출과 과거 턴 라우팅 오염을 streaming·message 경계에서 해결한 기록입니다."
publishedAt: 2026-07-18
category: ai-systems
activity: personal-project
tags: ["LangGraph", "SSE", "Routing", "State Machine"]
project: ssu-platform
role: "ssuAgent supervisor event 관측, narration 억제와 turn-scoped 결정적 routing 구현·회귀 검증"
evidence:
  - "ssuAgent ADR-0012·0018·0019와 실제 compiled graph event dump"
  - "supervisor와 sub-agent 내부 model이 모두 langgraph_node=agent로 나타난 event metadata"
validation:
  - "fake streaming LLM을 실제 compiled graph의 astream_events(version=v2)에 연결한 재현"
  - "혼합 tool call·과거 marker·provider fallback·tool preamble·짧은 후속 질문 회귀 테스트"
limitations:
  - "설치된 LangGraph·LangChain 버전의 event shape를 대상으로 한 계약"
  - "결정적 선라우팅은 관측된 도서관·LMS 고신뢰 표현에만 보수적으로 적용"
  - "텍스트를 model end까지 버퍼링하므로 최종 문장 토큰의 체감 streaming은 줄어듦"
featured: true
draft: false
---

## mock이 만든 node 이름은 실제 중첩 graph와 달랐다

ssuAgent의 supervisor는 부모 LangGraph node 안에서 다시 ReAct agent를 실행합니다. SSE는 최상위 `astream_events(version="v2")`를 순회하므로 내부 supervisor model과 domain agent model의 이벤트가 모두 한 스트림에 섞입니다.

기존 코드는 `metadata.langgraph_node == "supervisor"`인 model text를 보류했습니다. mock fixture에서는 맞았지만 실제 compiled graph에서 supervisor 내부 model node는 `agent`였고, library subgraph 내부 model도 똑같이 `agent`였습니다. “도서관 에이전트에게 전달했습니다” 같은 routing narration이 사용자에게 보이고, checkpoint에 남은 문장을 다음 agent가 이미 끝난 답변으로 오해했습니다.

```text
supervisor model  node=agent  tags=[supervisor_llm]
transfer tool     node=tools  tags=[supervisor_llm]
library model     node=agent  tags=[]
```

## 관측 가능한 명시 tag를 실행 경계로 삼았다

내부 node 이름이나 UUID가 섞인 `checkpoint_ns`를 파싱하지 않았습니다. supervisor ReAct runnable을 호출할 때 `supervisor_llm` tag를 붙이고, streaming filter는 event의 공개 tag 전파만 봅니다. 내부 agent 구현이 `agent`에서 `model`로 바뀌어도 의미가 유지됩니다.

supervisor text는 바로 보내지 않고 잠시 buffer합니다. routing tool이 시작되면 해당 문장은 최종 답변이 아니므로 버리고, 도구 없이 supervisor가 직접 답한 경우에만 flush합니다. sub-agent도 text와 tool call을 한 message에 함께 낼 수 있어 같은 원칙을 적용했습니다. “5층 현황을 확인하겠습니다” 뒤 tool이 시작되면 preamble은 버리고 tool 결과를 반영한 최종 문장만 전송합니다.

## 저장된 대화는 node가 아니라 사용자 턴으로 정리한다

초기 정리 코드는 checkpoint 전체에서 supervisor 이름의 메시지를 삭제했습니다. 그런데 supervisor가 직접 답한 학식 질문도 같은 이름이었습니다. 그 답과 tool pair까지 없어지자 다음 학사 agent는 이전 질문과 현재 질문 두 개가 연속된 것처럼 읽었습니다.

메시지를 `HumanMessage` 기준으로 턴에 나누고 transfer tool이 실제로 발생한 턴에서만 routing narration과 route tool pair를 제거했습니다. 현재 route marker와 action id를 찾는 역탐색도 최신 `HumanMessage`에서 멈춥니다. 고정된 최근 8개·10개 메시지는 대화 길이일 뿐 의미 경계가 아니었습니다.

## 결정적 routing은 좁고 설명 가능하게 유지했다

운영에서 명백한 도서관 예약과 LMS 전체 자료 요청이 supervisor 모델 선택에 따라 일반 답변으로 빠졌습니다. prompt 강화 대신 고신뢰 표현만 model 전에 분기합니다. 다른 강한 domain signal이 섞이면 supervisor로 돌리고, 짧은 후속 답은 직전 메시지가 실제 `[도서관 에이전트]` clarification일 때만 이어집니다. “2층”은 이어지지만 다른 agent의 “어느 과목인가요?” 답변을 도서관이 가로채지 않습니다.

[LangGraph streaming 문서](https://docs.langchain.com/oss/python/langgraph/streaming)는 interrupt와 stream metadata가 mode·version에 따라 달라짐을 보여줍니다. 그래서 [ADR-0012](https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0012-supervisor-narration-suppression.md)는 실제 graph에서 event dump를 생성하는 스크립트와 회귀를 근거로 둡니다.

LLM orchestration에서 prompt는 의도를 설명하지만, 사용자에게 어떤 문장이 보이고 어느 과거 상태가 다음 라우팅을 움직이는지는 코드 계약이어야 합니다. node 이름을 추측하는 대신 명시 tag, tool event와 사용자 턴을 경계로 삼으니 모델·내부 graph가 바뀌어도 검증 가능한 상태머신이 됐습니다.
