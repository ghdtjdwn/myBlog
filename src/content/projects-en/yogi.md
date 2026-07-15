---
title: "Proactive Recommendations and Consensus Group Ordering"
summary: "A Yogiyo × Oracle hackathon proposal combining personal preference recommendations with group consensus ordering, designed to validate OCI availability before implementation if selected for the finals."
status: planned
statusNote: "The preliminary proposal has been submitted and the final-round result is pending. This remains a planning-stage project with no code or OCI operational results until selection."
activity: competition
visibility: private
role: "Independent product planning and preliminary submission"
contributionEvidence: ["Preliminary submission", "Day-1 validation gate for the finals"]
tags: ["Recommendation", "Group Decision", "OCI", "Product Design"]
infra: ["OCI Ampere planned", "ADB Vector planned"]
metrics:
  - { label: "Current stage", value: "Awaiting result" }
order: 5
featured: false
repositories: []
recordPlan: "Keep the preliminary proposal and finals Day-1 checklist as the source record. If selected, document only OCI availability, recommendation experiments, and operational results that were actually verified."
recordLinks: []
---

## Problem

Food delivery does not end with individual recommendations. When several people order together, the system must account for allergies, budgets, preferences, and payment-splitting rules at the same time. The proposal combines proactive recommendations that reflect individual tastes with a consensus-ordering flow for a group of seven.

## Design principles

The implementation scope will be decided only after verifying the actual availability of OCI GenAI models, their regions, and ADB Vector capabilities on the first day. Rather than adopting OKE before implementation, the proposal first considers an Ampere VM with Docker Compose to match the scope of a short demo.

In the planned architecture, an offline batch prepares recommendation candidates, while the online path applies the user's current context and group constraints. An LLM may explain candidates and assist the conversation, but deterministic rules own allergy constraints, budget overruns, settlement, and final order state.

If selected, Day 1 begins by verifying OCI GenAI model and region availability, the ADB Vector version, and SDK behavior. If those checks fail, the scope will fall back to an alternative model or simpler retrieval. To avoid unnecessary infrastructure complexity during a short competition, an Ampere VM with Docker Compose is the first option under review instead of OKE.

## Current status

The preliminary submission and finals kickoff notes are prepared, but there is no service scaffold, user experiment, or OCI deployment yet. Values such as acceptance rate and satisfaction are target metrics, not achieved outcomes. The status will change to implementation only after selection and the Day-1 checks pass.

## Publication policy

This is not yet an implemented service. The blog will cover only infrastructure and data that are actually validated after selection for the finals.

Even if the proposal is not selected, a retrospective can still explain why the stack was not fixed before the competition and how validation gates would have controlled scope. Private materials provided by a team or company will not be published.
