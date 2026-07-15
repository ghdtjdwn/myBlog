---
title: "Why green CI left ARM64 k3s running the previous image"
description: "A delivery record that turned an AMD64-only OCI manifest into separate build, registry, Git write-back, reconciliation, and runtime gates."
publishedAt: 2026-07-15
updatedAt: 2026-07-15
category: infrastructure
activity: personal-project
tags: ["ARM64", "GitOps", "ArgoCD", "OCI"]
project: ssu-platform
role: "Owned CI image builds, GitOps wiring, and ARM64 runtime verification"
evidence:
  - "ssuMCP commit 9d37749 changes the workflow from AMD64-only to AMD64/ARM64"
  - "Commit 99630e2 gates image publication on successful verification"
  - "Deployment records separate the multi-platform manifest, Git write-back, ArgoCD, and running Pods"
validation:
  - "Confirmed that the OCI manifest contained both linux/amd64 and linux/arm64"
  - "After Image Updater write-back, ArgoCD was Synced/Healthy and both ARM64 Pods were Ready with zero restarts"
  - "Checked the running digest, health/readiness, and a non-destructive MCP smoke request in sequence"
limitations:
  - "There was no external outage, so this is not presented as a user-impacting incident"
  - "A delivery case on a single Oracle ARM64 k3s node, not a high-availability cluster test"
  - "Registry, cluster, and credential identifiers remain private"
featured: true
draft: false
---

## The missing step between green CI and delivery

ssuMCP tests and the image push succeeded, but the application on ARM64 k3s kept running the previous image. There was no service outage: the existing Pods continued serving requests while the new artifact failed to reach the runtime.

The new tag pointed only to a `linux/amd64` image. A tag existing in the registry and a green CI run did not prove that an ARM64 node could execute it.

The workflow configured QEMU for AMD64 and passed only `linux/amd64` to Buildx. [Commit 9d37749](https://github.com/ghdtjdwn/ssuMCP/commit/9d37749dd1d64dce24fd39ba1e3643e41a700629) changed both boundaries.

```yaml
- name: Set up QEMU (ARM64 emulation)
  with:
    platforms: arm64

- name: Build and push (linux/amd64, linux/arm64)
  with:
    platforms: linux/amd64,linux/arm64
```

## Treat delivery as five contracts

After the fix, I stopped treating deployment as one boolean state.

```text
1. Build       Did tests and packaging complete?
2. Registry    Does the OCI manifest include the target architecture?
3. Write-back  Did Image Updater write an immutable SHA to Git?
4. Reconcile   Did ArgoCD make that Git revision Synced and Healthy?
5. Runtime     Do the running digest and an actual request prove the version?
```

Each gate can succeed while the next fails. Tests do not validate packaging architecture. A correct manifest does not prove that Image Updater considered it. A Git change does not guarantee reconciliation, and `Synced` alone does not verify the process response.

The current CI also publishes a deployment candidate only after the test and coverage gate succeeds. Packaging used to run independently, which could make failed code an automatic rollout candidate. [Commit 99630e2](https://github.com/ghdtjdwn/ssuMCP/commit/99630e2) added that dependency.

## Inspect manifests and digests, not tag names

I did not stop at a `latest` or `sha-*` string. Verification first checked that the OCI index contained `linux/amd64` and `linux/arm64`, then followed the immutable SHA through Image Updater write-back, ArgoCD state, and the digest running on the ARM64 node.

The final check found both backend Pods Ready with zero restarts and verified health, readiness, and a non-destructive MCP initialization request. Raw Pod names, registry coordinates, Secret names, and logs are intentionally excluded from the public article.

## Keep similar-looking incidents separate

A separate GitOps drift appeared after a GitHub owner change left an old container coordinate behind. That was not the architecture mismatch. One problem was whether the OCI artifact could run on ARM64; the other was which registry coordinate a controller observed.

Combining both as “ArgoCD was slow” would erase the distinct prevention. This article stays scoped to the AMD64-only manifest and the delivery gates; owner drift remains a separate source record.

## What this does not prove

The environment is a single Oracle ARM64 node. Two Pods starting on the corrected digest do not demonstrate high availability against node loss. There was no external outage, so I do not inflate this into a user-impacting incident.

The reusable result is a completion contract: delivery ends only when manifest, Git, controller, runtime, and request evidence line up—not when one CI badge turns green.
