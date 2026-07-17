---
title: "Why approving the card did not execute the reservation"
description: "Separating MCP content blocks, LangGraph checkpoint forks, and stale actions to make the human-in-the-loop flow verifiable beyond the UI."
publishedAt: 2026-07-17
category: ai-systems
activity: personal-project
tags: ["LangGraph", "HITL", "Checkpoint", "MCP"]
project: ssu-platform
role: "Designed, implemented, and E2E-tested MCP result normalization, interrupt and resume, and turn-scoped approvals in ssuAgent"
evidence:
  - "ssuAgent ADR-0016, ADR-0017, ADR-0019 and PRs #39, #40, and #44"
  - "Incident records for the missing card, silent resume, and stale-action replay"
validation:
  - "Regressions using a real content_and_artifact StructuredTool and the real supervisor graph and checkpointer"
  - "Production prepare, interrupt, approve, confirm_action, and worker-success E2E"
  - "Combinations proving an action id before the current user turn cannot reopen the approval gate"
limitations:
  - "The real school write was one controlled reservation during validation, not a general load result"
  - "Provider or LangGraph upgrades require the event and message-shape contracts to be checked again"
  - "Uncertainty after an upstream write but before internal terminal persistence remains a separate recovery boundary"
featured: true
draft: false
---

## HITL does not end when a card renders

The library reservation flow interrupts LangGraph when a `prepare` result contains an action id. The user approves a card, and the graph resumes into `confirm_action`. Three defects had hidden one another:

1. The backend created a pending action, but no approval card appeared.
2. After the card was fixed, the resume endpoint returned 200 without executing confirmation.
3. After resume worked, an audit found that a previously rejected action could reappear in a later user turn.

“An interrupt happened” and “the exact action approved by the user executes once” are different completion criteria.

## The real MCP result was not a JSON string

Tests used an ordinary tool fixture returning a string. The installed `langchain_mcp_adapters` created `content_and_artifact` tools, and a bare-argument invocation returned:

```json
[{"type":"text","text":"{\"status\":\"OK\",\"actionId\":66}"}]
```

The application serialized that list again. One `json.loads` therefore produced a list rather than the dict expected by the action extractor, making the approval branch unreachable.

A single boundary function, `tool_result_to_text()`, now flattens content blocks before storage or parsing. The regression uses an actual `content_and_artifact` `StructuredTool`, not a string-shaped echo of the assumption. An `actionId=0` no-op sentinel also remains a message rather than becoming a false approval card.

## `update_state` removed the pending interrupt

Once the card rendered, `/agent/resume` returned 200 with no subsequent message. The backend action remained pending until expiry.

The endpoint called `aupdate_state()` immediately before resume to inject the latest MCP session. That operation created a new checkpoint with `source="fork"` and recomputed its next tasks. The pending interrupt inside the embedded `check_approval` subgraph disappeared, leaving `Command(resume=...)` with nothing to resume.

LangGraph provides an atomic boundary for this case:

```python
Command(resume=decision, update={"mcp_session_id": current_session})
```

Combining resume and update preserves the pending task while applying current state. The regression uses the actual parent graph, embedded subgraph, and checkpointer; a single-node toy graph would not reproduce the fork that caused production silence.

## Search for approval state only within the current user turn

A later audit found `_extract_action_id` scanning the last ten messages without turn boundaries. Rejecting a reservation did not cancel its backend pending action. A later read-only request could rediscover the old id and show another card; approving that card could execute the reservation the user had rejected.

The reverse scan now stops at the newest `HumanMessage`. Only actions produced in the current user turn can open the gate, and denial propagates cancellation to the backend. Inline and router gates share the same extraction function rather than implementing subtly different approval rules.

## Guarantees owned by the state machine

Prompts describe tool order and consent, but code enforces:

- `prepare` and `confirm` cannot execute in the same model turn;
- exactly one positive action id must belong to the current user turn;
- block, string, and ToolMessage results cross the same normalization seam;
- approval and denial resume the precise pending checkpoint;
- an accepted asynchronous request is not worded as a completed reservation.

[ssuAgent PR #39](https://github.com/ghdtjdwn/ssuAgent/pull/39), [#40](https://github.com/ghdtjdwn/ssuAgent/pull/40), and [#44](https://github.com/ghdtjdwn/ssuAgent/pull/44) preserve regressions for the real adapter shape, graph topology, checkpointer, and turn scope. The production E2E covered recommendation, preparation, interrupt, user approval, `confirm_action`, asynchronous worker success, and the terminal audit state.

A visible card is only half of HITL. The approved action must remain attached to the correct checkpoint, and a rejected action must not be allowed to return.
