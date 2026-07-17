---
title: "상담 로그 35건을 자동 게시하지 않고 FAQ 6개로 줄인 방법"
description: "PII 마스킹과 근거 검증은 결정론 코드에 두고 LLM은 보수적인 의미 병합과 초안에만 사용한 FAQ 지식베이스 pipeline입니다."
publishedAt: 2026-07-17
category: ai-systems
activity: other
tags: ["LLM", "Clustering", "PII", "Guardrails"]
project: axwar-kb
role: "상담 로그 clustering, PII 마스킹, 근거 validator와 FAQ 초안 plugin 개인 설계·구현·검증"
evidence:
  - "비공개 제출물의 35건 fixture, cluster 정답표와 FAQ source mapping"
  - "PII 재검색, 숫자·인용 근거 validator와 적대 테스트 결과"
validation:
  - "35건에서 24개 micro-cluster와 검토 가능한 FAQ 6개 생성"
  - "pair precision 0.82·recall 0.21, PII 4건 마스킹 후 재검색 0건, 적대 테스트 9/9"
limitations:
  - "패턴 기반 PII 탐지는 자유 형식 사람 이름과 문맥형 개인정보를 모두 찾지 못함"
  - "낮은 recall을 의도적으로 수용했으며 결과를 자동 게시하지 않음"
featured: true
draft: false
---

## FAQ 생성의 가장 큰 실패는 누락이 아니라 잘못된 병합이다

상담 로그에는 같은 질문이 다른 표현으로 반복됩니다. LLM에게 전체 로그를 한 번에 요약시키면 빠르게 FAQ를 만들 수 있지만 서로 다른 환불·배송 정책을 한 답변으로 합치거나, 전화번호와 주문 식별자를 다시 노출할 수 있습니다.

이 도구의 목표는 게시물이 아니라 상담 담당자가 검토할 수 있는 후보입니다. 그래서 생성량보다 잘못 합치지 않는 precision을 우선했습니다.

```text
JSONL
 -> deterministic PII masking
 -> conservative micro-clustering
 -> LLM semantic merge and draft
 -> evidence validator
 -> human-reviewable FAQ candidates
```

LLM을 pipeline 중심이 아니라 제한된 두 단계에만 배치했습니다. 작은 후보 cluster 사이의 의미적 중복을 판단하고 자연스러운 질문·답변 초안을 쓰는 일입니다.

## 개인정보와 사실성은 확률 모델 밖에서 검사한다

전화번호, 이메일, 주문·회원 식별자처럼 형식이 명확한 PII는 LLM 호출 전에 결정론적으로 마스킹합니다. 생성 뒤에도 원문 패턴을 다시 검색해 값이 되살아나지 않았는지 확인합니다.

FAQ마다 어떤 상담 record가 근거인지 source ID를 유지합니다. validator는 답변에 들어간 인용과 `(숫자, 단위)` 조합이 해당 근거에 실제로 존재하는지 검사합니다. “3일”, “10%”처럼 작은 숫자 하나가 정책의 의미를 바꿀 수 있기 때문에, 문장이 그럴듯하다는 이유만으로 통과시키지 않습니다.

근거가 없거나 서로 충돌하는 cluster는 자동으로 매끄럽게 만들지 않고 실패 상태로 남깁니다. 생성 모델이 불확실성을 문장 품질로 숨기지 못하게 한 경계입니다.

## 왜 recall 0.21을 받아들였나

35건의 fixture에서 결정론 단계는 24개 micro-cluster를 만들었고 최종 후보는 6개였습니다. 정답표 기준 pair precision은 0.82, recall은 0.21이었습니다.

recall 0.21은 높은 수치가 아닙니다. 하지만 FAQ bootstrap에서는 누락된 유사 문의를 사람이 나중에 합칠 수 있는 반면, 다른 정책을 잘못 합치면 실제 고객에게 틀린 답을 줄 수 있습니다. 낮은 recall을 숨기지 않고 다음 운영 계약을 선택했습니다.

- 자동 단계는 확실한 이웃만 묶는다.
- 애매한 후보는 분리된 채 사람에게 보여준다.
- source mapping이 없는 문장은 게시 후보가 아니다.
- 최종 게시 권한은 사람에게만 있다.

## adversarial test가 정상 예시보다 중요했다

fixture 안의 PII 4건은 모두 마스킹됐고 생성 결과 재검색에서는 0건이 검출됐습니다. 근거 없는 숫자, 존재하지 않는 인용, 서로 다른 정책의 강제 병합, 깨진 JSONL을 포함한 적대 테스트 9개도 모두 기대한 fail-closed 결과를 냈습니다.

이 수치는 실제 상담 전체의 개인정보 안전성을 증명하지 않습니다. 패턴 기반 탐지는 자유 형식 이름이나 문맥으로만 식별되는 정보를 놓칠 수 있습니다. 더 넓은 entity detector를 추가하더라도 원문 접근 통제와 사람 승인 단계를 유지해야 합니다.

LLM이 잘하는 의미 압축은 사용하되, 무엇을 외부로 보내고 어떤 문장을 사실로 인정할지는 결정론 계약이 소유하도록 만든 사례입니다.
