---
title: "JNA와 ZIP 임시 파일이 있는 JVM을 read-only root filesystem으로 운영하기"
description: "쓰기 경로를 증거로 분류해 /tmp와 export PVC만 남기고, native library를 사용하는 Spring Pod의 이미지 루트를 읽기 전용으로 만든 기록입니다."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["Kubernetes", "Container Security", "JNA", "Spring Boot"]
project: ssu-platform
role: "ssuMCP runtime 쓰기 경로 감사, readOnlyRootFilesystem 설계·배포와 실제 FFI 검증"
evidence:
  - "ssuMCP ADR-0062·0066의 supply-chain hardening과 runtime write-path 조사"
  - "LMS export는 /data/lms-export PVC, JVM·JNA scratch는 /tmp를 사용한다는 코드·실행 확인"
validation:
  - "운영 container root 경로 touch 실패와 /tmp write 성공 확인"
  - "health, LMS export 경로와 인증된 rusaint JNA/FFI 호출 검증"
limitations:
  - "emptyDir /tmp는 Pod 재생성 시 사라지며 영속 데이터 용도가 아님"
  - "현재 native library와 JVM 옵션의 쓰기 경로를 대상으로 하며 의존성 변경 시 재감사 필요"
  - "root filesystem read-only는 capability·seccomp·network 정책을 대신하지 않음"
featured: false
draft: false
---

## read-only를 막은 것은 막연한 native library 불안이었다

컨테이너 이미지가 변조되거나 취약한 코드가 실행돼도 이미지 root에 파일을 남기지 못하게 `readOnlyRootFilesystem`을 적용하려 했습니다. 하지만 ssuMCP는 LMS ZIP을 만들고 JNA로 rusaint native library를 로드합니다. “어딘가에 임시 파일을 쓸 것”이라는 이유로 적용을 미뤘습니다.

보안 설정을 켜기 전에 실제 쓰기 경로를 분류했습니다.

```text
durable LMS export  -> /data/lms-export  -> PVC
JVM temporary data  -> /tmp             -> emptyDir
JNA extraction      -> /tmp             -> emptyDir
application image   -> /app, /           -> read-only
native library      -> mounted/read-only
```

LMS 산출물은 이미 PVC에 저장됐고 이미지 root에 영속 쓰기를 요구하지 않았습니다. 남은 요구는 JVM과 JNA의 runtime scratch뿐이었습니다.

## “전체 writable” 대신 필요한 mount 하나를 열었다

Pod security context에서 이미지 root를 읽기 전용으로 바꾸고 `/tmp`에 memory-backed가 아닌 일반 `emptyDir`을 mount했습니다. JVM이 다른 기본 경로를 고르지 않도록 `java.io.tmpdir=/tmp`, JNA extraction도 `jna.tmpdir=/tmp`로 명시했습니다.

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

[Kubernetes security context 문서](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)의 root filesystem 보호와 ephemeral volume을 조합하되, 애플리케이션의 실제 경로 계약을 먼저 확인한 구성입니다.

## health만으로 native 경로를 검증할 수 없다

컨테이너가 뜨고 `/health`가 200이어도 JNA가 처음 호출될 때만 library extraction이나 `dlopen` 실패가 드러날 수 있습니다. 그래서 배포 검증을 세 단계로 나눴습니다.

1. 이미지 root에서 `touch`가 실패하는지 확인한다.
2. `/tmp`에는 파일을 쓰고 지울 수 있는지 확인한다.
3. 실제 인증이 필요한 rusaint FFI 기능을 호출한다.

root 쓰기는 예상대로 거부됐고 temp write와 health는 성공했습니다. 이후 실제 인증된 native 호출까지 확인해 “기동 가능”이 아니라 “보호 설정 안에서 핵심 기능 실행 가능”을 완료 조건으로 삼았습니다.

## 쓰기 권한은 binary가 아니라 경로별 capability다

[ADR-0066](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0066-readonly-rootfs.md)은 read-only 적용을 처음 보류한 이유, 쓰기 경로 증거와 운영 검증을 남깁니다. `/tmp`는 Pod 수명에 묶여 있고 민감 영속 데이터를 둘 곳이 아닙니다. 새 native dependency나 export 방식이 들어오면 syscall·파일 경로를 다시 감사해야 합니다.

핵심은 “JVM과 JNA가 있으니 writable container가 필요하다”는 가정을 버린 것입니다. 영속 데이터, 임시 실행 파일과 이미지 코드를 서로 다른 mount와 수명으로 분리하니 공격 표면을 줄이면서 기능 계약도 보존할 수 있었습니다.
