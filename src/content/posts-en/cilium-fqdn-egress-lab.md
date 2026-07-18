---
title: "Validating Cilium FQDN egress without touching a single-node production cluster"
description: "A disposable kind lab that proved identity-specific toFQDNs and Hubble drops while keeping the risky production CNI migration behind an explicit gate."
publishedAt: 2026-07-18
category: infrastructure
activity: personal-project
tags: ["Cilium", "eBPF", "NetworkPolicy", "Zero Trust"]
project: ssu-platform
role: "Defined the FQDN-egress threat model, built the reproducible Cilium lab, and set the production adoption gate"
evidence:
  - "The policy and before/after results in ssuMCP ADR-0094 and docs/cilium-fqdn-egress"
  - "Endpoint enforcement state and Hubble flow verdicts collected from kind with Cilium"
validation:
  - "Identity-specific allowed FQDNs, timeouts for denied domains, and Hubble Policy denied flows"
  - "Blocked metadata egress to 169.254.169.254 and confirmed default-deny endpoint state"
limitations:
  - "This is a disposable-lab result; Cilium is not deployed in the production cluster"
  - "Production is a single flannel node with no failover during a CNI migration"
  - "DoH, DoT, fixed IPs, and CNI-chaining limitations require separate pre-production validation"
featured: false
draft: false
---

## Migration risk exceeded the immediate security benefit

ssuMCP Pods call several external destinations, including university systems and LLM providers. I wanted each workload to reach only its required FQDNs so a compromised Pod could not exfiltrate data to an arbitrary command-and-control host. Standard Kubernetes NetworkPolicy works with IPs and ports but cannot directly express a changing CDN-backed hostname contract.

Cilium `toFQDNs` matched the requirement. Production, however, is a single-node k3s cluster using flannel VXLAN with no failover. Replacing the live CNI could remove CoreDNS or Traefik and stop every service at once. High-availability migration procedures based on draining one node are not available when there is no second node.

I therefore separated “prove the security mechanism” from “migrate the production CNI.”

## A disposable cluster proved the policy semantics

I installed Cilium and Hubble on kind and created two workload identities, backend and agent. Backend could reach `api.anthropic.com`; agent could reach `one.one.one.one`. Once selected by an egress policy, each Pod became default-deny for all other destinations.

The critical detail was DNS visibility. A bare `toFQDNs` rule can fail to populate Cilium's name-to-IP view and silently blackhole an allowed host. I paired the allowlist with DNS-proxy visibility:

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

The [Cilium network-policy documentation](https://docs.cilium.io/en/stable/security/policy/) likewise distinguishes observing DNS queries from enforcing the eventual FQDN allowlist.

## Appearing in the DNS cache does not mean being allowed

The visibility rule also learns answers for denied domains. A cache entry is therefore not evidence that traffic passed. I used endpoint enforcement state and actual flow verdicts as the proof.

Backend reached Anthropic while OpenAI and `one.one.one.one` were dropped. Agent showed the inverse result for `one.one.one.one`, and the same Anthropic hostname was allowed for backend but denied for agent, proving identity separation. The metadata address `169.254.169.254` was denied, and Hubble recorded the TCP SYN as `Policy denied DROPPED`.

## A successful experiment is not production approval

[ADR-0094](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0094-cilium-fqdn-egress-lab-validated.md) explicitly records that production remained unchanged. If enforcement becomes necessary, generic-veth chaining over flannel must first be tested on a disposable ARM VM, followed by audit-mode observation of required provider subdomains. A full CNI replacement remains rejected on the single node.

The result is not “Cilium runs in production.” It is a reproducible demonstration of the desired identity and FQDN boundary without taking an unrecoverable operational risk. The engineering value came from separating what needed to be proven from what was safe to change.
