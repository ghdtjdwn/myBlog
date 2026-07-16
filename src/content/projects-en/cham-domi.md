---
title: "Cham Domi"
summary: "A team project for finding eligible dormitories and compatible roommates, where I owned the entire frontend and the roommate backend domain."
status: prototype
statusNote: "The frontend and roommate-domain prototypes are complete, but authentication integration, deployment, and operational validation have not yet been completed."
activity: team
visibility: private
role: "Entire frontend and roommate-matching backend"
teamScope: "Authentication and dormitory eligibility evaluation are owned by teammates"
contributionEvidence: ["FE 7 commits", "BE 5 commits including merge", "3 PRs", "Shared role and API contract documents"]
tags: ["Next.js", "Spring Boot", "Stable Roommates", "Contract Testing"]
infra: ["H2/MySQL persistence", "Mock-to-real API adapter", "No deployment yet"]
metrics:
  - { label: "FE screens", value: "9+" }
  - { label: "Owned BE scope", value: "roommate" }
order: 10
featured: true
repositories: []
recordPlan: "The team repositories and shared role and API contract documents remain the sources of truth. Blog posts anonymize and cover only the FE and roommate scope I owned. Pre-deployment problems are not presented as production incidents."
recordLinks: []
---

## Problem to solve

Cham Domi is a team prototype connecting dormitory eligibility with roommate discovery based on compatible living habits. Users enter their circumstances and move through eligible dormitories, matching candidates, posts, and chat in one mobile flow.

## Boundaries for parallel development

All frontend data access sits behind an API adapter that can switch between mock and real backends. A shared API contract serves as the source of truth for data models, allowing each domain to connect independently.

The Next.js 16 frontend covers more than 9 screen flows, including login, profile input, matching, candidate details, chat, and dormitory discovery. Before the backend was ready, it used a mock adapter; the same call sites can switch to the real API adapter. This allowed screen development and domain implementation to proceed in parallel.

My backend scope covers the Spring Boot/JPA roommate domain, living-habit scoring, Stable Roommates, posts, and chat. Authentication and dormitory eligibility evaluation belong to teammates and are not presented as my implementation on this page.

## Matching validation

Parity tests keep the weighted living-habit score consistent between the frontend and backend. The Stable Roommates implementation was checked against a brute-force oracle on small inputs.

The FE and BE use matching 100/89-point cases for the same inputs, while tests also cover dealbreakers and the sum of the weights. Stable Roommates was compared with a small brute-force oracle over 400 random inputs each for `n=4` and `n=6`. Because the scoring rules are duplicated rather than shared through a common package, they could drift if the contract tests disappear.

## Current state and limitations

The team prototype implements the screens and core matching flow, but there is no real authentication integration, CI, public deployment, or user-operation record. H2 and MySQL dependencies are present, but there is no evidence of Docker Compose operation, so the previous description was removed. The next steps are team API integration, automated validation of the shared contract, and a deployed test environment.

## Role boundary

Authentication and dormitory eligibility evaluation are teammates' work. This page describes only the screens and roommate domain I directly owned.
