---
title: "Support Log Knowledge Base Bootstrap"
summary: "A Codex plugin that identifies recurring questions in support JSONL, masks PII, and produces evidence-backed FAQ drafts."
status: complete
statusNote: "The installable deliverable and offline validation are complete. The scope is intentionally limited to reviewable FAQ drafts rather than automatic publishing."
activity: other
visibility: private
role: "Independent design, implementation, and validation"
contributionEvidence: ["Golden and adversarial tests", "Post-masking PII rescan", "FAQ evidence validation"]
tags: ["LLM", "Clustering", "PII", "FAQ"]
infra: ["Offline Python pipeline"]
metrics:
  - { label: "Adversarial", value: "9 / 9" }
  - { label: "Validation", value: "FAIL 0" }
order: 6
featured: false
repositories: []
recordPlan: "Keep the submission's test results as the source of truth, and publish only reusable decisions such as privacy and evidence validation and precision-first clustering as blog posts."
recordLinks: []
---

## Problem

Support logs often contain the same questions and answers phrased in different ways. Reading every log manually to create an FAQ is slow, while relying only on automatic summarization can merge distinct policies or re-expose personal information and unsupported numbers. The goal is not to publish content automatically, but to produce safe FAQ candidates for human review.

## Boundary design

The LLM merges semantically adjacent topics and drafts the answers. Deterministic code owns PII masking, checks that numbers and quotations exist in the source, and decides whether an item is eligible for publication.

After reading the JSONL input, the pipeline first masks patterns for phone numbers, email addresses, and identifiers. A deterministic micro-clustering stage groups only clearly similar inquiries. AI handles semantic merging among the small candidate groups and drafts the prose, while every final group and answer retains its supporting log IDs. Before publication, a validator verifies that each quotation and each `(number, unit)` pair actually appears in the evidence.

## Why precision comes first

Merging different policies into one FAQ creates incorrect support knowledge. The automatic clustering stage is therefore conservative and produces small candidate groups that a person can review.

On 35 synthetic logs, the pipeline produced 24 micro-clusters and six FAQ candidates, with a recorded pair precision of 0.82. Recall is lower at 0.21, but a reviewer can add a missed candidate, whereas a wrongly merged policy can give users incorrect guidance. That trade-off drove the design. All nine adversarial tests passed, and a rescan after PII masking found zero detections.

## Limitations and next steps

PII detection is currently pattern-based, so it cannot identify every freely written name or context-dependent piece of personal information. Support logs are never published automatically. Even if broader PII detection and policy-version separation are added, the human approval step will remain.
