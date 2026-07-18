---
title: "API 한 번이 upstream 여섯 번이면 rate limit의 단위는 무엇이어야 하나"
description: "정상 좌석 탐색도 429로 막던 제한을 논리 요청이 아닌 실제 upstream fan-out과 사용자 공정성 기준으로 다시 설계한 기록입니다."
publishedAt: 2026-07-18
category: backend
activity: personal-project
tags: ["Rate Limiting", "Redis", "Redisson", "Resilience"]
project: ssu-platform
role: "ssuMCP 도서관 read/write 제한 분리, multi-pod 이중 cap과 설정 변경 계약 설계·검증"
evidence:
  - "ssuMCP ADR-0077·0080·0085·0093·0097의 fan-out, single-flight와 429 분석"
  - "열람실 전체 탐색 한 건이 room read 여섯 건을 만드는 실제 호출 그래프"
validation:
  - "정상 여섯 read 통과, 과거 2/s cap 실패와 write 2/1 cap 유지 회귀 테스트"
  - "rate를 바꾼 새 Redis key가 Redis reset 없이 새 설정을 적용하는 통합 테스트"
limitations:
  - "20/s cluster·8/s user 값은 현재 여섯-room fan-out과 upstream 관측에 맞춘 값"
  - "Redisson rate limiter는 엄격한 공정 순서를 보장하지 않음"
  - "upstream의 장기 quota나 정책 변경에는 별도 재산정이 필요"
featured: true
draft: false
---

## 사용자는 한 번 눌렀지만 upstream은 여섯 번 호출됐다

“빈 좌석 아무거나 찾아 줘”는 하나의 논리 요청입니다. 그러나 서비스는 여섯 열람실의 최신 상태를 각각 읽어 비교합니다. 초기 제한은 사용자당 초당 2회였고, 요청의 세 번째 room read부터 우리 rate limiter가 429를 반환했습니다. 악성 burst를 막으려던 보호 장치가 정상 기능 자체를 불가능하게 만든 셈입니다.

```text
1 user request
  -> room A read
  -> room B read
  -> room C read  x old 2/s cap
  -> room D read
  -> room E read
  -> room F read
```

처음에는 cache나 single-flight만 강화하면 된다고 생각했습니다. 동일 키 동시 요청은 합칠 수 있지만 서로 다른 room key 여섯 개는 합쳐지지 않습니다. rate limit의 소비 단위가 실제 호출 그래프와 맞지 않는 문제가 남았습니다.

## read와 write는 같은 위험 예산을 쓰지 않는다

좌석 조회는 정상 기능 하나가 fan-out을 일으키며 실패해도 상태를 바꾸지 않습니다. 예약 write는 한 건이 외부 상태를 바꾸고 burst의 위험이 더 큽니다. 하나의 숫자로 두 경로를 묶지 않고 다음처럼 분리했습니다.

```text
read:  cluster 20/s, user 8/s
write: cluster 2/s,  user 1/s
```

read user cap 8은 여섯 room 조회와 소량의 여유를 허용합니다. write 제한은 기존의 보수적인 값에 유지했습니다. 숫자를 크게 만든 것이 아니라 작업 한 건의 실제 cost와 부작용에 따라 예산을 나눈 것입니다.

## 공정성 cap을 먼저 소비한다

multi-pod 환경에서는 한 사용자 cap과 전체 cluster cap을 Redis에 공유합니다. 검사 순서도 의미가 있습니다. cluster permit을 먼저 소비하고 나서 user cap에서 거절하면 과도한 사용자 요청이 실제 upstream으로 가지 않았는데도 전체 예산을 고갈시킬 수 있습니다.

그래서 user cap을 먼저 획득하고 통과한 요청만 cluster cap을 소비합니다. 두 permit을 완전히 원자적으로 rollback하는 구조는 아니지만, 한 사용자의 거절 요청이 다른 사용자의 cluster budget을 먼저 태우는 실패를 피했습니다. 이 trade-off와 엄격한 fairness 미보장은 문서에 남겼습니다.

## 설정 값을 바꿔도 Redis의 limiter는 그대로였다

운영 값을 조정한 뒤에도 과거 cap이 남는 두 번째 문제가 있었습니다. Redisson의 `trySetRate`는 limiter가 이미 설정돼 있으면 새 값을 덮어쓰지 않습니다. 배포 설정은 8/s인데 Redis key는 2/s인 drift가 생길 수 있었습니다.

[Redisson 문서](https://redisson.pro/docs/data-and-services/objects/#ratelimiter)는 `trySetRate`가 최초 설정에만 성공한다고 명시합니다. limiter key에 rate version을 포함하고 유휴 TTL을 두었습니다.

```text
library:read:user:{id}:r8
library:read:cluster:r20
```

설정 변경은 새 key를 사용해 즉시 적용되고, 과거 key는 TTL 뒤 사라집니다. 매 요청 `setRate`로 공유 상태를 덮어쓰거나 운영 중 key를 수동 삭제하는 대안보다 배포와 상태의 관계가 명시적입니다.

## 429는 보호 성공이면서 제품 실패일 수 있다

[ADR-0097](https://github.com/ghdtjdwn/ssuMCP/blob/main/docs/adr/0097-pyxis-read-cap-fanout-sizing.md)을 포함한 기록은 여섯 read가 통과하고 일곱·여덟 번째 여유를 가진다는 테스트, write cap 불변과 설정 변경 적용을 고정합니다. upstream 429의 `Retry-After`도 가능한 범위에서 보존합니다.

rate limiter가 요청을 거절했다는 사실만 보면 정상 동작입니다. 그러나 거절한 요청이 제품의 기본 사용 시나리오라면 용량 모델이 틀린 것입니다. 제한 값은 endpoint 개수가 아니라 한 사용자 행동이 만드는 실제 fan-out, 읽기·쓰기의 위험과 multi-tenant 공정성에서 출발해야 했습니다.
