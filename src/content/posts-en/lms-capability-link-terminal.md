---
title: "Why I stopped asking an LLM to repeat a download URL"
description: "A deterministic terminal formatter and safe-anchor boundary for an LMS ZIP capability link that disappeared before the final response."
publishedAt: 2026-07-18
category: ai-systems
activity: personal-project
tags: ["LLM Orchestration", "Capability URL", "SSE", "Security"]
project: ssu-platform
role: "Designed and verified LMS export routing, terminal responses in ssuAgent, and safe link rendering in ssuAI"
evidence:
  - "The real all-course export transcript and root-cause analysis in ssuAgent ADR-0022"
  - "The ssuMCP contract that immediately returns a job and a capability URL with a default 20-minute TTL"
validation:
  - "Graph and shared-loop tests checkpointing the confirm result without another model call"
  - "Rejection matrices for status, origin, path, and token plus assistant-only anchor security tests"
limitations:
  - "A real-account full export is write-like and is not executed in automated tests"
  - "If LMS collection itself exceeds the proxy budget, the flow can still terminate before confirmation"
  - "Anyone holding the capability URL can use it before expiry, so it must be redacted from logs and later model history"
featured: true
draft: false
---

## The ZIP path existed, but the user never received the link

In a production conversation, a user requested every lecture file from current courses. SSE showed LMS handoff, authentication, course lookup, export preparation, and confirmation, but no final link. A follow-up asking for the link did not resume the previous LMS task. Repeating the whole request eventually produced a URL, yet the frontend rendered it as plain text and required copying a long token.

ssuMCP does not wait for ZIP completion. Confirmation immediately returns a job and a capability URL with a default 20-minute TTL; the download page polls while the job is BUILDING. The missing link was therefore not a slow ZIP worker. It disappeared at the orchestration boundary that turned a tool result into a final answer.

## I removed the model turn after the URL

The shared ReAct loop invoked the model again after the confirm tool returned the URL. If this final synthesis did not finish near the 60-second SSE boundary, the intermediate ToolMessage was not checkpointed and the URL could not be recovered. A missing LMS tool classification also added unnecessary lookup and preparation turns.

An all-course request now uses the dedicated `export_all_lms_materials → confirm_lms_material_export` sequence. A successful confirmation is handled by a deterministic `terminal_tool_result_formatter`. It locally formats the file count, estimated size, and link, then checkpoints a final AIMessage immediately. The model has no opportunity to rewrite or omit the capability.

## A capability is a validation target, not prose

The formatter does not merely find a string beginning with `http`. It requires:

- an explicit `status: OK` envelope and object-shaped `data`;
- an HTTP(S) scheme and no userinfo;
- an origin exactly equal to the configured ssuMCP origin;
- the path `/api/lms/exports/{jobId}/download`;
- a non-empty `token` query parameter.

A different origin, `javascript:`, the wrong path, or an error envelope stays on the normal error path. After delivery, the terminal URL is redacted from later model history. The current tool result remains available to the local formatter, but the capability is not unnecessarily sent to a provider prompt or logs.

If a model emits export and confirmation in one tool-call batch, confirmation receives `INVALID_TOOL_SEQUENCE` and is not executed. It must run in a separate turn after the export result, preventing a race in which an action is confirmed before its preview exists.

## The renderer enforces the same allowlist

ssuAI activates only HTTP(S) Markdown and bare links from assistant messages. Only a trusted origin, export path, and token combination becomes a “Download lecture files” action. User messages and unsafe schemes remain inert; new tabs use `noopener noreferrer` and an accessible label instead of displaying the long token.

[ADR-0022](https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0022-deterministic-lms-export-download.md) records the transcript, alternatives, and test matrix. A real-account export remains a controlled operational check rather than an automated test.

An LLM is useful for language, but there is no benefit in asking it to reinterpret an already structured security capability. Validate important identifiers at the tool contract, checkpoint them deterministically, and activate only the same allowlisted shape in the UI. That carries the feature from “a link was generated” to “the user can safely use it.”
