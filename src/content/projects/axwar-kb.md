---
title: "상담 로그 지식베이스 부트스트랩"
summary: "상담 JSONL에서 반복 문의를 찾고 PII를 가린 뒤 근거가 있는 FAQ 초안을 만드는 Codex 플러그인입니다."
status: complete
visibility: private
role: "개인 설계·구현·검증"
contributionEvidence: ["골든·적대 테스트", "PII 마스킹 재검색", "FAQ 근거 검증"]
tags: ["LLM", "Clustering", "PII", "FAQ"]
infra: ["Offline Python pipeline"]
metrics:
  - { label: "Adversarial", value: "9 / 9" }
  - { label: "Validation", value: "FAIL 0" }
order: 6
featured: false
repositories: []
---

## 경계 설계

LLM은 인접 주제를 의미적으로 병합하고 초안을 작성합니다. 개인정보 마스킹, 숫자·인용의 원문 실존 여부, 게시 가능 판정은 결정론 코드가 담당합니다.

## 왜 정밀도 우선인가

서로 다른 정책을 한 FAQ로 합치는 오병합은 잘못된 상담 지식을 만듭니다. 자동 클러스터링은 보수적으로 유지하고 사람이 검토할 수 있는 작은 후보를 만듭니다.
