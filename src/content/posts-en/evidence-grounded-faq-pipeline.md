---
title: "Reducing 35 support records to six FAQ candidates without auto-publishing"
description: "A precision-first FAQ pipeline where deterministic code owns PII and evidence checks while an LLM performs bounded semantic merging and drafting."
publishedAt: 2026-07-17
category: ai-systems
activity: other
tags: ["LLM", "Clustering", "PII", "Guardrails"]
project: axwar-kb
role: "Individually designed, implemented, and tested the clustering, PII masking, evidence validator, and FAQ-drafting plugin"
evidence:
  - "A private 35-record fixture, clustering labels, and FAQ-to-source mappings"
  - "PII rescans, numeric and quotation validators, and adversarial results"
validation:
  - "Produced 24 micro-clusters and six reviewable FAQ candidates from 35 records"
  - "Pair precision 0.82, recall 0.21, four PII instances masked with zero rediscoveries, and 9/9 adversarial cases"
limitations:
  - "Pattern-based PII detection cannot find every free-form name or contextual identifier"
  - "The design deliberately accepts low recall and never publishes output automatically"
featured: true
draft: false
---

## The most expensive FAQ failure is a false merge

Support logs repeat the same question in different language. Asking an LLM to summarize the full corpus can produce FAQs quickly, but it can also merge distinct refund or delivery policies and reproduce phone numbers or order identifiers.

The product generates review candidates, not published knowledge. I therefore optimized for precision over the number of merged records.

```text
JSONL
 -> deterministic PII masking
 -> conservative micro-clustering
 -> LLM semantic merge and draft
 -> evidence validator
 -> human-reviewable FAQ candidates
```

The LLM has two bounded responsibilities: identify semantic duplication among small candidate clusters and draft readable questions and answers. It does not own the safety or publication decision.

## Keep privacy and factuality outside the probabilistic model

PII with recognizable structure—phone numbers, emails, order IDs, and member identifiers—is masked deterministically before any model call. Generated output is scanned again for the original patterns.

Each FAQ retains the IDs of the support records that ground it. A validator checks that every quotation and `(number, unit)` pair in an answer actually exists in those sources. A small difference such as “three days” or “10%” can change policy meaning, so fluent prose is not sufficient evidence.

A cluster with missing or conflicting evidence remains failed instead of being smoothed into a confident answer. The model cannot hide uncertainty through writing quality.

## Why accept recall of 0.21?

On a 35-record fixture, deterministic processing produced 24 micro-clusters and the full pipeline produced six candidates. Against the authored labels, pair precision was 0.82 and recall was 0.21.

That recall is intentionally modest. A reviewer can merge a missed duplicate later; a false merge can deliver the wrong policy to a customer. The operational contract is:

- automate only high-confidence neighbors;
- expose ambiguous candidates separately;
- reject sentences without source mappings;
- reserve publication authority for a human.

## Adversarial cases matter more than happy examples

All four fixture PII instances were masked, and a post-generation rescan found zero. Nine adversarial cases—unsupported numbers, nonexistent quotations, forced policy merges, and malformed JSONL—each produced the intended fail-closed result.

These results do not establish privacy for every real support corpus. Pattern matching can miss free-form names or information identifiable only in context. Even with a broader entity detector, source access controls and human approval remain necessary.

The reusable boundary is to use an LLM for semantic compression while deterministic code owns what may leave the system and what may be accepted as fact.
