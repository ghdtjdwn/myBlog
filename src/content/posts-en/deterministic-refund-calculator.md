---
title: "Let the LLM read refund policy; let code calculate the money"
description: "Natural-language cancellation clauses become evidence-bound intervals, while a deterministic engine owns boundaries, fees, refunds, and blocking ambiguity."
publishedAt: 2026-07-17
category: ai-systems
activity: other
tags: ["LLM", "Rule Engine", "Validation", "Travel"]
project: axwar-refund
role: "Individually designed, implemented, and tested the policy parser contract, quotation and interval validators, and refund engine"
evidence:
  - "Private golden fixtures and mappings from refund rules to source quotations"
  - "Tests for interval coverage, boundary dates, ambiguity blocking, and amount calculation"
validation:
  - "10/10 golden cases and existence checks for 14 source quotations"
  - "Gaps, overlaps, missing dates, and unsupported policy constructs ended in a blocking exit"
limitations:
  - "Scope is overseas package travel; business-day calendars, time zones, and compound promotions are unsupported"
  - "Consumer-standard comparisons are informational, not legal interpretation or merchant approval"
featured: true
draft: false
---

## Language understanding and money should not share a trust boundary

Travel cancellation policies use phrases such as “until ten days before departure” or “same-day cancellation.” An LLM can structure that language, but allowing it to generate the final refund introduces variable numbers and invented completions.

I split interpretation from calculation:

```text
source policy
 -> LLM: candidate intervals, fees, and source quotations
 -> validator: quotation existence, coverage, and ambiguity
 -> deterministic engine: date boundary, fee, and refund
 -> result with evidence
```

Model output is an untrusted intermediate representation. Every rule needs a source quotation and location and must pass validation before the calculator accepts it.

## Validate intervals, not fluent sentences

Whether “seven days before” is inclusive can change the amount. The internal representation explicitly records start, end, inclusivity, fee type, and fee value. The validator rejects gaps in the target period and overlaps where two rules claim the same date.

If the reference date, departure date, or cancellation time is missing—or a clause says only “a fee may apply”—the tool does not estimate. It returns a blocking error and a distinct exit code with the missing input. In this domain, refusing to calculate is safer than producing a plausible amount.

## Bind every extracted number to a source quotation

Every fee rule retains the source text from which it was derived. The validator confirms that the quotation exists and that extracted `(number, unit)` pairs match it.

The calculator receives only validated intervals and deterministically handles:

- day distance between cancellation and departure;
- inclusive interval boundaries;
- fixed and percentage fees;
- a fee cap at the paid amount;
- `refund = paid amount - validated fee`.

The language model may vary phrasing; the pure amount function must return the same number for the same inputs. Each boundary therefore receives a different test strategy.

## State supported scope before claiming accuracy

All ten golden fixtures returned the expected interval and amount, and all 14 quotations used in answers existed in their sources. Gaps, overlaps, missing dates, and unsupported constructs produced the intended blocking result.

The supported scope is simple date, fixed-fee, and percentage-fee rules for overseas package travel. It does not calculate business-day calendars, departure time zones, coupons, partial cancellations, or compound promotions. Comparisons with consumer standards are context, not legal advice or a merchant decision.

For money-related AI, the valuable property was not “usually correct.” It was the ability to reproduce why a number was produced and to define exactly when no number may be produced.
