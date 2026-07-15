---
title: "Turning coordinate clicks into verifiable UI state transitions"
description: "A design for controlling source-less Windows kiosks through UIA, OCR, verified postconditions, and a hard stop before payment input."
publishedAt: 2026-07-15
category: engineering
activity: competition
tags: ["Windows UIA", "OCR", "State Machine", "Safety"]
project: unithon-macro
role: "Owned the macro_pkg launcher, voice client, automation integration, and current safety structure"
evidence:
  - "Macro ADR-0002 defines UIA-first observation, OCR fallback, and the payment terminal"
  - "The 2024 coordinate-drift troubleshooting record and current architecture"
  - "Ubuntu and Windows quality workflow, including main Actions run 29399898239"
validation:
  - "All 69 deterministic safety-core tests passed on Ubuntu and Windows"
  - "Two stable postcondition observations, cart deltas, and ambiguous-target denial"
  - "A 32-character minimum token on every order endpoint, single claim, and uncertain-state recovery"
limitations:
  - "No end-to-end validation of a real Windows UIA provider, Korean EasyOCR model, microphone, or physical pointer"
  - "Every new kiosk needs a reviewed profile and on-device acceptance; universal support is not claimed"
  - "No disabled-user study, accessibility certification, or legal-compliance assessment"
featured: true
draft: false
---

## A successful click API can still mean a failed order

Just before the UNITHON 2024 demonstration, a UI problem led the team to hard-code menu and button coordinates to finish the flow. The exact DPI, focus state, and UI change were not preserved, so I do not invent a post-hoc trigger.

The structural failure remained visible in code. The client assumed a 1080×1920 screen and a 2×8 card grid, then advanced its internal state when the pointer API returned without an exception. It did not observe whether the UI moved, an option dialog appeared, or the cart quantity changed.

For a third-party kiosk with no source, DOM, or dedicated API, success must mean what was observed after an action—not where the pointer was sent.

## UIA, OCR, and coordinates are not equal strategies

The current navigator uses a strict order.

1. Read `Name`, `ControlType`, `AutomationId`, enabled state, and bounding boxes from Windows UI Automation, preferring the `Invoke` pattern.
2. Only when UIA cannot find the current target, crop the fixed kiosk window and locate visible text through EasyOCR.
3. Only when both fail and an operator explicitly opts in, scale an approved reference point to the current window.

UIA consumes meaning exposed by the kiosk and is the strongest path. OCR covers visible text absent from the accessibility tree. Coordinates are a disabled-by-default last fallback. Every path must satisfy the same postcondition, so coordinates never become evidence of success.

The navigator refuses to act when two similarly scored candidates remain, a control is offscreen or disabled, or its center lies outside the target window. UIA roots and OCR captures are restricted to the native window handle observed at startup, preventing an overlay or unrelated foreground window from becoming the kiosk.

## Make every action a closed-loop transition

The profile stores semantic states, allowed transitions, aliases, and postconditions instead of treating absolute coordinates as identity.

```text
observe current state
  → resolve one semantic target
  → invoke UIA or act on the current bounding box
  → observe expected text and semantic signature
  → see the same next state twice
  → verify cart delta or terminal evidence
```

An animation hash changing, a menu name appearing only inside the cart, or a click that leaves quantity unchanged is not success. When a physical side effect cannot be established, the order becomes `uncertain`; it is not reduced to a routine failure or automatically retried.

## Validate the entire order before the first click

The client resolves every item's display name, temperature, size, and quantity before executing anything. Ambiguous candidates, conflicting options, or a profile that supports only part of the order reject the whole order before the first action. This reduces partial cart mutation discovered halfway through an order.

The order hub stores idempotency keys and state in SQLite and allows only one global claim.

```text
queued → claimed → succeeded
                 ↘ awaiting_handoff
                 ↘ uncertain
                 ↘ failed
```

After a live cart mutation, no next order may be claimed until customer handoff or operator-verified reset. Replaying a physical action after a lost ACK can duplicate quantity, so the system preserves uncertainty instead of claiming distributed exactly-once behavior.

Dry-run and live mode share the durable queue. “No physical clicks” is therefore not a reason to remove authentication: order creation, claim, ACK, and microphone-status endpoints all require a per-installation token of at least 32 characters.

## Payment-method selection is the terminal state

The transition graph ends at the payment-method screen. It does not choose card or cash, enter card details or a PIN, accept cash, or confirm payment. `KIOSK_ALLOW_PAYMENT_NAVIGATION` is also disabled by default, preventing even navigation to that screen without an approved profile and operator decision.

This is not an unfinished feature. Assisting with cart composition and taking over a person's financial decision have different responsibilities.

## What automated tests prove—and what remains

The [quality workflow](https://github.com/UNITHON24/Macro/blob/main/.github/workflows/quality.yml) runs 69 safety-core tests on Ubuntu and Windows. Without external devices, it replays semantic grounding, ambiguity denial, window-handle checks, stable postconditions, cart deltas, the payment terminal, authentication, idempotency, single claim, and `uncertain` recovery.

It does not validate a real Windows UIA provider, Korean OCR target-hit rate, 100/125/150% DPI, or microphone-to-pointer end-to-end behavior. A new kiosk still needs read-only diagnosis, profile review, dry-run, and non-production device acceptance. No disabled-user study or accessibility certification is claimed.

My contribution is scoped to the `macro_pkg` launcher, configuration, voice client, macro integration, and current safety structure. The team's speech backend, kiosk frontend, and initial `kioskMacro/` client are excluded from my individual contribution. The source decisions are in [ADR-0002](https://github.com/UNITHON24/Macro/blob/main/docs/adr/0002-black-box-semantic-automation.md), with the incident boundary in the [coordinate-drift record](https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2024-demo-coordinate-drift.md).
