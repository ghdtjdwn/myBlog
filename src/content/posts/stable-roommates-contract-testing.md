---
title: "복제된 점수 규칙과 Stable Roommates를 계약 테스트로 지킨 방법"
description: "FE·BE가 병렬 개발한 생활 습관 점수를 같은 fixture로 묶고, 매칭 알고리즘은 작은 brute-force oracle과 비교한 팀 프로젝트 검증 기록입니다."
publishedAt: 2026-07-17
category: engineering
activity: team-project
tags: ["Stable Roommates", "Contract Testing", "Next.js", "Spring Boot"]
project: cham-domi
role: "프론트엔드 전체와 roommate 백엔드의 점수·Stable Roommates·게시글·채팅 구현"
evidence:
  - "팀 역할·API 계약 문서와 FE·BE의 동일 생활 습관 fixture"
  - "Stable Roommates 구현과 작은 입력을 전수 탐색하는 brute-force oracle"
validation:
  - "FE Vitest 9개, BE 순수 JUnit 점수 테스트와 대표 100·89점 parity"
  - "n=4와 n=6에서 각각 400개 무작위 선호 입력을 brute-force oracle과 대조"
limitations:
  - "인증과 기숙사 자격 판정은 팀원 소유이며 이 글의 구현 범위가 아님"
  - "실제 인증 통합, CI, 공개 배포와 사용자 운영 검증은 아직 없음"
  - "점수 규칙이 공용 package가 아니라 양쪽에 복제돼 contract test가 사라지면 drift할 수 있음"
featured: true
draft: false
---

## 병렬 개발은 같은 문서를 읽는 것만으로 정합성을 보장하지 않는다

Cham Domi는 생활 습관이 맞는 기숙사 룸메이트를 찾는 팀 프로토타입입니다. 저는 Next.js 프론트엔드 전체와 Spring Boot의 roommate 도메인을 맡았습니다. 인증과 기숙사 자격 판정은 팀원의 범위였습니다.

백엔드가 준비되기 전에도 화면 개발을 진행하기 위해 data access를 mock·real API adapter 뒤에 뒀습니다. 이 방식은 속도를 높였지만 생활 습관 점수를 FE에서도 즉시 보여주고 BE에서도 최종 계산하면서 같은 규칙이 두 언어에 복제됐습니다.

공용 문서에 weight를 적어두는 것만으로는 충분하지 않았습니다. 한쪽이 dealbreaker나 rounding을 수정하면 두 결과가 조용히 달라질 수 있습니다. 그래서 문서보다 실행 가능한 fixture를 계약으로 만들었습니다.

## 같은 입력이 같은 점수와 이유를 내야 한다

fixture에는 각 생활 습관 응답, 항목 weight, dealbreaker와 기대 총점을 넣었습니다. FE Vitest와 BE JUnit가 같은 의미의 case를 각각 실행합니다. 완전 일치 100점과 일부 차이가 있는 89점 같은 대표 입력뿐 아니라 weight 합, 경계값과 dealbreaker를 함께 검사했습니다.

```text
shared semantic fixture
  ├─ TypeScript score -> UI preview
  └─ Java score       -> persisted matching decision
       both: score + dealbreaker outcome
```

단순히 최종 숫자만 맞추면 서로 다른 버그가 우연히 상쇄될 수 있습니다. 항목별 contribution과 dealbreaker 판정도 확인해 어느 규칙이 달라졌는지 찾을 수 있게 했습니다.

장기적으로는 schema에서 양쪽 구현을 생성하거나 하나의 backend 계산을 유일한 source로 만드는 편이 더 강합니다. 프로토타입 단계에서는 배포 경계를 늘리지 않고 contract fixture로 drift를 감시하는 비용을 선택했습니다.

## 알고리즘 테스트의 답을 같은 알고리즘으로 만들지 않는다

점수를 이용해 각 사용자의 선호 순위를 만든 뒤 Stable Roommates 알고리즘으로 짝을 찾습니다. 예시 몇 개만 통과하면 특정 proposal·rotation 순서의 edge case를 놓칠 수 있습니다. 반대로 production algorithm과 비슷한 최적화 구현을 test oracle로 쓰면 같은 오해를 복제할 수 있습니다.

작은 짝수 `n`에서는 가능한 perfect matching을 전수 열거하고 각 matching에 blocking pair가 있는지 검사하는 brute-force oracle을 만들었습니다. 느리지만 `n=4`, `n=6`에서는 충분히 작고 production 구현과 사고방식이 다릅니다.

각 크기에서 400개의 무작위 preference profile을 생성해 다음을 비교했습니다.

- algorithm이 안정 matching을 반환했다면 oracle 기준 blocking pair가 없는가
- algorithm이 해가 없다고 했다면 oracle도 stable matching을 찾지 못하는가
- 모든 참가자가 정확히 한 번 배정되고 self·중복 pair가 없는가

무작위 test는 재현 가능한 seed를 남겨 실패 입력을 고정 case로 승격할 수 있게 했습니다.

## 검증된 범위와 팀 경계를 함께 공개한다

FE에는 9개 Vitest, BE에는 순수 점수 JUnit와 H2 기반 domain test가 있습니다. Playwright로 mock adapter를 사용한 화면 흐름도 확인했습니다. 하지만 실제 팀 인증과 연결된 end-to-end, CI, 공개 배포와 운영 사용자는 없습니다.

이 결과를 운영 안정성으로 표현하지 않는 이유입니다. 또한 인증·기숙사 자격 로직은 제가 구현한 일이 아닙니다. 이 글이 보여주는 범위는 제가 소유한 FE와 roommate 도메인에서, 복제 계약과 비자명한 매칭 알고리즘을 서로 다른 oracle로 검증한 과정입니다.
