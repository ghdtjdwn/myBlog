---
title: "Running a JVM with JNA and ZIP scratch files on a read-only root filesystem"
description: "A write-path audit that reduced a writable container to explicit /tmp scratch and an export PVC, then verified the native FFI path in production."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["Kubernetes", "Container Security", "JNA", "Spring Boot"]
project: ssu-platform
role: "Audited ssuMCP runtime writes, designed and deployed readOnlyRootFilesystem, and verified the real FFI path"
evidence:
  - "The supply-chain hardening and runtime write-path investigation in ssuMCP ADR-0062 and ADR-0066"
  - "Code and runtime evidence that LMS exports use /data/lms-export while JVM and JNA scratch use /tmp"
validation:
  - "A failed touch on the container root and a successful write under /tmp in production"
  - "Health, LMS export storage, and an authenticated rusaint JNA/FFI call"
limitations:
  - "The emptyDir mounted at /tmp disappears with the Pod and is not durable storage"
  - "The audit covers the current native library and JVM options and must be repeated when dependencies change"
  - "A read-only root filesystem does not replace capability, seccomp, or network controls"
featured: false
draft: false
---

## Uncertainty about native code had blocked the control

I wanted `readOnlyRootFilesystem` so compromised code could not persist files in the container image root. ssuMCP, however, creates LMS ZIP archives and loads a rusaint native library through JNA. The vague assumption that these components must write “somewhere” delayed the change.

I replaced that assumption with a path inventory:

```text
durable LMS export  -> /data/lms-export  -> PVC
JVM temporary data  -> /tmp             -> emptyDir
JNA extraction      -> /tmp             -> emptyDir
application image   -> /app, /           -> read-only
native library      -> mounted/read-only
```

LMS output was already written to a PVC and did not require a writable image. The remaining requirement was runtime scratch for the JVM and JNA.

## I opened one required mount instead of the whole filesystem

The container root became read-only, with an `emptyDir` mounted only at `/tmp`. I set `java.io.tmpdir=/tmp` and `jna.tmpdir=/tmp` so neither runtime silently chose another default path.

```yaml
securityContext:
  readOnlyRootFilesystem: true
volumeMounts:
  - name: tmp
    mountPath: /tmp
volumes:
  - name: tmp
    emptyDir: {}
```

This combines the root-filesystem control described in the [Kubernetes security-context guide](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) with an application-specific write contract.

## Health alone could not validate the native path

A container can start and return 200 from `/health` even if JNA fails only on its first extraction or `dlopen`. I therefore used three completion checks:

1. a write to the image root must fail;
2. a temporary file under `/tmp` must succeed;
3. a real authenticated rusaint FFI function must execute.

The root write was denied, while temporary writes and health succeeded. The later authenticated native call established that the critical function—not just the Spring process—worked within the restricted filesystem.

## Write access is a path capability, not a property of the binary

[ADR-0066](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0066-readonly-rootfs.md) preserves the original deferral, path evidence, and production checks. `/tmp` remains ephemeral and unsuitable for sensitive durable data, and a new native dependency requires another path audit.

The useful change in reasoning was abandoning “JVM plus JNA requires a writable container.” Durable output, temporary execution data, and application code have different lifetimes. Giving each one an explicit mount reduced the writable attack surface without breaking the functional contract.
