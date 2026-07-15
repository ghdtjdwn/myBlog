---
title: "ssuAI · ssuMCP · ssuAgent"
summary: "숭실대 데이터를 웹, 자연어 에이전트, 표준 MCP 도구로 연결하고 실제 k3s 환경에서 운영하는 캠퍼스 AI 플랫폼입니다."
status: operating
visibility: public
role: "4개 서비스 설계·구현·운영"
teamScope: "개인 주도 프로젝트"
contributionEvidence:
  - "ssuAI 412 commits / 202 PRs"
  - "ssuMCP 388 commits / 193 PRs"
  - "ssuAgent 92 commits / 48 PRs"
image: "../../assets/projects/ssuai-live-home.png"
imageAlt: "ssuAI 캠퍼스 어시스턴트 채팅 화면"
tags: ["MCP", "LangGraph", "Spring Boot", "Next.js"]
infra: ["k3s", "ArgoCD", "Kafka", "PostgreSQL", "Observability"]
metrics:
  - { label: "MCP tools", value: "52" }
  - { label: "Automated tests", value: "1,200+" }
  - { label: "ADR", value: "84" }
order: 1
featured: true
live: "https://ssuai.vercel.app"
repositories:
  - { label: "ssuMCP", url: "https://github.com/ghdtjdwn/ssuMCP" }
  - { label: "ssuAI", url: "https://github.com/ghdtjdwn/ssuAI" }
  - { label: "ssuAgent", url: "https://github.com/ghdtjdwn/ssuAgent" }
---

## 문제

범용 AI는 학교의 학식, 공지, 도서관, 학사 일정과 사용자별 시간표·성적·LMS 과제를 직접 다룰 수 없습니다. 학교 데이터를 단순 챗봇 지식으로 복사하는 대신, 동일한 서비스 기능을 웹과 외부 MCP 클라이언트가 함께 사용할 수 있는 도구 계층으로 만들었습니다.

## 설계

- Spring Boot 서비스가 REST API와 MCP 도구의 같은 비즈니스 로직을 공유합니다.
- Next.js는 웹 대시보드와 same-origin BFF를 담당합니다.
- LangGraph 에이전트는 도메인을 라우팅하고 도구 실행 과정을 SSE로 전달합니다.
- 쓰기 동작은 `prepare → confirm`으로 나눠 사용자의 명시적 승인을 요구합니다.

## 운영

Oracle ARM64 단일 노드에 k3s, Helm, ArgoCD, Traefik, cert-manager를 구성했습니다. PostgreSQL·Redis·Kafka를 사용하며 Prometheus/Grafana, Tempo, Loki로 메트릭·트레이스·로그를 연결했습니다. GitOps drift, 이미지 아키텍처 불일치, Kafka와 Tempo의 자원 문제를 실제 장애 기록으로 남겼습니다.

## 한계

단일 노드 기반이라 노드 장애를 견디는 고가용성 클러스터는 아닙니다. 이 프로젝트의 핵심은 규모를 과장하는 것이 아니라 제한된 환경에서도 배포·관측·복구 경로를 설명할 수 있게 만드는 데 있습니다.
