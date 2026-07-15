---
title: "UNITHON Voice Kiosk Macro"
summary: "In a team project connecting voice orders to kiosk automation, I owned the launcher, configuration, packaging, and macro integration scope."
status: complete
statusNote: "The 2024 hackathon client is complete and is not an operating service. The public repository is maintained as a reviewable archive with safe defaults, corrected runtime paths, documentation, and CI."
activity: competition
visibility: public
role: "macro_pkg launcher, configuration, packaging, and macro integration"
teamScope: "Backend and Frontend implementation are owned by teammates"
contributionEvidence: ["21 macro_pkg files in the original user commit", "Launcher-path, order-safety, public-documentation, and CI renovation"]
tags: ["Python", "WebSocket", "VAD", "UI Automation"]
infra: ["Local Windows runtime", "HTTP/WebSocket contracts"]
metrics:
  - { label: "Safety mode", value: "Dry-run default" }
order: 10
featured: false
repositories:
  - { label: "Macro", url: "https://github.com/UNITHON24/Macro" }
recordPlan: "The Macro repository's code, ADR, and work log remain the source evidence for the voice, order, UI-automation, and safety boundaries. The team's Backend and Frontend implementation is excluded from my individual record."
recordLinks:
  - { label: "Macro architecture and limitations", url: "https://github.com/UNITHON24/Macro/blob/main/README.md" }
  - { label: "Safe client boundary", url: "https://github.com/UNITHON24/Macro/blob/main/docs/ARCHITECTURE.md" }
  - { label: "Macro work log", url: "https://github.com/UNITHON24/Macro/blob/main/WORKLOG.md" }
---

## Problem and role

This hackathon project lets a user who has difficulty operating a kiosk by touch place an order by voice, then carries the structured backend result through to actual kiosk UI actions. The direct contribution visible in the original commit is the launcher, configuration tools, packaging, and integration with the existing `kioskMacro` under `macro_pkg/`. The later public renovation corrected that path's launcher and safety boundary and added documentation and CI. I do not claim the earlier kiosk implementation or the Backend and Frontend as my individual work.

## Execution flow

The client sends microphone PCM over WebSocket and receives structured order items from the backend over HTTP. It looks up each item's category, page, and coordinates in the menu index, then clicks through the kiosk to add it to the cart.

16 kHz PCM recording and VAD distinguish speech from silence, while the WebSocket connection carries the audio stream. After receiving an order result, the client finds the category, page, and coordinates in the menu index, and pyautogui navigates the actual screen sequence. EasyOCR assists with initial menu-position setup.

## Safe testing

Dry-run is the default, so the client performs no real clicks until it is explicitly disabled. Before the first click, it validates the complete order's menu names and quantities; any unknown item or default-limit violation rejects the full payload. Orders execute one at a time through the HTTP order hub, preventing a WebSocket event from racing the same order through a second path.

Dry-run records only the selected menu and intended coordinates and does not move the pointer. Live mode stops after adding validated items to the cart; an operator verifies quantities, price, and current UI state before completing checkout manually. Activating the pointer-corner failsafe blocks the remaining items and all later orders until restart. Standard-library tests verify configuration evaluation, launcher paths, menu indexing, whole-payload validation, order limits, overlapping-order rejection, emergency stop, and the manual-checkout boundary; GitHub Actions runs the same suite and syntax compilation. Microphone, OCR, and live pointer integration remain an explicitly manual desktop validation boundary.

## Limitations

Coordinate-based automation is vulnerable to changes in resolution and UI layout. A separate post will compare this limitation with OCR-assisted initial setup and an accessibility-API approach.

The client also depends on Windows desktop permissions and a fixed screen structure. In a real product, a kiosk accessibility API or internal command contract would be more reliable than coordinate correction. This code is a 2024 hackathon deliverable and is not presented as an operating service.
