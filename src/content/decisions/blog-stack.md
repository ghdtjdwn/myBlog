---
title: "기술 블로그를 Astro 정적 사이트로 운영한다"
decidedAt: 2026-07-15
status: accepted
draft: false
---

## 맥락

프로젝트, 기술 글, ADR과 실제 장애 기록을 한 정보 구조에서 연결해야 한다. 사용자는 이미 k3s와 AWS/Terraform 운영 경험을 별도 프로젝트에서 충분히 증명하고 있다.

## 결정

Astro와 TypeScript로 정적 사이트를 생성하고 Markdown/MDX 콘텐츠를 Git에서 관리한다. GitHub Actions가 타입·콘텐츠·정적 산출물을 검사하고, 배포 시점에는 Vercel Preview와 Production을 사용한다.

## 이유

블로그 자체에 서버, 데이터베이스, 인증은 필요하지 않다. 정적 출력을 선택하면 공격 표면과 비용을 줄이면서 글과 프로젝트 연결을 스키마로 검증할 수 있다. 인프라 설명력은 불필요한 복잡성을 추가하는 대신 요구에 맞게 제거한 근거에서 만든다.

## 재검토 조건

동적 API, 인증, 모바일 편집, edge logic이 실제 요구로 확인되거나 Vercel의 정책·비용이 개인 사이트에 맞지 않을 때 재검토한다.
