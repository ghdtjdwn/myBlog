---
title: "Why an LLM does not control progression in my learning game"
description: "The model classifies free-text answers into four verdicts; authored anchors and a deterministic engine own teaching content, retries, affection, and endings."
publishedAt: 2026-07-17
category: ai-systems
activity: competition
tags: ["LLM", "Game Engine", "Data Structures", "Guardrails"]
project: ddsc-learning-game
role: "Individually designed and implemented the Stack learning route and anchors, deterministic game engine, grader contract, and UI integration"
evidence:
  - "The authored dongki-stack source and the problem and answer anchors encoded in scenario/stack.json"
  - "Engine invariant tests, mock and provider contracts, and the full-route Playwright record"
validation:
  - "23 Node tests covering affection, bands, reteaching, endings, call count, and the real Stack route"
  - "A Playwright playthrough from title to demo ending with the mock provider"
limitations:
  - "The static deployment uses a browser mock and does not serve a real-provider grading backend"
  - "Real-provider grading quality and learning outcomes have not been evaluated"
  - "Stack is the completed route; Queue and Tree are not implemented"
featured: true
draft: false
---

## Retrieval practice, not generated dialogue, is the core interaction

DDSC is a contest demo that teaches data structures through a visual-novel flow. Instead of choosing an answer, the learner explains a Stack concept in free text. AI compares the response with an authored answer anchor and returns one of four classifications:

```text
wrong | partial | correct | critical
```

Questions, answers, explanations, and the reaction script are authored. The LLM does not invent the next lesson. The product centers on recalling and explaining a concept rather than receiving plausible generated dialogue.

## Model output is bounded input, not a command

Every server-side grader provider implements the same `{ verdict }` contract. The prompt receives only the current question and its anchor. Values outside the enum and malformed responses are normalized to a safe verdict. Provider keys remain in server configuration and are never exposed through browser configuration.

Each free-text submission calls the grader once at one integration point. This prevents duplicated UI events from applying affection twice and keeps provider changes outside the engine. With no key, a keyword-based mock implements the same contract.

The verdict still cannot mutate game state directly:

```text
authored scenario + current snapshot + validated verdict
                 -> deterministic transition
                 -> next snapshot
```

`engine.js` owns affection deltas, clamping to 0–100, character-specific gauges, band changes, reteaching after errors, problem order, and ending conditions. A slow or incorrect model cannot change the state schema or progression rules.

## A snapshot boundary separates view from game rules

The application does not read affection or problem index back from the DOM. The engine produces a snapshot, and the view renders it. Missing character art falls back to an expression box, and missing backgrounds fall back to gradients, so asset availability cannot soft-lock the learning path.

A static GitHub Pages-style demo has no server and therefore uses the browser mock. Real OpenAI or Claude grading requires the separate Node `/api/turn` backend. Documentation distinguishes a playable static demo from a deployed AI grader.

## Test invariants and the real story path

Twenty-three Node tests cover:

- affection never leaves its allowed range;
- one submission causes one grader call;
- a wrong answer enters reteaching and retry without soft-lock;
- character gauges and bands follow authored verdict deltas;
- all eight beats from the real `stack.json` reach the demo ending;
- the CC ending appears only under its authored condition.

Playwright starts a mock server and drives the title, New Game, Stack route, free-text submissions, and ending screen.

These checks establish deterministic engine and UI behavior. They do not establish real-provider pedagogical accuracy or improved learning outcomes. Keeping the model's role small preserves game and content integrity while those questions remain unanswered.
