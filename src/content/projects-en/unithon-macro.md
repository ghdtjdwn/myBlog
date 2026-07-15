---
title: "UNITHON Voice Kiosk Macro"
summary: "In a team project connecting voice orders to kiosk automation, I owned the launcher, configuration, packaging, and macro integration scope."
status: complete
statusNote: "The hackathon Macro client implementation is complete, with no separate deployment or maintenance after the event."
activity: competition
visibility: public
role: "macro_pkg launcher, configuration, packaging, and macro integration"
teamScope: "Backend and Frontend implementation are owned by teammates"
contributionEvidence: ["21 macro_pkg files in the user's commit", "Launcher, configuration, packaging, and integration with the existing kioskMacro"]
tags: ["Python", "WebSocket", "VAD", "UI Automation"]
infra: ["Local Windows runtime", "HTTP/WebSocket contracts"]
metrics:
  - { label: "Owned scope", value: "macro_pkg 21 files" }
order: 10
featured: false
repositories:
  - { label: "Macro", url: "https://github.com/UNITHON24/Macro" }
recordPlan: "The Macro repository's code and commit remain the source evidence. A competition retrospective will explain the boundaries between voice, orders, and UI automation and the dry-run decision. The team's Backend and Frontend implementation is excluded from my individual record."
recordLinks:
  - { label: "Macro commit history", url: "https://github.com/UNITHON24/Macro/commits/main" }
---

## Problem and role

This hackathon project lets a user who has difficulty operating a kiosk by touch place an order by voice, then carries the structured backend result through to actual kiosk UI actions. The direct contribution visible in my commit is the launcher, configuration tools, packaging, and integration with the existing `kioskMacro` under `macro_pkg/`. I do not claim the earlier kiosk implementation or the Backend and Frontend as my individual work.

## Execution flow

The client sends microphone PCM over WebSocket and receives structured order items from the backend over HTTP. It looks up each item's category, page, and coordinates in the menu index, then clicks through the kiosk to add it to the cart.

16 kHz PCM recording and VAD distinguish speech from silence, while the WebSocket connection carries the audio stream. After receiving an order result, the client finds the category, page, and coordinates in the menu index, and pyautogui navigates the actual screen sequence. EasyOCR assists with initial menu-position setup.

## Safe testing

With `KIOSK_DRY_RUN=1`, the client does not perform real clicks. Microphone state and silence timeout are handled separately during audio processing, and navigation state is reset after each order.

Dry-run mode records only the selected menu item and intended coordinates, preventing unintended clicks in a development environment. It distinguishes microphone-ready, recording, silence-timeout, and request-complete states, then resets page state when the order finishes. There is no verified record of the latest automated test run, so this page does not claim a passing test count.

## Limitations

Coordinate-based automation is vulnerable to changes in resolution and UI layout. A separate post will compare this limitation with OCR-assisted initial setup and an accessibility-API approach.

The client also depends on Windows desktop permissions and a fixed screen structure. In a real product, a kiosk accessibility API or internal command contract would be more reliable than coordinate correction. This code is a 2025 hackathon deliverable and is not presented as an operating service.
