---
title: "월 1회 수집에 분산락 서비스를 만들지 않은 이유"
description: "EventBridge Scheduler Universal Target으로 ECS task를 실행하고, 같은 physical connection의 PostgreSQL advisory lock으로 수동·자동 수집을 직렬화한 기록입니다."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["EventBridge Scheduler", "ECS", "PostgreSQL", "Advisory Lock"]
project: geuneul
role: "그늘 공공데이터 무인 수집 orchestration, secret 배선과 batch 상호배제 설계·운영 검증"
evidence:
  - "그늘 ADR-0011, Terraform scheduler·SSM·ECS task definition과 IngestBatchLock"
  - "네이티브 ecs_parameters의 container override 제한과 ECS RunTask API shape 대조"
validation:
  - "실제 Scheduler trigger의 exitCode 0, fetched 3555, upserted 3551, deactivated 0"
  - "두 실행 thread의 lock 경쟁, 논블로킹 skip과 unlock 뒤 재획득 테스트"
limitations:
  - "현재 자동 대상은 원본이 갱신되는 library source 한 개"
  - "Universal Target input JSON은 Terraform이 ECS field를 정적으로 type-check하지 못함"
  - "SSM value가 sensitive Terraform variable을 거치므로 state backend 접근 통제도 비밀 경계"
  - "월 1회 저빈도 batch에 맞춘 결정이며 고빈도 job queue를 대신하지 않음"
featured: true
draft: false
---

## 이미 있는 수집 로직보다 무인 실행 경계가 어려웠다

그늘의 공공도서관 수집은 pagination, 멱등 upsert와 snapshot에서 사라진 row의 soft delete까지 구현돼 있었습니다. 사람이 local environment에서 service key를 넣고 ECS task를 실행할 때는 동작했지만 월간 스케줄에는 세 문제가 남았습니다.

1. `--ingest.source=library` 같은 container command override를 Scheduler가 어떻게 전달할 것인가
2. 사람이 없는 task에 data.go.kr key를 어떻게 안전하게 넣을 것인가
3. Scheduler와 수동 실행이 겹칠 때 snapshot diff를 어떻게 보호할 것인가

고정 CSV source는 같은 asset을 다시 읽을 뿐이어서 자동화하지 않고, upstream 원본 자체가 바뀌는 library만 월간 대상으로 골랐습니다.

## Universal Target이 기존 RunTask 계약을 재사용했다

Terraform `aws_scheduler_schedule`의 templated ECS parameter는 필요한 `overrides.containerOverrides`를 표현하지 못했습니다. 별도 Lambda나 “수집 전용 image”를 만들지 않고 EventBridge Scheduler Universal Target으로 ECS `RunTask` API를 직접 호출했습니다.

```text
Scheduler
  -> arn:aws:scheduler:::aws-sdk:ecs:runTask
  -> existing task definition
  -> containerOverrides.command
       --ingest.source=library
       --ingest.deactivate-stale=true
       --ingest.exit-after=true
```

[AWS 문서](https://docs.aws.amazon.com/scheduler/latest/UserGuide/managing-targets.html)의 Universal Target은 더 넓은 AWS API operation과 요청 parameter를 전달합니다. 수동 `aws ecs run-task --overrides`와 같은 JSON shape를 사용해 두 실행 경로의 정신모델도 맞췄습니다.

service key는 sensitive Terraform variable에서 SSM SecureString을 만들고 ECS secrets로 task에 주입하는 기존 경로를 재사용했습니다. 값은 저장소와 ECS command에 넣지 않지만, Terraform의 `sensitive` 표시는 화면 출력을 가릴 뿐 state 저장을 막지 않습니다. 따라서 암호화된 state backend와 접근 권한도 이 비밀의 보안 경계에 포함됩니다.

## advisory lock은 DB 세션과 함께 살아 있다

동시 실행을 막기 위해 DynamoDB 조건부 쓰기나 SQS lock service를 추가하면 월 1회 작업에 새로운 운영 면적이 생깁니다. 이미 정본 RDS가 있으므로 `pg_try_advisory_lock`을 모든 `--ingest.source` 진입점에 적용했습니다. 획득 실패는 중복 작업이 이미 진행 중이라는 뜻이라 error alert 대신 exit 0 skip으로 처리합니다.

구현에서 가장 중요한 부분은 HikariCP였습니다. session-level advisory lock은 transaction이 아니라 PostgreSQL backend session에 묶입니다. `Connection.close()`는 physical connection을 끊지 않고 pool에 반환할 수 있습니다. lock과 unlock을 서로 다른 `JdbcTemplate` 호출로 수행하면 다른 session에서 unlock을 시도하고 원래 lock이 pool에 남을 수 있습니다.

```java
try (Connection connection = dataSource.getConnection()) {
    if (!tryLock(connection, key)) return SKIPPED;
    try {
        runIngestion();
    } finally {
        unlock(connection, key);
    }
}
```

같은 `Connection` 객체를 lock부터 unlock까지 유지한 뒤에만 pool에 돌려줍니다. task가 crash해 physical session이 끊기면 PostgreSQL이 lock을 정리합니다. [PostgreSQL 문서](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)의 session-level 수명과 일치하는 구현입니다.

## 비활성 상태에서 실제 trigger까지 단계적으로 열었다

처음 schedule을 disabled로 생성하고 수동 RunTask와 조회 결과를 확인했습니다. 이후 실제 정기 trigger에서 `exitCode=0`, `fetched=3555`, `upserted=3551`, `deactivated=0`을 확인한 뒤 기본 활성으로 승격했습니다. 필요하면 Terraform 변수로 다시 명시적으로 중지할 수 있습니다.

[ADR-0011](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0011-scheduled-public-data-sync.md)은 Lambda, 별도 task definition과 외부 lock 대안을 비교합니다. 저빈도 batch에서는 새 분산 시스템보다 기존 DB의 올바른 세션 계약을 사용하는 것이 더 작고 운영 가능한 해법이었습니다.
