---
title: "여행 환불 규정 내비게이터"
summary: "자연어 취소 규정을 구조화하되 환불액 계산과 불확실성 차단은 결정론 코드가 담당하는 Codex 플러그인입니다."
status: complete
visibility: private
role: "개인 설계·구현·검증"
contributionEvidence: ["골든 테스트 10개", "인용 실존·구간 공백·조건 조작 테스트"]
tags: ["Rule Parsing", "Deterministic Calculation", "Consumer Policy"]
infra: ["Python standard library"]
metrics:
  - { label: "Golden tests", value: "10 / 10" }
order: 7
featured: false
repositories: []
---

## 돈 계산은 코드가 한다

LLM은 규정 문장을 구간과 조건으로 구조화하지만, 날짜·수수료·환불액은 코드가 계산합니다. 규정에 공백이나 외부 참조가 있으면 확정 금액을 만들지 않고 확인 필요 상태로 종료합니다.

## 근거 없는 비교를 막는다

공정위 기준 비교는 상품이 국외 패키지여행이라는 근거 문구가 있을 때만 실행합니다. 분류와 예외 조건에도 원문 인용을 요구합니다.
