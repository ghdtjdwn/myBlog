---
title: "DART 공시 브리핑 가드"
summary: "유상증자와 전환사채 공시를 쉽게 설명하면서 투자권유 표현과 원문에 없는 숫자를 차단하는 Codex 플러그인입니다."
status: complete
visibility: private
role: "개인 설계·구현·검증"
contributionEvidence: ["적대 테스트 8개", "숫자 exact-match 검증", "금지 표현·필수 고지 게이트"]
tags: ["DART", "Compliance", "LLM Guardrail", "Financial Data"]
infra: ["Offline mock", "OPEN DART optional"]
metrics:
  - { label: "Adversarial", value: "8 / 8" }
order: 8
featured: false
repositories: []
---

## 요약과 게시 판정을 분리한다

LLM이 공시를 풀어 쓰지만 검증기가 모든 숫자를 원문 값 집합과 정확히 비교합니다. 매수·추천·보장 같은 표현과 필수 고지 누락도 게시 실패로 처리합니다.

## 남은 위험

숫자의 존재는 확인하지만 그 숫자가 올바른 문맥에 쓰였는지는 완전히 판정하지 못합니다. 문장별 출처 필드 연결이 다음 확장점입니다.
