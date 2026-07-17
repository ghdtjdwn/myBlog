---
title: "두근두근 자료구조"
summary: "자유서술 답변은 AI가 네 단계로 판정하고, 학습 원문·호감도·재시도·엔딩은 결정론 코드가 소유하는 자료구조 학습 미연시입니다."
status: complete
statusNote: "스택 route와 자체 제작 화면·아트를 포함한 대회용 완성 데모입니다. 실제 AI 채점 배포와 학습 효과 평가는 완료하지 않았습니다."
activity: competition
visibility: private
role: "개인 기획·학습 시나리오·엔진·grader 연동·UI 구현과 검증"
teamScope: "개인 출품작"
contributionEvidence:
  - "사람이 작성한 Stack 문제·정답 anchor와 8개 beat 시나리오"
  - "결정론 엔진·provider contract Node test 23개"
  - "타이틀부터 demo ending까지 Playwright 전체 플레이"
screenshots: []
tags: ["JavaScript", "LLM Grader", "Game Engine", "Data Structures"]
infra: ["Static mock demo", "Optional Node grading server"]
metrics:
  - { label: "Engine tests", value: "23" }
  - { label: "Stack beats", value: "8" }
order: 10.5
featured: false
draft: false
repositories: []
recordPlan: "비공개 대회 저장소의 시나리오·테스트·진행 문서를 원본으로 유지하고, AI 역할 경계와 결정론 engine 검증만 공개 글로 정리합니다."
recordLinks: []
---

## 해결하려는 문제

자료구조 학습 자료는 설명과 객관식 확인으로 끝나는 경우가 많습니다. 이 프로젝트는 Stack을 visual novel 흐름으로 설명한 뒤 학습자가 자유서술로 다시 설명하게 해, 기억에서 개념을 꺼내는 연습과 즉시 feedback을 하나의 게임 mechanic으로 연결합니다.

## AI와 코드의 역할 경계

문제, 정답 anchor, 설명과 이야기 대사는 직접 작성한 시나리오가 기준입니다. AI grader는 자유서술 답을 anchor와 비교해 `wrong`, `partial`, `correct`, `critical` 중 하나를 반환합니다. 호감도, band, 오답 재설명, problem 순서와 ending은 결정론 engine이 계산합니다.

provider key는 server에만 두고 static demo에서는 같은 contract의 browser mock을 사용합니다. 정적 페이지가 플레이 가능하다는 사실을 실제 AI backend 배포로 표현하지 않습니다.

## 구현과 검증

완성된 Stack route는 지수 5개와 cameo 3개를 합친 8개 beat입니다. 자체 제작 character·background·title asset을 연결했고 이미지가 없을 때도 fallback UI로 진행됩니다.

Node test 23개가 호감도 범위, grader 단일 호출, 재설명, character gauge, band와 ending 불변식을 검사합니다. 실제 `stack.json` 한 바퀴를 통과하는 통합 case와 Playwright의 title-to-ending mock playthrough도 포함합니다.

## 한계와 다음 단계

실제 provider의 판정 품질과 학습 효과는 평가하지 않았습니다. Queue·Tree route도 아직 구현하지 않았습니다. 공개 가능한 정적 demo는 mock grader만 사용하며, 실제 AI를 운영하려면 secret과 abuse control을 포함한 별도 server 배포가 필요합니다.
