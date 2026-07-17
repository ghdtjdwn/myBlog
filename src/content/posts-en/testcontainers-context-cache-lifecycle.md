---
title: "When a cached Spring context points to a dead Testcontainer"
description: "Aligning class-scoped containers with a cached Spring context, then removing a second CI flake caused by a reservation worker consuming test fixtures."
publishedAt: 2026-07-17
category: engineering
activity: personal-project
tags: ["Testcontainers", "Spring", "CI", "Concurrency"]
project: ssu-platform
role: "Analyzed container and context lifetimes in ssuMCP integration tests and isolated nondeterministic background workers"
evidence:
  - "The ApplicationContext failure-threshold and scheduler-race records in ssuMCP TROUBLESHOOTING"
  - "Mapped-port and reservation-fixture failures that appeared only in full CI ordering"
validation:
  - "Repeated isolated and full integration suites after moving to a singleton container"
  - "Worker mocks and correlation-scoped delta assertions removed order dependence in CI"
limitations:
  - "This fixes test-environment lifetimes; it is not evidence about production container orchestration"
  - "The tests control known races but do not explore every possible thread interleaving"
featured: false
draft: false
---

## Each test passed; the suite did not

Several ssuMCP integration tests passed alone but collapsed in the full CI suite with `ApplicationContext failure threshold exceeded`. A later test's PostgreSQL mapped port belonged to a container that had already stopped.

The original setup declared a static `@Container` per test class. Testcontainers stopped it when the class finished, while Spring retained a compatible `ApplicationContext` in its cache. A later class could reuse that context and its datasource, which still pointed to the terminated port.

```text
Test class lifecycle : start container ─ test ─ stop container
Spring context cache : create context ───────── reuse in another class
```

The root cause was not that either framework violated its contract. The two contracts had different lifetimes. Once a failed context hit Spring's failure threshold, many later tests failed as collateral damage and obscured the first broken boundary.

## Give the suite a resource with the same lifetime

I moved the database to a shared singleton holder that keeps the container alive for the JVM test suite. The endpoint now remains valid for as long as cached contexts may reuse it. Forcing every test to discard its context was another option, but it would slow the suite and avoid rather than model normal cache behavior.

I ran both isolated classes and the full suite after the change. The distinction matters: an isolated pass cannot reproduce the original ordering problem, while a full-suite failure alone makes the owning lifecycle harder to locate.

## A second flake hid behind a setting that did nothing

Once the port failure disappeared, reservation tests still failed intermittently. They assumed `spring.task.scheduling.enabled=false` disabled a background worker, but that property was not an actual switch for this worker.

The scheduled consumer sometimes processed an outbox row before the assertion. The test reported that the row was missing even though it had been created and consumed correctly. Parallel execution also mixed WireMock calls from earlier tests into absolute-count assertions.

For tests of outbox creation, I mock the worker bean itself and explicitly own the asynchronous boundary. External calls are asserted as before-and-after deltas scoped by correlation ID, not as a process-wide absolute count. Disabling a competitor through the application graph is a stronger contract than relying on a plausible property name.

## Remove nondeterminism without removing reality

Stable integration tests make four facts explicit:

- who starts and stops each external resource;
- which endpoint a cached context retains;
- which worker can consume the same row before an assertion;
- whether external calls can be counted by request invariant rather than global state.

A mocked worker does not prove concurrent consumption is correct. Separate worker integration tests exercise the real transition. Only tests whose subject is fixture creation suppress the competitor. Determinism and concurrency realism belong at different test boundaries.
