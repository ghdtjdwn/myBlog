---
title: "Doki Doki Data Structures"
summary: "An interactive visual novel for learning data structures where AI grades answers and produces bounded reactions while a deterministic engine owns every state transition."
status: prototype
statusNote: "The stack-learning route and deterministic engine demo are complete, while the queue and tree expansions, real AI grading calibration, and public deployment are still in progress."
activity: team
visibility: private
role: "Designed the UI, dialogue box, and art direction"
teamScope: "A team project whose overall results are not presented as individual contributions"
contributionEvidence: ["UI and art role confirmed in project records", "The team's 25 engine tests and Playwright playthrough are cited only as project validation"]
tags: ["AI Grading", "Vanilla JS", "Education", "Game Engine"]
infra: ["Static fallback", "Optional Node proxy"]
metrics:
  - { label: "Engine tests", value: "25" }
  - { label: "Scenario beats", value: "8" }
order: 4
featured: true
repositories: []
recordPlan: "The team repository retains the original validation records. Blog posts cover only my publishable contributions and the AI responsibility boundary. Team assets and private URLs are not disclosed."
recordLinks: []
---

## Core decision

If AI freely generates the questions and answer criteria in educational content, it can teach incorrect material. People author the questions and answer anchors, while AI grades the learner's response through a constrained verdict. The real provider also generates a one-line reaction and expression that must stay within the anchor, so this page does not claim that AI only grades.

Even when learners answer in free form, the model cannot change the game's rules. The provider contract requires `verdict` and optionally permits `reaction` and `expr`. The state engine uses only `verdict` for transitions and treats any optional fields as presentation. `engine.js` owns affection scores, problem order, retries, and endings, so missing or malformed model responses do not corrupt state transitions.

## Failure isolation

The deterministic engine owns affection, problem order, re-explanations, and endings. A static deployment without a server or AI key remains playable through a mock grader, and real AI grading is enabled only through a server proxy.

The static fallback is not merely a fake demonstration screen; it implements the same contract as the real grader. API keys never enter the browser, and OpenAI or Claude grading is selected only when the server proxy is available. Human-authored content and a complete playthrough therefore remain available even if the external AI fails.

## Implementation and validation

The publishable records include 25 engine tests, one complete pass through the 8 beats in `stack.json`, re-explanation and retry after an incorrect answer, affection and ending invariants, and a Playwright playthrough. These results verify that the game engine can be completed; they do not measure the educational effectiveness of the full content.

## Current state

The stack data-structure route and original UI and art demo are complete. The queue and tree routes, deeper cameo content, real-grader edge-case calibration, and public deployment are still in progress. The current public evidence confirms my UI, dialogue-box, and art-direction role. I do not present the story, anchors, engine, or server implementation as my individual work until ownership is verified. The overall product therefore remains labeled as a prototype rather than complete.

## Contribution boundary

This is a team project. The blog describes only verified individual responsibilities and design work rather than presenting the team's entire output as a solo implementation.

The repository is private, and publication rights for historical image assets still need to be resolved, so no screenshots are currently used. The project has not measured learning outcomes or user metrics, and I do not claim them.
