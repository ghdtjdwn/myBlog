---
title: "Travel Refund Policy Navigator"
summary: "A Codex plugin that structures natural-language cancellation policies while leaving refund calculations and uncertainty blocking to deterministic code."
status: complete
statusNote: "The deliverable, including golden and adversarial tests, is complete. Unsupported policy conditions fail closed for manual review instead of producing a guessed amount."
activity: other
visibility: private
role: "Independent design, implementation, and validation"
contributionEvidence: ["10 golden tests", "Tests for quotation existence, interval gaps, and scope manipulation"]
tags: ["Rule Parsing", "Deterministic Calculation", "Consumer Policy"]
infra: ["Python standard library"]
metrics:
  - { label: "Golden tests", value: "10 / 10" }
order: 7
featured: false
repositories: []
recordPlan: "Keep the original policy-parsing and calculation validation in the deliverable, and selectively document design decisions such as fail-closed calculation and defenses against scope escalation on the blog."
recordLinks: []
---

## Problem

Travel cancellation policies often mix date ranges, peak-season conditions, business-day rules, and references to external terms in a single paragraph. If an LLM immediately calculates a plausible-looking refund, it can present a missing interval or incorrect basis as fact. This tool separates the work of structuring natural language from the work of calculating money.

## Code calculates the money

The LLM converts policy text into intervals and conditions, but code calculates dates, fees, and refund amounts. If the policy contains a gap or external reference, the system does not produce a definitive amount and instead ends in a manual-review state.

AI-generated rules JSON must first pass checks for verbatim source quotations, continuity across date ranges, applicable scope, and blocking conditions. Python standard-library code then compares the cancellation time with the validated intervals to calculate the fee and refund. Unsupported concepts such as peak seasons or business days are never silently replaced with ordinary weekday logic.

## Preventing unsupported comparisons

Comparison with Korea Fair Trade Commission standards runs only when the source explicitly supports classifying the product as an overseas package tour. The classification and its exception conditions also require source quotations.

Adversarial inputs test attempts to expand a product policy into a Fair Trade Commission comparison without evidence, gaps between intervals, and missing quotations for non-refundable clauses. The recorded validation passed all 10 golden tests and cross-checked 14 source quotations.

## Limitations and next steps

The standards comparison is currently limited to overseas package tours. Business-day calendars, cutoff times and time zones, and compound peak-season rules are unsupported; the system returns no definitive amount for those inputs. Applying it to a real product would also require preserving evidence for the policy version and effective date.
