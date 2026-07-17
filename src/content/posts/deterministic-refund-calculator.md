---
title: "환불 규정은 LLM이 읽고 금액은 코드가 계산하게 한 이유"
description: "자연어 취소 규정을 근거 구간으로 구조화하되 적용 구간·수수료·환불액은 결정론 엔진이 계산하고 애매하면 중단한 설계입니다."
publishedAt: 2026-07-17
category: ai-systems
activity: other
tags: ["LLM", "Rule Engine", "Validation", "Travel"]
project: axwar-refund
role: "취소 규정 parser 계약, quote·구간 validator와 결정론 환불 계산 plugin 개인 설계·구현·검증"
evidence:
  - "비공개 제출물의 환불 규정 golden fixture와 source quote mapping"
  - "구간 coverage, 경계일, 모호성 차단과 금액 계산 테스트"
validation:
  - "golden case 10/10과 source quote 14개 실존 검증"
  - "구간 공백·중첩, 기준일 누락과 지원하지 않는 규정이 blocking exit로 끝나는지 확인"
limitations:
  - "해외여행 패키지 규정만 대상으로 하며 영업일·시간대·복합 프로모션을 계산하지 않음"
  - "공정위 기준은 비교 정보일 뿐 법률 판단이나 실제 사업자 승인 결과가 아님"
featured: true
draft: false
---

## 자연어 이해와 돈 계산은 같은 신뢰 경계를 가져서는 안 된다

여행 취소 규정은 “출발 10일 전까지”, “당일 취소”, “영업일 기준”처럼 문장으로 쓰입니다. LLM은 문장을 구조화하는 데 유용하지만 최종 환불액까지 생성하게 하면 같은 입력에서 숫자가 달라지거나 존재하지 않는 규정을 보완할 수 있습니다.

pipeline을 해석과 계산으로 분리했습니다.

```text
원문 규정
 -> LLM: 적용 구간·수수료 후보 + 원문 quote
 -> validator: quote 실존·구간 coverage·모호성
 -> deterministic engine: 기준일·경계·금액 계산
 -> 근거와 함께 결과 출력
```

LLM output은 답이 아니라 검증 전 중간 표현입니다. 각 rule에는 원문 quote와 위치가 필요하고 validator를 통과해야 계산기에 들어갑니다.

## 문장이 아니라 interval을 검증한다

“7일 전” 같은 표현은 포함 여부에 따라 금액이 바뀝니다. 내부 표현은 각 구간의 시작·끝, inclusive 여부, fee type과 value를 명시합니다. validator는 전체 대상 기간에 공백이 없는지, 두 rule이 같은 날짜를 겹쳐 소유하지 않는지 검사합니다.

기준일, 출발일, 현재 취소 시각 중 하나가 없거나 “상황에 따라 부과”처럼 수치화할 수 없는 조건이 있으면 추정하지 않습니다. blocking error와 별도 exit code로 끝내고 부족한 입력을 보여줍니다. 계산을 계속해 그럴듯한 금액을 내는 것보다 답을 내지 않는 편이 안전한 domain입니다.

## source quote가 구조화 결과를 묶는다

모델이 생성한 숫자가 원문 어디에서 왔는지 추적하려고 모든 수수료 rule에 quote를 요구했습니다. validator는 quote가 source에 실제로 존재하고, 추출된 `(숫자, 단위)`가 quote와 일치하는지 확인합니다.

계산기는 검증된 interval만 받아 다음을 순수 함수로 처리합니다.

- 취소 시점과 출발일의 날짜 차이
- inclusive boundary가 포함하는 구간
- 정액·정률 수수료
- 결제액을 넘지 않는 수수료 cap
- `환불액 = 결제액 - 검증된 수수료`

표현을 바꾸는 LLM과 동일 입력에 동일 숫자를 내야 하는 금액 함수를 분리해 각각 다른 종류의 테스트를 적용했습니다.

## 정확도보다 적용 범위를 먼저 명시한다

golden fixture 10개는 모두 기대한 구간과 금액을 반환했고, 답에 사용한 source quote 14개도 원문 실존 검사를 통과했습니다. 구간 공백·중첩, 기준일 누락, 지원하지 않는 정책은 의도대로 blocking 결과가 됐습니다.

현재 지원 범위는 해외여행 패키지의 단순 날짜·정액·정률 규정입니다. 영업일 달력, 시간대가 다른 출발지, coupon·부분 취소·복합 promotion은 계산하지 않습니다. 공정위 기준과의 차이는 참고 정보로 표시하지만 실제 계약 해석이나 법률 판단을 대신하지 않습니다.

금융성 숫자를 다루는 AI 기능에서 중요한 것은 “대부분 맞는 답”보다, 어떤 입력에서 계산을 거부하고 어떤 근거로 숫자를 냈는지 재현할 수 있는 구조였습니다.
