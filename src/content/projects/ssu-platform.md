---
title: "ssu 캠퍼스 AI 플랫폼"
summary: "ssuAI·ssuMCP·ssuAgent·ssu-ai-service가 숭실대 데이터를 웹, 자연어 에이전트와 표준 MCP 도구로 연결하는 운영형 플랫폼입니다."
status: operating
statusNote: "웹·챗·MCP·임베딩 서비스가 운영 중이며, 외부 학교 시스템 변화와 단일 노드 제약을 관측하면서 계속 개선하고 있습니다."
activity: personal
visibility: public
role: "4개 서비스 설계·구현·운영"
teamScope: "개인 주도 프로젝트"
contributionEvidence:
  - "4개 서비스의 설계·구현·운영과 서비스 간 계약"
  - "저장소별 ADR·작업 로그·트러블슈팅과 배포 검증 기록"
image: "../../assets/projects/ssuai-live-home.png"
imageAlt: "개인 일정, 과제, 도서관 좌석, 학식과 공지를 한 화면에 모은 ssuAI 홈 대시보드"
screenshots:
  - image: "../../assets/projects/ssuai-live-academics.png"
    alt: "졸업요건, 누적 성적, 채플, 장학금과 LMS 과제를 보여주는 ssuAI 학사 화면"
    caption: "학사 — 졸업요건 진행률과 누적 성적, 채플, 장학금, LMS 과제를 같은 맥락에서 확인합니다."
  - image: "../../assets/projects/ssuai-live-library.png"
    alt: "6개 열람실의 실시간 좌석 현황과 대출·도서 검색을 보여주는 ssuAI 도서관 화면"
    caption: "도서관 — 열람실 좌석을 주기적으로 갱신하고 대출 현황과 소장 도서 검색을 한 화면에서 제공합니다."
  - image: "../../assets/projects/ssuai-live-campus.png"
    alt: "오늘의 학식, 기숙사 주간 식단, 공지, 학사일정과 시설 검색을 보여주는 ssuAI 캠퍼스 화면"
    caption: "캠퍼스 — 학식·공지·학사일정·시설 검색을 날짜와 목적별로 묶었습니다."
  - image: "../../assets/projects/ssuai-live-connections.png"
    alt: "u-SAINT, LMS와 도서관의 연결 상태와 제공 기능을 보여주는 ssuAI 서비스 연결 화면"
    caption: "서비스 연결 — u-SAINT·LMS·도서관 세션의 연결 상태와 열리는 개인 데이터 기능을 명확히 구분합니다."
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
recordPlan: "각 저장소에는 ADR과 장애 원문을 남기고, 여러 서비스의 경계를 이해해야 하는 사례만 블로그 글로 다시 구성합니다. 운영 중인 프로젝트이므로 새로운 장애와 결정은 계속 추가됩니다."
recordLinks:
  - { label: "명시 MCP 세션 인증 경계 ADR", url: "https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0098-authoritative-mcp-session-resolution.md" }
  - { label: "서버 검증 principal 프록시 ADR", url: "https://github.com/ghdtjdwn/ssuAI/blob/main/docs/adr/0086-server-side-principal.md" }
  - { label: "안정 principal thread 소유권 ADR", url: "https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0011-thread-stable-principal-binding.md" }
  - { label: "MCP content block와 HITL resume ADR", url: "https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0016-mcp-content-block-hitl-unwrap.md" }
  - { label: "일회용 SSO code exchange ADR", url: "https://github.com/ghdtjdwn/ssuAI/blob/main/docs/adr/0089-sso-code-exchange.md" }
  - { label: "ssuMCP 트러블슈팅 하이라이트", url: "https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/troubleshooting-highlights.md" }
---

## 문제

범용 AI는 학교의 학식, 공지, 도서관, 학사 일정과 사용자별 시간표·성적·LMS 과제를 직접 다룰 수 없습니다. 학교 데이터를 단순 챗봇 지식으로 복사하는 대신, 동일한 서비스 기능을 웹과 외부 MCP 클라이언트가 함께 사용할 수 있는 도구 계층으로 만들었습니다.

