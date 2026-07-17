---
title: "Replacing an unencrypted RDS instance without losing data"
description: "A snapshot-copy-and-restore migration for an RDS encryption setting that cannot change in place, including Terraform state recovery and 15 minutes of measured downtime."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["RDS", "Terraform", "KMS", "Migration"]
project: geuneul
role: "Planned and executed the production RDS encryption migration and verified infrastructure, data, and application state"
evidence:
  - "Geuneul WORKLOG records for the source snapshot, KMS-encrypted copy, and replacement restore"
  - "Terraform plans and state, RDS events, and before-and-after data checks"
validation:
  - "StorageEncrypted=true, one-day backup retention, deletion protection, and endpoint behavior"
  - "Core table counts, application health, and spatial search after restoration"
limitations:
  - "The replacement caused about 15 minutes of database downtime; this was not a zero-downtime migration"
  - "Free-tier constraints limited retention to one day rather than the intended seven"
featured: true
draft: false
---

## Storage encryption could not be enabled on the existing instance

Geuneul's production RDS instance had been created without storage encryption. RDS does not enable encryption in place on an existing database instance. The data had to move to an encrypted replacement.

The application needed to keep using the Terraform-managed identifier-based endpoint, so I decomposed the migration:

```text
source DB snapshot
  -> KMS-encrypted snapshot copy
  -> Terraform replaces the instance
  -> restore encrypted snapshot under the same identifier
  -> verify application and data
```

A logical dump and restore was possible, but snapshots preserved a consistent point in time together with the spatial database configuration more directly. The tradeoff was an explicit instance replacement and downtime.

## Deletion protection requires intermediate state

Terraform cannot remove an old instance while deletion protection remains enabled. The replacement still needs protection when the migration finishes, but the old instance must first permit deletion.

I therefore used two applies:

1. Disable protection on the source and confirm that the encrypted snapshot is ready.
2. Perform the snapshot-based replacement, then enable protection on the new instance.

One apply cannot make the provider both delete and protect the same old resource. The desired final security posture and the temporary migration state are separate contracts.

I initially requested seven-day backup retention, which failed under the account's free-tier conditions. I reduced it to the supported one day so a retention improvement would not block encryption, and retained seven days as follow-up work.

## After an interrupted apply, reconcile state before acting again

The local apply was interrupted during restore. The next plan proposed another replacement even though the cloud operation had already progressed. Repeating it based only on console presence could have replaced a healthy database again.

I compared the actual RDS identifier, ARN, and snapshot source with Terraform state, refreshed state, and required a new plan to contain only intended differences. “A resource exists” was insufficient; the IaC state had to track that exact object before execution resumed.

## Migration completion is larger than one encryption flag

The replacement caused approximately 15 minutes of database downtime. The identifier-based endpoint remained stable, but database readiness and DNS convergence still interrupted application connections, so I do not describe it as zero downtime.

Completion checks covered:

- RDS `StorageEncrypted=true` and the intended KMS key;
- one-day automated backup retention and active deletion protection;
- representative data and core table counts;
- the PostGIS extension and a real spatial query;
- application health and a successful query over a new connection.

An encryption flag alone could make an empty restored database look successful. Infrastructure state, retained data, and application consumption all had to agree.
