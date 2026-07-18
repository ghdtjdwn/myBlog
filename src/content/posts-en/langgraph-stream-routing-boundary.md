---
title: "Why I trust runnable tags instead of node names in a LangGraph SSE stream"
description: "A streaming and routing repair for real event metadata that differed from mocks, leaked tool preambles, and let stale turns influence new routes."
publishedAt: 2026-07-18
category: ai-systems
activity: personal-project
tags: ["LangGraph", "SSE", "Routing", "State Machine"]
project: ssu-platform
role: "Observed supervisor events and implemented narration suppression, turn-scoped cleanup, and conservative deterministic routing"
evidence:
  - "ssuAgent ADR-0012, 0018, and 0019 plus an event dump from the real compiled graph"
  - "Runtime metadata where both supervisor and sub-agent internal models appeared as langgraph_node=agent"
validation:
  - "A fake streaming LLM executed through the real compiled graph and astream_events(version=v2)"
  - "Regression coverage for mixed tool calls, stale markers, provider fallback, tool preambles, and short follow-ups"
limitations:
  - "The event contract is tied to the installed LangGraph and LangChain versions"
  - "Deterministic pre-routing is deliberately limited to observed, high-confidence library and LMS expressions"
  - "Buffering text until model completion reduces the perception of token-level streaming for final prose"
featured: true
draft: false
---

## Mocked node names did not match the nested runtime graph

The ssuAgent supervisor invokes a ReAct agent inside a parent LangGraph node. The top-level SSE iterator consumes `astream_events(version="v2")`, so events from the internal supervisor model and domain-agent models share one stream.

The first implementation buffered model text when `metadata.langgraph_node == "supervisor"`. That worked in fixtures, but the compiled graph labeled the supervisor's internal model `agent`; the library subgraph model was also `agent`. Routing narration such as “I handed this to the library agent” leaked to users and remained in the checkpoint, where the next agent could mistake it for a completed answer.

```text
supervisor model  node=agent  tags=[supervisor_llm]
transfer tool     node=tools  tags=[supervisor_llm]
library model     node=agent  tags=[]
```

## An explicit propagated tag became the execution boundary

I did not parse internal node names or UUID-bearing `checkpoint_ns` values. The supervisor ReAct runnable receives a `supervisor_llm` tag, and the SSE filter reads the publicly propagated event tags. The contract survived a later internal rename from `agent` to `model`.

Supervisor text is buffered. If a routing tool starts, that text was not a final answer and is discarded; if no tool starts, the direct supervisor answer is flushed. Domain agents need a related rule because a provider can put prose and a tool call in one message. A preamble such as “I will check the fifth floor” is dropped when a tool follows, while the final answer based on the tool result is retained.

## Conversation cleanup follows user turns, not node labels

An early sanitizer deleted every supervisor-named message in the checkpoint. Direct cafeteria answers carried the same name, so valid answers and their tool pairs disappeared. The next academic agent then saw an earlier question and the current question as two unanswered user messages.

I partition messages at `HumanMessage` boundaries and remove narration and route tool pairs only from a turn that actually contains a transfer call. Reverse searches for route markers and action IDs also stop at the newest `HumanMessage`. A fixed window of eight or ten messages is a storage count, not a semantic boundary.

## Deterministic routing stays narrow and explainable

Clearly stated library reservations and full LMS-download requests sometimes fell into generic answers because supervisor model selection varied. Instead of strengthening the prompt, I pre-route only high-confidence phrases. Conflicting domain signals return to the supervisor, and a short response continues a library flow only after a genuine `[Library Agent]` clarification. “Second floor” continues; an answer to another agent's “Which course?” does not get hijacked.

The [LangGraph streaming documentation](https://docs.langchain.com/oss/python/langgraph/streaming) shows that interrupt and stream metadata depend on mode and version. [ADR-0012](https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0012-supervisor-narration-suppression.md) therefore relies on a script that dumps events from the compiled graph, not an invented event fixture.

Prompts describe intent, but code must own which text reaches a user and which historical state can route a new turn. Explicit tags, tool events, and user-turn boundaries produced a state machine that remains testable when model providers or internal graph nodes change.
