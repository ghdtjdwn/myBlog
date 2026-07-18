---
title: "단일 노드 운영 cluster를 건드리지 않고 Cilium FQDN egress를 검증한 방법"
description: "폐기 가능한 kind lab에서 Pod identity별 toFQDNs와 Hubble drop을 증명하고, production CNI 교체는 명시적으로 보류한 보안 실험입니다."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["Cilium", "eBPF", "NetworkPolicy", "Zero Trust"]
project: ssu-platform
role: "ssuMCP FQDN egress 위협 모델, Cilium lab 설계·재현과 production 도입 gate 결정"
evidence:
  - "ssuMCP ADR-0094와 docs/cilium-fqdn-egress의 정책·전후 결과"
  - "kind Kubernetes와 Cilium·Hubble에서 수집한 endpoint enforcement와 flow verdict"
validation:
  - "backend·agent별 허용 FQDN 분리, 비허용 domain timeout과 Hubble Policy denied 확인"
  - "169.254.169.254 metadata egress 차단과 default-deny endpoint 상태 확인"
limitations:
  - "폐기 가능한 lab 결과이며 production cluster에는 Cilium을 배포하지 않음"
  - "production은 단일 노드 flannel이라 CNI 교체에 failover가 없음"
  - "DoH·DoT·고정 IP와 chaining mode의 제한은 별도 사전 검증이 필요"
featured: false
draft: false
---

## 보안 효과보다 migration 위험이 더 컸다

ssuMCP Pod는 학교 도서관, u-SAINT와 LLM provider 같은 여러 외부 목적지에 접근합니다. 침해된 Pod가 임의 C2로 데이터를 보내지 못하게 서비스별 FQDN만 허용하고 싶었습니다. 표준 Kubernetes NetworkPolicy는 IP·port에는 적합하지만 CDN 주소가 바뀌는 FQDN 계약을 직접 표현하지 못합니다.

Cilium의 `toFQDNs`는 요구와 맞았지만 production은 failover가 없는 단일 노드 k3s, flannel VXLAN 구성입니다. live node에서 CNI를 교체하다 CoreDNS나 Traefik을 잃으면 전체 서비스가 동시에 멈춥니다. 고가용성 migration 문서의 drain과 node 교체 절차도 대체 노드가 있어야 의미가 있습니다.

따라서 “보안 기능을 검증한다”와 “운영 CNI를 바꾼다”를 같은 작업으로 묶지 않았습니다.

## 폐기 가능한 cluster에서 정책의 의미를 증명했다

kind cluster에 Cilium과 Hubble을 설치하고 backend와 agent라는 두 identity를 만들었습니다. backend에는 `api.anthropic.com`, agent에는 `one.one.one.one`만 허용했습니다. policy가 Pod를 선택하는 순간 나머지 egress는 default-deny가 됩니다.

여기서 중요한 gotcha는 DNS 가시성 규칙입니다. `toFQDNs`만 선언하면 Cilium DNS proxy가 이름과 IP의 관계를 학습하지 못해 허용 대상까지 조용히 막을 수 있습니다.

```yaml
toEndpoints:
  - matchLabels:
      k8s:k8s-app: kube-dns
toPorts:
  - ports:
      - port: "53"
        protocol: ANY
    rules:
      dns:
        - matchPattern: "*"
```

DNS query를 관측하는 규칙과 실제 `toFQDNs` allowlist를 한 쌍으로 적용했습니다. [Cilium Network Policy 문서](https://docs.cilium.io/en/stable/security/policy/)의 DNS-aware 정책도 이 두 역할을 구분합니다.

## “DNS cache에 보인다”는 허용됐다는 뜻이 아니다

가시성 규칙은 차단 대상의 DNS 응답도 학습합니다. 따라서 FQDN cache에 domain이 나타난 사실만으로 정책 성공을 주장할 수 없습니다. 강제 증거는 endpoint의 egress enforcement와 실제 flow verdict입니다.

lab에서 backend의 Anthropic 연결은 FORWARDED되고 OpenAI와 `one.one.one.one`은 DROPPED됐습니다. agent에서는 반대로 `one.one.one.one`만 통과했습니다. 같은 Anthropic host가 backend에서는 허용되고 agent에서는 차단돼 Pod identity 분리도 확인했습니다. metadata 주소 `169.254.169.254` 연결은 차단됐고 Hubble에는 TCP SYN의 `Policy denied DROPPED`가 남았습니다.

## 실험 성공은 production 적용 승인이 아니다

[ADR-0094](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0094-cilium-fqdn-egress-lab-validated.md)는 결과와 함께 live cluster 무변경을 명시합니다. 향후 실제 강제가 필요하면 flannel을 유지하는 generic-veth chaining을 별도 ARM VM에서 먼저 검증하고, PolicyAuditMode로 필요한 provider subdomain을 관측한 뒤 GO 여부를 판단합니다. full CNI replacement는 단일 노드에서 선택하지 않습니다.

이 기록의 결과는 “Cilium을 production에 도입했다”가 아닙니다. 원하는 identity·FQDN 강제 효과는 재현 가능한 lab에서 얻고, rollback이 없는 운영 변경은 하지 않았다는 것입니다. 기술 선택의 깊이는 새 도구를 많이 넣는 데서가 아니라 증명할 가치와 감수할 위험을 분리하는 데서 드러났습니다.
