---
title: "Doki Doki Data Structures"
summary: "An interactive visual novel for learning data structures in which AI only grades free-form answers against human-authored criteria."
status: prototype
statusNote: "The stack-learning route and deterministic engine demo are complete, while the queue and tree expansions, real AI grading calibration, and public deployment are still in progress."
activity: team
visibility: private
role: "Authored the story and answer anchors; designed the UI, dialogue box, and artwork"
teamScope: "A team project whose overall results are not presented as individual contributions"
contributionEvidence: ["Public deployment deferred", "Record of 23 engine tests", "Record of a complete Playwright playthrough"]
tags: ["AI Grading", "Vanilla JS", "Education", "Game Engine"]
infra: ["Static fallback", "Optional Node proxy"]
metrics:
  - { label: "Engine tests", value: "23" }
  - { label: "Scenario beats", value: "8" }
order: 4
featured: true
repositories: []
recordPlan: "The team repository retains the original validation records. Blog posts cover only my publishable contributions and the AI responsibility boundary. Team assets and private URLs are not disclosed."
recordLinks: []
---

## Core decision

If AI freely generates explanations and dialogue in educational content, it can teach incorrect material. The questions, answer keys, and dialogue are written by people, while AI only compares the learner's response with the answer anchor and returns a verdict.

Even when learners answer in free form, the model cannot change the game's rules. The grader returns only a constrained verdict contract, while `engine.js` owns affection scores, problem order, retries, and endings. Responsibilities are separated so that missing or malformed model responses do not corrupt state transitions.

## Failure isolation

The deterministic engine owns affection, problem order, re-explanations, and endings. A static deployment without a server or AI key remains playable through a mock grader, and real AI grading is enabled only through a server proxy.

The static fallback is not merely a fake demonstration screen; it implements the same contract as the real grader. API keys never enter the browser, and OpenAI or Claude grading is selected only when the server proxy is available. Human-authored content and a complete playthrough therefore remain available even if the external AI fails.

## Implementation and validation

The publishable records include 23 engine tests, one complete pass through the 8 beats in `stack.json`, re-explanation and retry after an incorrect answer, affection and ending invariants, and a Playwright playthrough. These results verify that the game engine can be completed; they do not measure the educational effectiveness of the full content.

## Current state

The stack data-structure route and original UI and art demo are complete. The queue and tree routes, deeper cameo content, real-grader edge-case calibration, and public deployment are still in progress. My role covers the story and answer anchors, UI and dialogue-box design, and artwork; I do not present the entire engine and server as my individual implementation. The overall product therefore remains labeled as a prototype rather than complete.

## Contribution boundary

This is a team project. The blog describes only verified individual responsibilities and design work rather than presenting the team's entire output as a solo implementation.

The repository is private, and publication rights for historical image assets still need to be resolved, so no screenshots are currently used. The project has not measured learning outcomes or user metrics, and I do not claim them.
