---
title: "Healthy dashboards, silent alerts, and an empty trace backend"
description: "Repairing quiet observability failures by deriving Prometheus label contracts and Spring Boot tracing autoconfiguration from live evidence."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["Prometheus", "OpenTelemetry", "Tempo", "Spring Boot"]
project: ssu-platform
role: "Diagnosed the platform's Prometheus rules and OpenTelemetry trace pipeline and added regression checks"
evidence:
  - "Incident records for alert selectors that evaluated no useful data for five weeks and Tempo spans remaining at zero"
  - "Comparisons across live Prometheus series, application classpath and environment, collector health, and Tempo"
validation:
  - "The invalid application selector returned zero series while the actual job selector returned 69"
  - "Seven corrected live alert rules evaluated against data, and real application traces were retrieved from Tempo"
limitations:
  - "Trace ingestion does not prove that sampling or every alert threshold is operationally optimal"
  - "Validation used safe synthetic conditions rather than causing a user-facing outage"
featured: true
draft: false
---

## Observability can fail quietly

Dashboards displayed metrics, yet two important alerts had not meaningfully evaluated for roughly five weeks. Separately, Tempo contained zero application spans. Neither path emitted an obvious exporter or collector error, so both looked like quiet traffic.

The Prometheus problem was a label-contract mismatch. The rules selected `application="ssuai"`, but scraped metrics did not have that label. They had `job="ssuai-backend"`.

```text
count({application="ssuai"})  # 0 series
count({job="ssuai-backend"})  # 69 series
```

A syntactically valid PromQL expression may return an empty vector without producing an error. The alert simply never fires. Dashboard queries had already been updated, while rules in a separate file retained the old selector.

## Derive selectors from data, not intended configuration

Before changing the rules, I inspected the label sets on live series. Rather than copying an expected application name from configuration, I treated the `job`, `namespace`, and `service` values actually exposed by scrape targets as the contract. I evaluated every rule expression against live Prometheus and distinguished an empty selector from a legitimately quiet condition.

After the change, seven rules evaluated against live data. Safe synthetic conditions and existing series were enough to validate selectors and expressions without creating a user-facing failure.

## A healthy receiver does not mean the application emits spans

For Tempo, the collector endpoint and network path were healthy. The application Pod also contained OTLP-related environment variables. There were no exporter initialization messages and no export failures. The evidence pointed to a component that was never created, not a component that failed to send.

During a Spring Boot major-version migration, changing property names had been treated as sufficient. The classpath, however, lacked the required OpenTelemetry starter. Environment variables do not instantiate autoconfiguration. I added the starter so the tracer provider and exporter beans were created, and explicitly disabled unused OTLP metrics export to avoid duplicate paths.

After restarting the application, I did not stop at seeing a local trace ID. I queried Tempo for the service's actual spans, closing the application-to-collector-to-backend path.

## Make the meaning of zero testable

The dangerous observability failure is often an empty result rather than a red error. I now include four checks in rollout verification:

- Does each alert selector match at least one live series?
- Do dashboards and rules use the same label vocabulary?
- Is the required autoconfiguration present on the classpath, not merely named in properties?
- Can a trace created by the application be found in the final backend?

Seven evaluating rules and a trace in Tempo demonstrate connectivity. They do not establish ideal sampling, thresholds, or notification delivery; those remain separate operational questions.
