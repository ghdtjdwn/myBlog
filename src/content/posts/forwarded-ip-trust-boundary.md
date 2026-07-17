---
title: "X-Forwarded-For의 첫 IP를 믿자 rate limit이 무력화됐다"
description: "ALB·BFF를 지나는 client IP 신뢰 경계를 재설계하고, 공격자가 만든 key로 rate limiter map이 무한히 커지던 문제까지 막은 기록입니다."
publishedAt: 2026-07-17
category: troubleshooting
activity: personal-project
tags: ["Security", "Rate Limiting", "HTTP", "Memory Safety"]
project: geuneul
role: "Geuneul client IP resolver 신뢰 모델과 bounded in-memory rate limiter 설계·검증"
evidence:
  - "Geuneul TROUBLESHOOTING의 X-Forwarded-For spoofing과 bucket eviction 장애 기록"
  - "ALB append 동작, BFF 전용 header 계약과 rate limiter 구현·테스트"
validation:
  - "trusted BFF, direct ALB, malformed·multi-hop header를 포함한 resolver 7개 테스트"
  - "50,000개 서로 다른 공격 key 입력 뒤 map 상한 유지 테스트와 운영 header-fixed 경로 확인"
limitations:
  - "in-memory limiter는 인스턴스별 근사치이며 여러 ECS task 사이에 quota를 공유하지 않음"
  - "상한 도달 시 map 정리는 메모리를 지키는 대신 일부 정상 client의 짧은 history를 잃음"
featured: true
draft: false
---

## proxy header는 누가 썼는지 모르면 사용자 입력이다

Geuneul API는 IP별 rate limit을 위해 `X-Forwarded-For`의 첫 번째 값을 client IP로 사용했습니다. 일반적인 예제에서 자주 보이는 방식이지만 실제 경로는 browser, BFF, ALB, backend였습니다.

ALB는 자신이 본 peer address를 header의 오른쪽에 append합니다. 외부 사용자가 임의의 왼쪽 값을 넣어 직접 요청하면 첫 번째 값은 공격자가 고른 문자열이고, 오른쪽 끝에 ALB가 본 실제 source가 붙습니다. 공격자는 왼쪽 값을 매 요청 회전시켜 IP bucket을 계속 새로 만들 수 있었습니다.

```text
attacker header: X-Forwarded-For: fake-1
ALB result     : X-Forwarded-For: fake-1, observed-source
old resolver   : fake-1
```

header 위치만으로 trusted hop을 추론한 것이 문제였습니다. forwarded header는 신뢰할 proxy가 작성했다는 별도 증거가 없으면 사용자 입력과 같습니다.

## BFF 경로와 direct 경로의 계약을 분리했다

BFF는 browser의 실제 client address를 알고 있으므로 별도 `X-Client-Ip`를 보냅니다. backend는 BFF와 공유한 secret 검증을 통과한 요청에서만 이 header를 신뢰합니다. secret 값은 코드나 log에 남기지 않고 deployment secret으로 주입합니다.

그 증거가 없는 direct ALB 요청에서는 `X-Forwarded-For`의 오른쪽 끝, 즉 ALB가 append한 address만 사용합니다. malformed token, 예상하지 못한 multi-hop, IPv4·IPv6 표현도 하나의 resolver에서 정규화합니다.

이 구조는 “왼쪽이 진짜”나 “오른쪽이 진짜” 같은 위치 규칙을 버리고, 어떤 proxy가 어떤 증명 아래 값을 쓸 수 있는지를 contract로 만듭니다.

## spoofing은 메모리 장애로도 이어졌다

rate limiter는 client key별 bucket을 in-memory map에 보관했습니다. 정리 코드는 오래된 bucket을 삭제했지만, 공격자가 매번 새 key를 보내면 모든 bucket이 아직 최신이라 eviction은 아무것도 지우지 못했습니다. rate limit 우회와 동시에 map이 무한히 커질 수 있었습니다.

시간 기반 정리에 더해 hard capacity를 두고, 상한에 도달하면 map을 비워 memory를 먼저 보호하도록 했습니다. 정교한 LRU보다 거친 정책이지만 이 limiter는 보안의 유일한 경계가 아니라 instance-local 완충 장치입니다. OOM으로 전체 service를 잃는 것보다 일부 짧은 rate history를 잃는 편이 안전했습니다.

## adversarial input을 검증 기준으로 삼았다

resolver에는 trusted BFF, secret 누락·불일치, direct ALB, 조작된 leftmost, malformed·multi-hop을 포함한 7개 테스트를 두었습니다. limiter에는 50,000개의 서로 다른 key를 넣어도 map이 정한 상한을 넘지 않는 회귀를 추가했습니다.

운영에서는 header 고정 조건에서 실제 요청이 같은 client bucket으로 귀속되는 것을 확인했습니다. 다만 sandbox에서 source address를 자유롭게 바꿀 수 없어 “공격자가 임의 IP에서 직접 회전했다”는 운영 실험까지 했다고 주장하지 않습니다.

이 limiter는 ECS 인스턴스마다 독립적이므로 엄밀한 global quota도 아닙니다. 강한 전역 제한이 필요해지면 shared store나 edge enforcement가 필요합니다. 여기서 해결한 것은 신뢰할 수 없는 key가 인증 없이 제한과 memory 상한을 동시에 깨는 구조였습니다.
