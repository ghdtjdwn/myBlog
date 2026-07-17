---
title: "Redrawing the failure boundary to preserve 70 successful LMS files"
description: "How four unsupported attachments led to explicit origin checks and a partial-success policy instead of discarding an otherwise valid export."
publishedAt: 2026-07-17
category: backend
activity: personal-project
tags: ["LMS", "SSRF", "Partial Failure", "Async Jobs"]
project: ssu-platform
role: "Designed the resolver and worker failure taxonomy, origin checks, and production recovery validation"
evidence:
  - "ssuMCP PR #224 and the 2026-07-16 troubleshooting record for the 74-item LMS export"
  - "ADRs for ZIP export, single-use tokens, and shared PVC storage"
validation:
  - "Fixtures for relative and absolute URLs, rejected origins, partial and total failure, 404, 410, 429, 503, and retry truncation"
  - "Successful full Gradle and JaCoCo gates plus PR and main CI and Security workflows"
  - "A 74-item job on the same account reached READY and completed archive download"
limitations:
  - "The UI evidence cannot distinguish whether four problematic ZIP files were included or recorded as safe omissions"
  - "Lease heartbeat and download-TTL erosion for builds longer than five minutes remain separate work"
  - "User file URLs, content ids, cookies, and raw exceptions are not published"
featured: true
draft: false
---

## Four failures erased seventy successes

An export of 74 non-video LMS materials behaved asymmetrically. Selecting 70 PDFs produced an archive of roughly 312 MB. Selecting four ordinary ZIP attachments failed, and selecting all 74 discarded even the PDFs already downloaded.

The first hypothesis blamed a missing `sizeBytes` value and a zero total. The worker did not preallocate from the estimate, however; it enforced limits against actual streamed bytes. The successful PDF-only run also excluded total size, file count, and the outer ZIP writer.

The real boundary crossed URL resolution and job-level exception handling:

- PDF fixtures used relative download URIs, so string-prefixing a base URL happened to work.
- Ordinary attachments could return absolute Canvas or Commons URIs, which the same prefixing corrupted.
- One catch-all wrapped the entire selection loop, so one resolution failure moved the whole job to `FAILED`.

Missing size metadata was evidence of an earlier optional-enrichment problem, not the direct cause.

## Partial success without hiding critical failure

Skipping every exception would preserve an archive, but could silently treat expired authentication, owner revocation, rate limiting, server limits, or storage failure as success. Failing on the first unsupported item discarded valid user data.

The worker now classifies failures by scope:

| Condition | Result |
| --- | --- |
| metadata parse, unsupported capability, 404 or 410 | omit that item |
| at least one successful file | partial `READY` with an omission report |
| authentication or owner revocation, 429, 400, exhausted 5xx | fail the job |
| timeout, byte or disk limits, internal storage error | fail the job |
| every item omitted | fail instead of returning an empty success |

`_ssuAI_export_report.txt` records only course, filename, and a fixed low-cardinality reason. Raw URLs, content ids, cookies, and exception bodies do not enter the archive, metrics, or logs.

## Supporting absolute URLs without opening SSRF

Relative URIs are resolved against the Commons base with URL semantics, not string concatenation. An absolute HTTP(S) URI is accepted only when its scheme, host, and effective port exactly match a configured Canvas or Commons origin.

Userinfo and origin mismatches are rejected before `HEAD` or `GET`, and the cookie jar follows the same origin boundary. Supporting an absolute link must not become permission to forward authenticated cookies to an arbitrary server.

A transient GET can retry once, but only after truncating a fresh temporary file. Appending to bytes left by the first attempt would create a corrupted archive entry.

## The other lifecycle boundaries around the artifact

The asynchronous export spans more than collection:

- the database owns the job and token hash;
- two backend replicas share the ZIP through a single-node PVC;
- only a completed byte copy and flush triggers the conditional `READY → DOWNLOADED` update;
- a broken stream leaves the token usable within its TTL.

Two downloads already in flight may both finish. Serializing a large stream under a database row lock was not justified for the current threat model; the implemented guarantee blocks replay after a completed download.

## What production validation established

[ssuMCP PR #224](https://github.com/ghdtjdwn/ssuMCP/pull/224) fixed relative and absolute origins, rejected mismatches, partial success, all-skipped behavior, authentication failures, 404, 410, 400, 429, 503, and temporary-file truncation in fixtures. The full Gradle and JaCoCo gates and both PR and main CI and Security workflows succeeded.

After deployment, the same account completed a 74-item job through `READY` and archive download. That proves recovery from the all-or-nothing failure and preservation of valid materials. The UI alone does not prove whether each of the four ordinary ZIPs became an archive entry or a safe omission, so the result is not described as a 74-of-74 collection success.
