---
title: "암호화하지 않은 RDS를 데이터 보존하며 교체한 절차"
description: "in-place 변경이 불가능한 RDS storage encryption을 snapshot 복사·복원과 Terraform state 검증으로 수행하고 약 15분의 downtime을 검증한 기록입니다."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["RDS", "Terraform", "KMS", "Migration"]
project: geuneul
role: "Geuneul 운영 RDS 암호화 migration 계획, Terraform 적용과 데이터·application 검증"
evidence:
  - "Geuneul WORKLOG의 unencrypted snapshot, KMS encrypted copy와 replacement restore 기록"
  - "Terraform plan·state, RDS event와 migration 전후 데이터 검사"
validation:
  - "StorageEncrypted=true, backup retention 1일, deletion protection과 endpoint 계약 확인"
  - "복원 후 핵심 테이블 수량, application health와 공간 검색 결과 확인"
limitations:
  - "실제 교체에는 약 15분의 database downtime이 있었으며 무중단 migration이 아님"
  - "free-tier 제약으로 당시 backup retention은 목표 7일 대신 1일"
featured: true
draft: false
---

## storage encryption은 기존 instance에서 켤 수 없었다

Geuneul 운영 RDS는 생성 당시 storage encryption이 꺼져 있었습니다. AWS RDS는 기존 DB instance의 암호화를 in-place로 전환하지 않습니다. 암호화된 새 instance로 데이터를 옮겨야 했습니다.

application이 Terraform으로 관리되는 같은 identifier 기반 endpoint를 계속 사용해야 했기 때문에 migration을 다음 단계로 나눴습니다.

```text
원본 DB snapshot
  -> KMS로 encrypted snapshot copy
  -> Terraform이 기존 instance 교체
  -> encrypted snapshot에서 동일 identifier로 restore
  -> application·data verification
```

단순 dump/restore도 가능하지만 공간 extension, parameter와 운영 데이터의 일관된 시점을 함께 보존하려면 snapshot 경로가 더 직접적이었습니다. 대신 instance replacement와 downtime을 명시적으로 받아들였습니다.

## 삭제 보호는 한 번에 켜고 끌 수 있는 flag가 아니었다

교체할 DB에 deletion protection이 이미 켜져 있으면 Terraform은 old instance를 제거할 수 없습니다. 새 instance에는 보호가 필요하지만 교체 단계에서는 old instance의 보호를 먼저 해제해야 합니다.

그래서 적용을 두 단계로 실행했습니다.

1. 원본의 deletion protection을 해제하고 encrypted snapshot 준비 상태를 확인한다.
2. snapshot restore replacement를 수행한 뒤 새 instance에 protection을 다시 켠다.

한 번의 apply에 모든 의도를 넣으면 provider가 삭제와 보호 활성화를 동시에 만족시킬 수 없습니다. 최종 보안 상태와 migration 중간 상태를 분리한 것입니다.

backup retention도 처음에는 7일을 요청했지만 당시 free-tier 조건에서 실패했습니다. migration 자체와 retention 개선을 묶어 전체 복구를 막지 않도록 지원되는 1일로 조정하고, 7일 목표는 별도 후속 과제로 남겼습니다.

## 중단된 apply 뒤에는 cloud보다 state를 먼저 의심했다

restore 중 로컬 apply가 중단되면서 다음 plan이 이미 수행한 replacement를 다시 제안했습니다. cloud console만 보고 명령을 재실행하면 정상 instance를 또 교체할 위험이 있었습니다.

RDS의 실제 identifier·ARN·snapshot source와 Terraform state를 비교하고 refresh한 뒤 plan이 의도한 차이만 남는지 확인했습니다. “resource가 존재한다”가 아니라 IaC가 그 resource를 같은 객체로 추적하는지가 재개 조건이었습니다.

## migration 완료는 암호화 flag 하나가 아니다

교체에는 약 15분의 database downtime이 있었습니다. endpoint는 identifier 기반으로 유지됐지만 DNS와 DB readiness까지 application 연결은 실패할 수 있으므로 이 시간을 무중단으로 표현하지 않습니다.

완료 뒤 다음을 교차 확인했습니다.

- RDS `StorageEncrypted=true`와 의도한 KMS key
- automated backup retention 1일과 deletion protection 활성화
- 핵심 테이블 row count와 대표 데이터
- PostGIS extension과 실제 공간 검색
- application health 및 새 connection의 정상 query

암호화 flag만 확인하면 빈 database도 성공처럼 보일 수 있습니다. infrastructure 속성, 데이터 보존, application 소비 경계를 함께 통과해야 migration이 끝납니다.
