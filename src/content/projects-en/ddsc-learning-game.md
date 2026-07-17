---
title: "DDSC: Data Structures Visual Novel"
summary: "AI classifies free-text answers into four verdicts while authored lessons and a deterministic engine own affection, retries, and endings."
status: complete
statusNote: "The Stack route and self-produced interface and art form a complete contest demo. A real AI grading deployment and learning-outcome evaluation are not complete."
activity: competition
visibility: private
role: "Individual product concept, learning scenario, engine, grader integration, UI implementation, and validation"
teamScope: "Individual contest entry"
contributionEvidence:
  - "An authored eight-beat Stack scenario with questions and answer anchors"
  - "23 Node tests for the deterministic engine and provider contract"
  - "A Playwright playthrough from title to demo ending"
screenshots: []
tags: ["JavaScript", "LLM Grader", "Game Engine", "Data Structures"]
infra: ["Static mock demo", "Optional Node grading server"]
metrics:
  - { label: "Engine tests", value: "23" }
  - { label: "Stack beats", value: "8" }
order: 10.5
featured: false
draft: false
repositories: []
recordPlan: "The private contest repository retains scenarios, tests, and progress documents. Public writing covers only the AI responsibility boundary and deterministic-engine validation."
recordLinks: []
---

## Problem to solve

Data-structure material often ends with explanation and multiple-choice checks. This project teaches Stack through a visual-novel flow and asks the learner to explain concepts in free text, combining retrieval practice and immediate feedback in one game mechanic.

## Responsibility boundary between AI and code

Authored scenarios are the authority for questions, answer anchors, explanations, and story dialogue. The AI grader compares a free-text response with the anchor and returns `wrong`, `partial`, `correct`, or `critical`. A deterministic engine calculates affection, bands, reteaching, problem order, and endings.

Provider keys remain server-side, while the static demo uses a browser mock implementing the same contract. A playable static page is not presented as a deployed real-AI backend.

## Implementation and validation

The completed Stack route has eight beats: five for Jisoo and three cameo beats. Self-produced character, background, and title assets are integrated, with fallback UI when an image is missing.

Twenty-three Node tests cover affection bounds, a single grader call per submission, reteaching, character gauges, bands, and ending invariants. They include a complete lap through the real `stack.json`, while Playwright drives a mock playthrough from title to ending.

## Limitations and next steps

Real-provider grading quality and learning outcomes have not been evaluated. Queue and Tree routes are not implemented. The publishable static demo uses only the mock grader; production AI would require a separate server deployment with secret and abuse controls.
