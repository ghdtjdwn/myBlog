---
title: "UNITHON Voice Kiosk Macro"
summary: "A Windows accessibility-retrofit prototype that turns a voice order into semantic actions on a third-party kiosk and stops at a verified payment-method screen without modifying the kiosk source."
status: complete
statusNote: "The 2024 hackathon client is complete with UIA-first grounding, OCR fallback, and a durable order boundary. It is not an operating service; physical Windows-kiosk and disabled-user acceptance remain unverified."
activity: competition
visibility: public
role: "Voice client, semantic UI automation, and safe order handoff"
teamScope: "Teammates own the original Backend and Frontend; my Backend change is limited to the authentication contract required by Macro"
contributionEvidence: ["20 macro_pkg files in the original user commit", "UIA-first grounding, OCR fallback, transitions, and postconditions", "SQLite order queue, authenticated integration, 69 safety-core tests, and cross-platform CI"]
tags: ["Python", "Windows UIA", "EasyOCR", "SQLite"]
infra: ["Local Windows runtime", "Authenticated HTTP/WebSocket contracts", "SQLite durable queue"]
metrics:
  - { label: "Safety", value: "Dry-run default" }
  - { label: "Validation", value: "69 tests · Linux/Windows CI" }
order: 3
featured: true
repositories:
  - { label: "Macro", url: "https://github.com/UNITHON24/Macro" }
recordPlan: "The Macro repository's code, ADRs, work log, and troubleshooting records remain the source evidence for the voice, order, and physical-UI boundaries. I do not include the team's complete Backend or Frontend implementation in my individual record."
recordLinks:
  - { label: "Architecture and safety boundaries", url: "https://github.com/UNITHON24/Macro/blob/main/docs/ARCHITECTURE.md" }
  - { label: "Semantic automation decision", url: "https://github.com/UNITHON24/Macro/blob/main/docs/adr/0002-black-box-semantic-automation.md" }
  - { label: "Live order boundary audit", url: "https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2026-live-order-boundary-audit.md" }
  - { label: "Macro work log", url: "https://github.com/UNITHON24/Macro/blob/main/WORKLOG.md" }
---

## Problem and role

A structured voice order still cannot operate a legacy kiosk that exposes no voice interface. Macro closes that gap as a separate Windows process, without replacing the kiosk hardware or modifying its frontend source.

Korean accessibility rules require kiosk operators to provide measures for equal access and, in defined cases, recognize software compatible with existing terminals as an alternative measure. Macro evaluates the technical feasibility of that software-retrofit path; it is not an accessibility certification or a guarantee of legal compliance. The [English repository README](https://github.com/UNITHON24/Macro/blob/main/README.en.md#problem) separates the legal scope and primary sources from the engineering claim.

My original contribution is evidenced by the launcher, configuration tools, packaging, voice client, and macro integration under `macro_pkg/`. The public completion added semantic grounding and execution, a durable order queue, safety boundaries, tests, and documentation. I do not claim the team's complete Backend, Frontend, or earlier `kioskMacro` implementation; my Backend change is limited to the authenticated header contract used by Macro.

## From demo coordinates to semantic automation

Immediately before the 2024 demo, a layout change forced the client to finish with hard-coded coordinates. I retained that failure as a [troubleshooting record](https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2024-demo-coordinate-drift.md). I also considered training YOLO on every menu and transition, but a text-heavy kiosk would require a per-screen dataset and model while still needing a separate model of hidden state.

The completed design re-reads the current screen. It binds every observation to one native window handle and first uses Windows UI Automation names, roles, and states. EasyOCR re-detects current text only when a canvas or legacy screen exposes an insufficient accessibility tree. Resolution-scaled coordinates are an explicit fallback only after both semantic providers fail.

## Execution and verification loop

The microphone client sends 16 kHz PCM speech segments selected by VAD over WebSocket. The Backend's `displayName`, temperature, size, and quantity enter a SQLite queue through a per-installation-token-authenticated HTTP contract. Idempotency keys and one global claim prevent duplicate orders and concurrent pointer execution.

A kiosk profile declares screen states and allowed transitions. Every action must complete `observe → resolve → act → stabilize twice → re-observe → verify the postcondition`. Equal candidates fail as ambiguous, and the client stops if it cannot prove both the screen transition and the semantic cart-quantity delta.

## Payment and customer-handoff boundary

Dry-run is the default, and the client validates every menu, option, and quantity before the first action. Only a separate opt-in allows navigation to a verified payment-method screen. It never selects card or cash and never submits a payment.

Any verified live cart mutation leaves the order in `awaiting_handoff`; an unverifiable result becomes `uncertain`. No later order can be claimed until an operator confirms customer handoff or cancellation and restores the kiosk. This keeps a successful message acknowledgement separate from the physical screen's state.

## Validation and limitations

Sixty-nine standard-library tests cover the nested controls reproduced from the team screen, UI grounding, transitions, semantic cart deltas, authentication, idempotency, recovery, and the payment boundary. The same safety core passes GitHub Actions on Ubuntu and Windows. The first Windows run exposed SQLite file-handle, console-encoding, and path-separator assumptions, which are preserved as a real [CI troubleshooting record](https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2026-windows-ci-portability.md).

These are deterministic safety-core checks. I have not completed end-to-end acceptance of UIA quality, DPI behavior, the OCR model, microphone, and physical pointer on a real Windows kiosk. Each new kiosk still needs a reviewed profile, and disabled-user usability testing, accessibility certification, and full legal compliance remain outside the verified scope.
