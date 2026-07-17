---
title: "A disclosure brief that is not allowed to guess one digit"
description: "Explaining rights issues and convertible bonds while exact-matching every number to source text and rejecting investment-language overreach."
publishedAt: 2026-07-17
category: ai-systems
activity: other
tags: ["LLM", "Finance", "Guardrails", "Evidence"]
project: axwar-disclosure
role: "Individually designed, implemented, and tested the DART disclosure schema, numeric evidence validator, and language guardrails"
evidence:
  - "Private rights-issue and convertible-bond fixtures with numeric source mappings"
  - "Adversarial tests for altered numbers, unsupported rights, and investment recommendations"
validation:
  - "Exact source matches for numbers used in answers and required-disclaimer checks"
  - "8/8 adversarial cases with numeric, evidence, or language mutations were blocked"
limitations:
  - "Only rights issues and convertible bonds are supported, and detailed DART filing retrieval is incomplete"
  - "String existence alone cannot fully establish that the number was selected from the correct context"
featured: true
draft: false
---

## A simpler explanation must not become more confident than its source

Regulatory disclosures are difficult for a new investor to read, yet one incorrect digit can change the described shareholder impact. A generic “explain this simply” prompt may round an issue price or blend a share count with a number from another table.

This plugin structures rights-issue and convertible-bond filings but does not return generated prose directly.

```text
source filing
 -> document-specific field extraction
 -> LLM explanation draft
 -> number, evidence, and language validators
 -> accepted brief or blocking failure
```

Every numeric field retains a source quotation. If the validator cannot find the exact representation in the source, approximate or partial matching does not pass.

## Separate exact matching from semantic field selection

`1,000`, `1000`, and `one thousand` are equivalent to a reader but weaken traceability when a model rewrites them. Core numbers preserve the source representation and unit.

Document-specific checks then relate fields:

- Rights issue: new shares, price, schedule, allocation method, and their conditional shareholder effects.
- Convertible bond: issue amount, conversion price, conversion window, and conditions for potential dilution.

Existence is not full semantic correctness. The same number can occur in several tables, so section and field mappings are retained separately. Complex contextual misselection remains possible and is stated as a limitation.

## Investment decisions are outside the feature boundary

The validator rejects language that asserts a purchase decision, guaranteed upside, or certain market benefit. Every output requires a disclaimer that the brief is educational and does not replace the original filing or professional judgment.

Missing facts are not filled with generic knowledge. If a conversion-price adjustment is absent, the output says it is unconfirmed. Shareholder effects remain conditional rather than becoming a recommendation.

## Attack the validator, not only the prompt

Normal fixtures require every core number to exact-match source text and every output to contain the disclaimer. Eight adversarial cases—one-digit changes, unit substitutions, invented shareholder rights, certain investment language, and removed disclaimers—were all rejected.

The real DART mode currently performs listing lookup, but reliable detailed-filing retrieval is not complete. Inputs therefore rely on provided source text, and only two disclosure types are supported.

An 8/8 fixture result does not prove complete financial accuracy. It demonstrates that numeric grounding, document semantics, and allowed language are independent rejection boundaries after generation.
