---
title: "ssu Campus AI Platform"
summary: "ssuAI, ssuMCP, ssuAgent, and ssu-ai-service connect Soongsil University data to the web, natural-language agents, and standard MCP tools in an operating platform."
status: operating
statusNote: "The web app, chat, MCP, and embedding services are in operation and continue to improve as I monitor changes in external university systems and the constraints of a single-node cluster."
activity: personal
visibility: public
role: "Designed, implemented, and operate 4 services"
teamScope: "Independently led project"
contributionEvidence:
  - "Design, implementation, operation, and cross-service contracts across four services"
  - "Repository-level ADRs, work logs, troubleshooting records, and deployment verification"
image: "../../assets/projects/ssuai-live-home.png"
imageAlt: "The ssuAI home dashboard combining personal schedules, assignments, library seats, dining, and notices"
screenshots:
  - image: "../../assets/projects/ssuai-live-academics.png"
    alt: "The ssuAI academics screen showing graduation requirements, cumulative grades, chapel, scholarships, and LMS assignments"
    caption: "Academics — graduation progress, cumulative grades, chapel, scholarships, and LMS assignments in one context."
  - image: "../../assets/projects/ssuai-live-library.png"
    alt: "The ssuAI library screen showing real-time availability across six reading rooms, loans, and book search"
    caption: "Library — periodically refreshed reading-room availability, current loans, and catalog search in one screen."
  - image: "../../assets/projects/ssuai-live-campus.png"
    alt: "The ssuAI campus screen showing today's dining, weekly dormitory meals, notices, academic dates, and facility search"
    caption: "Campus — dining, notices, academic dates, and facility search organized by date and task."
  - image: "../../assets/projects/ssuai-live-connections.png"
    alt: "The ssuAI service-connections screen showing status and available features for u-SAINT, LMS, and the library"
    caption: "Service connections — separates u-SAINT, LMS, and library session state from the personal-data features each connection unlocks."
tags: ["MCP", "LangGraph", "Spring Boot", "Next.js"]
infra: ["k3s", "ArgoCD", "Kafka", "PostgreSQL", "Observability"]
metrics:
  - { label: "MCP tools", value: "52" }
  - { label: "Services", value: "4" }
order: 1
featured: true
live: "https://ssuai.vercel.app"
repositories:
  - { label: "ssuMCP", url: "https://github.com/ghdtjdwn/ssuMCP" }
  - { label: "ssuAI", url: "https://github.com/ghdtjdwn/ssuAI" }
  - { label: "ssuAgent", url: "https://github.com/ghdtjdwn/ssuAgent" }
  - { label: "ssu-ai-service", url: "https://github.com/ghdtjdwn/ssu-ai-service" }
recordPlan: "Each repository retains its ADRs and original incident records. I rewrite only the cases that require understanding boundaries across multiple services as blog posts. Because the platform is still operating, new incidents and decisions continue to be added."
recordLinks:
  - { label: "Authoritative MCP session boundary ADR", url: "https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0098-authoritative-mcp-session-resolution.md" }
  - { label: "Server-verified principal proxy ADR", url: "https://github.com/ghdtjdwn/ssuAI/blob/main/docs/adr/0086-server-side-principal.md" }
  - { label: "Stable-principal thread ownership ADR", url: "https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0011-thread-stable-principal-binding.md" }
  - { label: "MCP content blocks and HITL resume ADR", url: "https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0016-mcp-content-block-hitl-unwrap.md" }
  - { label: "One-time SSO code exchange ADR", url: "https://github.com/ghdtjdwn/ssuAI/blob/main/docs/adr/0089-sso-code-exchange.md" }
  - { label: "ssuMCP troubleshooting highlights", url: "https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/troubleshooting-highlights.md" }
---

## Problem

General-purpose AI cannot directly work with university dining menus, announcements, library data, academic calendars, or a student's timetable, grades, and LMS assignments. Instead of copying university data into a chatbot's knowledge base, I built a tool layer that lets the web application and external MCP clients use the same service capabilities.

## Design

- The Spring Boot service shares the same business logic between its REST API and MCP tools.
- Next.js provides the web dashboard and same-origin BFF.
- The LangGraph agent routes requests by domain and streams tool execution over SSE.
- Write operations follow a `prepare → confirm` flow that requires explicit user approval.

The four services have distinct responsibilities. `ssuAI` owns the user-facing web application and same-origin BFF. `ssuMCP` collects university data and exposes 52 MCP tools. `ssuAgent` handles LangGraph routing and HITL flows. `ssu-ai-service` isolates embedding requests behind a separate FastAPI gateway. Service contracts form the boundary so that neither the frontend nor the agent needs to know the implementation details of university systems.

## Reliability and safety boundaries

External systems such as the university portal, library, and LMS can change their response formats and authentication state. I use provider fallback, timeouts, circuit breakers, and caching, while keeping error contracts separate so that failures are not returned as normal data. User-specific data and write tools verify thread, session, and principal ownership. Operations such as seat reservations prepare an intent and request confirmation again before execution.

The embedding service fails closed when its API key is missing or its upstream fails, and it does not reflect upstream error bodies back to users. The focus is not simply connecting an LLM to a chatbot, but turning authentication, tool execution, and state transitions into operable contracts.

## Operations

I run k3s, Helm, ArgoCD, Traefik, and cert-manager on a single Oracle ARM64 node. The platform uses PostgreSQL, Redis, and Kafka, with Prometheus/Grafana, Tempo, and Loki connecting metrics, traces, and logs. I documented GitOps drift, image architecture mismatches, and Kafka and Tempo resource failures as real incident records.

A successful CI run is not treated as a completed deployment. I verify the GHCR multi-architecture manifest, ArgoCD reconciliation, the actual Pod digest, health, and a user request in sequence. Metrics, traces, and logs are connected across the same request, and I observe container startup time within the constraints of ARM64 images and limited resources.

## Verified results

I verified real responses from the public web, chat, MCP, embedding health, and Grafana paths. ssuMCP retains records of full test-suite runs at different points in time, real-account E2E verification, and single-flight validation for concurrent requests to reserve the same seat. Because the total number of tests keeps changing, this page does not freeze an aggregate number without a reproducible source link.

## Limitations

The single-node deployment is not a highly available cluster that can survive a node failure. The point of the project is not to exaggerate its scale, but to make deployment, observability, and recovery paths explainable even within a constrained environment.

The platform is also affected by policy and quota changes in external university systems and free LLM providers. NetworkPolicy remains deferred after evaluating the current CNI and external FQDN constraints. I document these constraints as current operating boundaries and conditions for the next improvement rather than hiding them.
