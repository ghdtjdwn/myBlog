---
title: "CloudFront가 앞에 있어도 public ALB를 닫아야 했던 이유"
description: "BFF를 먼저 HTTPS entry로 전환한 뒤 AWS 관리형 origin-facing prefix list로 ALB 직접 HTTP 우회 경로를 무중단 차단한 기록입니다."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["CloudFront", "ALB", "AWS", "Network Security"]
project: geuneul
role: "그늘 BFF origin 전환, ALB security group 최소 변경과 공개 경로 검증"
evidence:
  - "그늘 ADR-0028과 Terraform CloudFront·ALB security group 변경"
  - "캐시 비활성, 전체 method·header 전달과 security group replacement 위험 사전 확인"
validation:
  - "ALB DNS 직접 연결 timeout과 CloudFront HTTPS·애플리케이션 BFF 200 확인"
  - "ingress rule만 in-place 적용하는 동안 서비스 중단 없음 확인"
limitations:
  - "CloudFront origin-facing prefix list는 모든 CloudFront distribution의 origin server 범위를 허용"
  - "CloudFront에서 ALB origin으로 가는 마지막 hop은 현재 HTTP이며 SG 격리로 노출을 줄임"
  - "캐시 비활성이라 보안 경계 외의 성능 가속 효과는 기대하지 않음"
featured: false
draft: false
---

## 앞단 HTTPS가 origin 직접 노출을 자동으로 없애지는 않는다

그늘은 CloudFront 기본 domain으로 브라우저 HTTPS를 제공했지만 ALB security group의 80번 port는 `0.0.0.0/0`에 열려 있었습니다. 사용자는 CloudFront의 HTTP→HTTPS redirect를 보지만 ALB DNS를 알면 평문 HTTP로 backend를 직접 호출할 수 있었습니다.

Vercel BFF도 ALB의 HTTP URL을 직접 사용했습니다. ALB를 먼저 닫으면 BFF가 함께 차단되므로 작업 순서 자체가 availability 계약이었습니다.

```text
before
browser -> CloudFront HTTPS -> ALB HTTP
BFF -----------------------> ALB HTTP
internet ------------------> ALB HTTP
```

## consumer를 옮긴 뒤 ingress를 좁혔다

먼저 BFF의 API base를 CloudFront HTTPS domain으로 변경하고 실제 login·write·spatial query를 확인했습니다. CloudFront는 `Managed-CachingDisabled`를 사용하고 모든 HTTP method, query와 Authorization header를 origin에 전달하므로 개인화 응답과 쓰기 API가 cache되거나 잘리지 않았습니다.

그 뒤 ALB port 80 ingress source를 AWS 관리형 `com.amazonaws.global.cloudfront.origin-facing` prefix list로 바꿨습니다. AWS가 origin-facing edge address를 유지하므로 변하는 CIDR을 직접 관리하지 않습니다. [CloudFront 문서](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/LocationsOfEdgeServers.html)는 이 prefix list로 origin을 CloudFront source에 제한할 수 있다고 설명합니다.

이 목록은 내 distribution 하나만 식별하는 것은 아닙니다. 모든 CloudFront origin-facing server가 network level에서 올 수 있고 host·application 검증은 계속 필요합니다. 그래도 임의 인터넷 host의 직접 접근과 평문 우회 경로는 제거합니다.

## 정확한 설명을 위해 마지막 HTTP hop을 숨기지 않는다

브라우저와 BFF는 이제 CloudFront까지 HTTPS를 사용합니다. 현재 CloudFront→ALB origin port는 80이므로 종단 간 TLS라고 주장하지 않습니다. 대신 이 HTTP hop의 source를 AWS 관리형 CloudFront origin network로 제한했습니다. custom domain과 ACM을 갖춘다면 ALB 443 또는 VPC origin을 다음 보안 단계로 검토할 수 있습니다.

또한 security group `description`은 immutable이어서 문구까지 고치면 SG replacement와 ALB detach 위험이 있었습니다. 설명 문자열은 유지하고 ingress rule만 in-place 변경했습니다. 문서 미관을 위해 live resource를 교체하지 않았습니다.

## 우회 실패와 정상 경로를 한 쌍으로 검증했다

적용 후 ALB DNS의 직접 HTTP는 connection timeout이 났고, CloudFront HTTPS와 BFF 요청은 200을 유지했습니다. BFF가 CloudFront를 경유하면서 hop이 하나 늘었고, 캐시를 비활성화했으므로 모든 요청이 그 경로 비용을 지불해 수십 ms 지연이 생겼습니다. 당시 약 1.4초 공간 검색 p95에 비해 수용 가능한 비용이었습니다.

[ADR-0028](https://github.com/ghdtjdwn/geuneul/blob/main/docs/adr/0028-alb-cloudfront-origin-lockdown.md)은 전환 순서와 기각한 443·SG replacement 대안을 남깁니다.

CDN을 architecture diagram 앞에 그렸다는 사실만으로 backend가 CDN 뒤에 격리되는 것은 아닙니다. 모든 consumer를 새 진입점으로 먼저 옮기고, origin의 network policy를 좁힌 뒤 정상 경로와 우회 경로를 함께 검증해야 실제 보안 경계가 됩니다.
