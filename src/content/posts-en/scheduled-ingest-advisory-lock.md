---
title: "Why a monthly ingestion job did not need a new distributed-lock service"
description: "An EventBridge Scheduler Universal Target invoking ECS, with manual and scheduled runs serialized by a PostgreSQL advisory lock held on one physical connection."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["EventBridge Scheduler", "ECS", "PostgreSQL", "Advisory Lock"]
project: geuneul
role: "Designed Geuneul's unattended ingestion orchestration, secret delivery, and batch mutual exclusion, then verified the live schedule"
evidence:
  - "Geuneul ADR-0011, Terraform scheduler, SSM and ECS definitions, and IngestBatchLock"
  - "Comparison of native ecs_parameters limitations with the ECS RunTask request shape"
validation:
  - "A real scheduled trigger with exitCode 0, fetched 3,555, upserted 3,551, and deactivated 0"
  - "Tests for two-thread lock contention, non-blocking skip behavior, and reacquisition after unlock"
limitations:
  - "Only the library source, whose upstream data changes, is currently automated"
  - "Terraform cannot statically type-check every ECS field inside the Universal Target input JSON"
  - "The SSM value passes through a sensitive Terraform variable, so state-backend access control is part of the secret boundary"
  - "The decision fits a low-frequency monthly batch and is not a substitute for a high-throughput job queue"
featured: true
draft: false
---

## The unattended boundary was harder than the ingestion logic

Geuneul already had paginated public-library collection, idempotent upsert, and soft deletion for rows missing from a new snapshot. It worked when a person supplied the service key and launched an ECS task, but a monthly schedule still needed to answer:

1. how to pass a command such as `--ingest.source=library`;
2. how to provide the data.go.kr key without an operator;
3. how to protect snapshot diffing when scheduled and manual runs overlap.

Fixed CSV sources would only reload the same release asset, so I automated only the library source whose upstream data actually changes.

## A Universal Target reused the existing RunTask contract

Terraform's templated ECS parameters for `aws_scheduler_schedule` could not express the required `overrides.containerOverrides`. Rather than add Lambda or maintain a separate “ingestion image,” I used an EventBridge Scheduler Universal Target to invoke the ECS `RunTask` API directly.

```text
Scheduler
  -> arn:aws:scheduler:::aws-sdk:ecs:runTask
  -> existing task definition
  -> containerOverrides.command
       --ingest.source=library
       --ingest.deactivate-stale=true
       --ingest.exit-after=true
```

The [AWS Scheduler target documentation](https://docs.aws.amazon.com/scheduler/latest/UserGuide/managing-targets.html) describes Universal Targets that invoke a broader set of AWS operations with API parameters. The input uses the same JSON shape as the manual `aws ecs run-task --overrides` path, so both operations share one model.

The service key follows the existing path from a sensitive Terraform variable to SSM SecureString and ECS secrets. Its value does not enter the repository or the ECS command. Terraform's `sensitive` marker hides normal display but does not prevent the value from being stored in state, so encrypted state storage and access control are part of the secret boundary.

## An advisory lock lives with a database session

Adding DynamoDB conditional writes or an SQS-based lock would create another operated component for a monthly task. The existing RDS can provide `pg_try_advisory_lock` across every `--ingest.source` entry point. Failure to acquire means another valid run is active, so the duplicate exits cleanly as a skipped run rather than triggering a false incident.

HikariCP made the implementation subtle. A session-level advisory lock belongs to a PostgreSQL backend session, not a transaction. `Connection.close()` may return the physical connection to the pool instead of ending the session. Acquiring and releasing through separate `JdbcTemplate` calls can therefore unlock a different session while the original lock leaks into the pool.

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

The same `Connection` is held from lock through unlock and only then returned. If the task crashes and the physical session ends, PostgreSQL releases the lock. This matches the session lifetime documented in the [PostgreSQL advisory-lock reference](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS).

## I enabled the schedule only after a real trigger

The schedule was created disabled, followed by a manual RunTask and schedule inspection. A real scheduled trigger later exited 0 with `fetched=3555`, `upserted=3551`, and `deactivated=0`; only then did the default become enabled. A Terraform variable remains the explicit stop control.

[ADR-0011](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0011-scheduled-public-data-sync.md) compares Lambda, a separate task definition, and external lock services. For a low-frequency batch, the smallest operable solution was not a new distributed system but a correct use of the database session already in service.
