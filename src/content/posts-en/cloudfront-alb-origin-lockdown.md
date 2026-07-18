---
title: "Why a public ALB still had to be closed behind CloudFront"
description: "A zero-downtime origin lockdown that moved the BFF first, then restricted direct ALB HTTP access to AWS-managed CloudFront origin-facing networks."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["CloudFront", "ALB", "AWS", "Network Security"]
project: geuneul
role: "Moved the Geuneul BFF origin, minimized the ALB security-group change, and verified both intended and bypass paths"
evidence:
  - "Geuneul ADR-0028 and the Terraform CloudFront and ALB security-group changes"
  - "Pre-change verification of disabled caching, forwarded methods and headers, and security-group replacement risk"
validation:
  - "A timeout on direct ALB DNS access while CloudFront HTTPS and the application BFF remained 200"
  - "No service interruption while applying only the ingress rule in place"
limitations:
  - "The CloudFront origin-facing prefix list covers origin servers for all CloudFront distributions, not only mine"
  - "The current CloudFront-to-ALB origin hop uses HTTP; security-group isolation reduces its exposure"
  - "Caching is disabled, so this boundary is not intended as an application-performance acceleration"
featured: false
draft: false
---

## Front-door HTTPS did not automatically remove direct-origin exposure

Geuneul served browser HTTPS through a CloudFront default domain, but the ALB security group still allowed port 80 from `0.0.0.0/0`. Users saw CloudFront's HTTP-to-HTTPS redirect, yet anyone with the ALB DNS name could call the backend directly over plaintext HTTP.

The Vercel BFF also called that ALB HTTP URL. Closing the ALB first would have blocked the BFF, so migration order was part of the availability contract.

```text
before
browser -> CloudFront HTTPS -> ALB HTTP
BFF -----------------------> ALB HTTP
internet ------------------> ALB HTTP
```

## I moved the consumer before narrowing ingress

First I changed the BFF API base to the CloudFront HTTPS domain and verified login, writes, and spatial queries. CloudFront used `Managed-CachingDisabled` and forwarded all methods, queries, and Authorization headers, so personalized and mutating responses were neither cached nor truncated.

I then changed the ALB port-80 source to the AWS-managed `com.amazonaws.global.cloudfront.origin-facing` prefix list. AWS maintains the changing edge ranges. The [CloudFront documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/LocationsOfEdgeServers.html) describes using this list to restrict an origin to CloudFront's origin-facing servers.

The list does not identify only my distribution; every CloudFront origin-facing server is allowed at the network layer, so host and application validation remain important. It still removes direct access from arbitrary internet hosts and the plaintext bypass.

## I do not describe the remaining HTTP hop as end-to-end TLS

The browser and BFF now use HTTPS to CloudFront. CloudFront currently reaches the ALB on port 80, so I do not claim end-to-end encryption. The HTTP origin hop is instead isolated to AWS-managed CloudFront origin networks. A custom domain and ACM-backed ALB listener or VPC origin would be a future hardening step.

The security-group `description` was immutable; correcting its text would have replaced the group and risked detaching it from the ALB. I kept the old description and changed only the ingress rule in place. Cosmetic state was not worth a live-resource replacement.

## I verified failure and success as a pair

After the change, direct HTTP to the ALB DNS timed out while CloudFront HTTPS and BFF requests remained 200. Routing the BFF through CloudFront added the hop; because caching was disabled, every request paid that path cost, measured in tens of milliseconds. That was an accepted trade-off relative to the roughly 1.4-second spatial-search p95 at the time.

[ADR-0028](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0028-alb-cloudfront-origin-lockdown.md) records the order and rejected listener and security-group replacement alternatives.

Putting a CDN in an architecture diagram does not place the backend behind it. Every consumer must move to the intended entry point first; then origin network policy must be narrowed, and both the allowed path and bypass failure must be verified.