## 설계

- Spring Boot 서비스가 REST API와 MCP 도구의 같은 비즈니스 로직을 공유합니다.
- Next.js는 웹 대시보드와 same-origin BFF를 담당합니다.
- LangGraph 에이전트는 도메인을 라우팅하고 도구 실행 과정을 SSE로 전달합니다.
- 쓰기 동작은 `prepare → confirm`으로 나눠 사용자의 명시적 승인을 요구합니다.

네 서비스의 책임도 분리했습니다. `ssuAI`는 사용자가 보는 웹과 same-origin BFF를, `ssuMCP`는 학교 데이터 수집과 52개 MCP 도구를, `ssuAgent`는 LangGraph 기반 라우팅과 HITL 흐름을 담당합니다. `ssu-ai-service`는 임베딩 요청을 별도 FastAPI 게이트웨이로 격리합니다. 프론트나 에이전트가 학교 시스템의 세부 구현을 직접 알지 않도록 서비스 계약을 경계로 삼았습니다.

## 신뢰성과 안전 경계

학교 포털, 도서관, LMS처럼 외부 시스템은 응답 형식과 인증 상태가 바뀔 수 있습니다. provider fallback, timeout, circuit breaker와 캐시를 두고, 실패를 정상 데이터처럼 반환하지 않도록 오류 계약을 분리했습니다. 사용자별 데이터와 쓰기 도구는 thread·session·principal의 소유권을 검증하고, 예약 같은 동작은 실행 전에 의도를 준비한 뒤 확인을 다시 받습니다.

임베딩 서비스는 API key가 없거나 upstream이 실패할 때 fail-closed로 종료하며, 외부 오류 본문을 그대로 사용자에게 반사하지 않습니다. 단순히 LLM을 연결한 챗봇보다 인증·도구 실행·상태 전이를 운영 가능한 계약으로 만드는 데 초점을 맞췄습니다.

## 운영

Oracle ARM64 단일 노드에 k3s, Helm, ArgoCD, Traefik, cert-manager를 구성했습니다. PostgreSQL·Redis·Kafka를 사용하며 Prometheus/Grafana, Tempo, Loki로 메트릭·트레이스·로그를 연결했습니다. GitOps drift, 이미지 아키텍처 불일치, Kafka와 Tempo의 자원 문제를 실제 장애 기록으로 남겼습니다.

CI가 성공했다는 사실을 배포 완료로 보지 않습니다. GHCR의 multi-architecture manifest, ArgoCD reconciliation, 실제 Pod digest, health와 사용자 요청을 순서대로 확인합니다. 메트릭·트레이스·로그는 같은 요청을 따라갈 수 있게 연결하고, 컨테이너는 ARM64 이미지와 제한된 자원 안에서 기동 시간을 함께 관측합니다.

## 확인한 결과

웹, 챗, MCP, 임베딩 health와 Grafana 공개 경로의 실제 응답을 확인했습니다. ssuMCP에는 시점별 전체 테스트 실행과 실계정 E2E, 동일 좌석 예약 요청의 single-flight 검증 기록이 남아 있습니다. 테스트 총합은 계속 바뀌므로 이 페이지에서는 재현 가능한 원문 링크 없이 합산 숫자를 고정하지 않습니다.

## 한계

단일 노드 기반이라 노드 장애를 견디는 고가용성 클러스터는 아닙니다. 이 프로젝트의 핵심은 규모를 과장하는 것이 아니라 제한된 환경에서도 배포·관측·복구 경로를 설명할 수 있게 만드는 데 있습니다.

학교 외부 시스템과 무료 LLM provider의 정책·쿼터에도 영향을 받습니다. NetworkPolicy는 현재 CNI와 외부 FQDN 제약을 검토한 뒤 보류했습니다. 이 제약을 숨기기보다 현재 운영 경계와 다음 개선 조건으로 기록합니다.
