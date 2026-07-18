---
title: "Designing Kafka consumer groups when every Pod must receive an SSE event"
description: "A cutover from lightweight database notifications to Kafka KRaft, including broadcast semantics, a duplicate-bean rollout failure, and a live broker interruption."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["Kafka", "SSE", "Kubernetes", "Event-Driven"]
project: ssu-platform
role: "Designed the Kafka intent bus, recovered its zero-downtime cutover, and ran the operational interruption experiment"
evidence:
  - "The adoption trigger, KRaft topology, and intent-bus contract across ssuMCP ADR-0071, 0089, 0090, and 0091"
  - "The live rollout where duplicate LibraryIntentStatusBus beans crash-looped new Pods"
validation:
  - "Two backend Pods subscribed with unique consumer groups, topic creation, and 2/2 Ready status"
  - "Observed roughly 32 seconds of event-bus unavailability, 47 seconds to broker recovery, and continued application health"
limitations:
  - "A single broker with replication factor one does not provide Kafka high availability"
  - "New Pods use auto.offset.reset=latest and do not replay the entire history from before they joined"
  - "A field E2E from a real reservation through terminal SSE remained outstanding when the ADR was written"
featured: true
draft: false
---

## Not adopting Kafka was initially the correct decision

The first intent-status path had a PostgreSQL source of truth and lightweight notifications. There was no durable replay consumer, independent service subscription, or operational need that justified another stateful broker. ADR-0071 therefore kept the simpler storage path until a concrete trigger existed.

That trigger arrived with tool-call telemetry and reservation-intent SSE across multiple Pods. Producers and consumers now had independent lifetimes, and the event pipeline needed recovery after broker interruption. Only then did I introduce a single Kafka KRaft broker sized for the constrained node.

## Normal group load balancing was wrong for SSE

Consumers in the same Kafka group divide partitions. That is useful for a work queue, but it breaks SSE when a client may be attached to any Pod. If Pod 1 alone consumes intent A while the browser is connected to Pod 2, the terminal event never reaches that connection.

```text
Kafka topic
  -> group pod-1 -> ssuMCP Pod 1 -> its SSE clients
  -> group pod-2 -> ssuMCP Pod 2 -> its SSE clients
```

Each Pod uses a unique consumer group so every Pod receives every new event. The key is `intentId`, preserving order for one intent within a partition. A new Pod starts at `latest` instead of rebroadcasting all history; on reconnect, a client first reads the current authoritative state from the database.

## Two implementations existed during the cutover

Enabling the cutover flag exposed both `kafkaLibraryIntentStatusBus`, the Kafka delegate, and `libraryIntentStatusBus`, the canonical facade/factory that returned that delegate, as `LibraryIntentStatusBus` beans. This was not the previous bus lingering beside the new one; two bean definitions led to the same Kafka-backed path but remained ambiguous by type. Without `@Primary`, new Pods failed while creating the Spring application context. Unit tests had started adapters separately and never represented that combination.

`maxUnavailable: 0` retained the old Ready Pods, so users did not lose service. I marked the canonical facade/factory bean as `@Primary` and added a full-context integration test with EmbeddedKafka. The correct cutover test unit was not the new class in isolation; it was the application with both the conditional delegate and canonical bean definitions active.

## I interrupted the broker deliberately

A bounded executor prevents producer callbacks from occupying the request path indefinitely, and event publication fails open with respect to core API health. I tested that policy by forcibly deleting the broker Pod.

The event bus was unavailable for roughly 32 seconds and the broker recovered after about 47 seconds. Application health and existing APIs stayed available, and the consumers resubscribed after reconnection. I verified topic creation and one unique group on each of two backend Pods, while the ADR explicitly left a field E2E from a real reservation through terminal SSE as outstanding.

## Delivery semantics came before the broker choice

[ADR-0091](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0091-reservation-intent-bus-kafka.md) records the unique groups, ordering key, offset policy, and failure boundary. I do not present a one-broker deployment as highly available, and the database remains the SSE recovery source of truth.

The important decision was not “use Kafka.” It was defining which events every Pod must observe, how much history a new Pod should replay, and whether broker failure should fail the primary request. The consumer-group topology followed those semantics.
