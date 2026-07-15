---
title: "firstStudy"
summary: "Spring Boot로 회원 관리 CRUD와 REST API 기본기를 익힌 초기 학습 프로젝트입니다."
status: archive
statusNote: "Spring Boot 학습 초기 기록입니다. 현재 개발은 종료됐고 공개 문서의 자격증명 형태를 정리하기 전까지 상세 홍보를 보류합니다."
activity: personal
visibility: public
role: "개인 학습 프로젝트"
contributionEvidence: ["사용자 저장소 2 commits"]
tags: ["Spring Boot", "JPA", "Validation", "REST"]
infra: []
metrics:
  - { label: "Stage", value: "Learning archive" }
order: 13
featured: false
draft: true
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/firstStudy" }
recordPlan: "원본 저장소의 보안 정리와 secret scan을 먼저 완료한 뒤, 기능 소개보다 초기 CRUD에서 운영 시스템까지 성장한 차이를 회고 글로 기록합니다."
recordLinks: []
---

## 시작점

Spring Boot의 controller-service-repository 계층, JPA entity와 회원 관리 CRUD, Bean Validation, REST 응답과 Swagger를 처음 연결한 개인 학습 프로젝트입니다. 지금의 대표 프로젝트와 비교하면 기술 깊이는 낮지만 백엔드 학습의 출발점을 보여줍니다.

## 배치 이유

현재 대표 프로젝트보다 기술 깊이는 낮지만 학습의 출발점을 보여줍니다. 최신 프로젝트와 같은 비중으로 홍보하지 않고 성장 과정을 설명하는 아카이브로 유지합니다.

당시에는 MySQL 연결, 개발·테스트 profile, 간단한 React/Vite 예제와 API 호출을 한 저장소에서 연습했습니다. README에는 unit·integration 실행 방법과 API 확인 스크립트가 있지만 현재 환경에서 최신 성공 여부를 다시 검증한 기록은 없습니다.

## 현재 프로젝트와 비교해 배운 점

CRUD가 동작하는 것과 운영 가능한 서비스는 다릅니다. 이후 프로젝트에서는 스키마 마이그레이션, 인증 경계, 캐시와 메시징, CI/CD, 관측성, 부하 테스트와 복구 경로까지 구현 범위로 보게 됐습니다. 이 차이를 설명하는 성장 회고의 근거로 사용합니다.

## 공개 전 보안 정리

공개 README에 DB 자격증명 형태가 남아 있어 값의 실제 사용 여부 확인, 회전, 기본값 제거와 secret scan이 먼저 필요합니다. 이 작업이 끝나기 전에는 설정 예시를 인용하거나 상세 사용법을 블로그에 옮기지 않습니다. 추적된 의존성 같은 저장소 위생도 함께 정리할 예정입니다.
