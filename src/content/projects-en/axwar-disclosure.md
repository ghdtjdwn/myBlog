---
title: "DART Disclosure Briefing Guard"
summary: "A Codex plugin that explains rights offerings and convertible bond disclosures while blocking investment-solicitation language and numbers absent from the source."
status: complete
statusNote: "The deliverable includes fixtures and validators for rights offerings and convertible bonds. Automation against live disclosures is limited to list retrieval."
activity: other
visibility: private
role: "Independent design, implementation, and validation"
contributionEvidence: ["8 adversarial tests", "Exact-match number validation", "Gate for prohibited language and required notices"]
tags: ["DART", "Compliance", "LLM Guardrail", "Financial Data"]
infra: ["Offline mock", "OPEN DART optional"]
metrics:
  - { label: "Adversarial", value: "8 / 8" }
order: 8
featured: false
repositories: []
recordPlan: "Keep disclosure fixtures and adversarial tests as the validation source of truth, and turn the decisions for controlling numbers, notices, and investment solicitation in a financial LLM into a blog case study."
recordLinks: []
---

## Problem

Corporate disclosures contain dense legal language and many numbers, which makes them difficult for a beginner to read. Simplifying them becomes more dangerous if the process changes an amount or ratio or produces wording that resembles a recommendation to buy. The project separates briefing generation from publication eligibility so that even model-written output is usable only after deterministic validation.

## Separating summarization from publication approval

The LLM explains the disclosure, while a validator compares every number exactly against the set of source values. Language implying a purchase, recommendation, or guarantee, as well as a missing required notice, causes publication to fail.

The system retrieves source data from a mock or the OPEN DART listing endpoint. AI writes context, potential shareholder impact, and items a reader should verify. The validator then checks for newly introduced numbers, truncated magnitudes, derived ratios, prohibited investment-solicitation language, and missing notices. Disclosure types other than rights offerings and convertible bonds are reported as unsupported instead of being summarized with unwarranted confidence.

## Adversarial validation

Eight adversarial cases cover purchase inducement, deleted notices, a derived 15% figure absent from the source, shortening `3,000,000` to `3,000`, and even single-digit changes. A number's presence in the source does not prove that it is used in the correct context, so this check is only the first layer of the publication safety net.

## Remaining risk

The validator confirms that a number exists but cannot fully determine whether the sentence uses it in the correct context. Linking each sentence to its source field is the next extension.

The prohibited-language dictionary also cannot block every paraphrased workaround. The next step is to associate each sentence with the DART field and source location it used, then validate not only the number but also its meaning, unit, and subject. The product will continue to state that it assists with reading disclosures and does not provide investment advice.
