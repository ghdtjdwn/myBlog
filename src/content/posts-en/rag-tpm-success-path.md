---
title: "The success-path bug hidden behind HTTP 429"
description: "How I isolated a RAG embedding failure to token throughput, then fixed the Jackson response contract that only appeared after rate limiting was gone."
publishedAt: 2026-07-17
category: troubleshooting
activity: personal-project
tags: ["RAG", "Rate Limit", "Jackson", "Incremental Processing"]
project: ssu-platform
role: "Reproduced the ssuMCP embedding failure, inferred the provider limit, and implemented batch control and response-contract fixes"
evidence:
  - "The RAG embedding 429 and Jackson primitive-null incident records in ssuMCP TROUBLESHOOTING"
  - "ADR-0065 on incremental embedding persistence and direct inspection of the embedding table"
validation:
  - "Controlled calls to the same endpoint using different batch sizes and both natural Korean text and repetitive strings"
  - "Embedding rows increased from 0 to 217; search returned embeddingUsed=true and fusionMethod=rrf"
  - "Success-response fixtures and a regression scan of similar DTOs"
limitations:
  - "The observed limit belongs to that provider account and model at that time; it is not a universal threshold"
  - "Successfully loading 217 documents does not establish retrieval quality"
featured: true
draft: false
---

## A 429 response is an observation, not a diagnosis

The RAG path kept falling back to lexical search. The embedding table contained no rows, and the external embedding API returned HTTP 429. Request-rate limits, an invalid key, and network egress were all plausible at first.

I called the same endpoint directly instead of tuning blindly. A single-item request returned 200, which ruled out the key and the network path. I then varied batch size and information density independently.

```text
16 natural Korean inputs   -> 200
48 or 96 Korean inputs     -> 429
96 repetitive strings      -> 200
```

The request count stayed constant while token-heavy Korean inputs failed. That pattern supported a tokens-per-minute bottleneck rather than requests per minute. The repetitive input acted as a control, separating token pressure from a simple array-length limit.

## Preserve the provider's diagnostic signal

The original client logged the status code but discarded the provider's error body. Classifying a failure requires enough structured detail to distinguish retryable throttling from another quota. I retained a redacted error body, reduced the embedding batch to eight items, and inserted a 15-second interval between batches.

I also stopped treating the entire corpus as one transaction. Each successful batch is persisted immediately, and a later run can resume from missing rows. For a long-running external API job, idempotent incremental progress is cheaper and safer than losing every prior success when the last call fails.

## Removing the failure exposed a broken success path

The job still did not complete after throttling was controlled. This time Jackson failed to decode a 200 response. The DTO declared an unused primitive `int index`, while some successful responses omitted that field. The code had never reached this decoder while every request was failing.

I removed the unused provider field and scanned similar response DTOs for the same non-null primitive assumption. I deliberately did not merely change it to `Integer`: keeping an unnecessary provider detail in the internal contract would add change surface without business value. A fixture-based test now covers decoding after a successful HTTP response.

## Define recovery at the consumer boundary

The final run increased the embedding table from zero rows to 217. A real search response reported `embeddingUsed: true` and `fusionMethod: rrf`, demonstrating that the vector and lexical fusion path was actually selected.

The useful diagnostic sequence was:

1. Use a single successful request to eliminate authentication and egress.
2. Separate payload size from information density to infer the quota dimension.
3. Create an incremental persistence boundary before slowing batches down.
4. After the error disappears, verify decoding and the final consumer path.

The row count proves pipeline recovery, not relevance. Retrieval quality still needs a separate query set and evaluation criteria.
