---
title: "두근두근 자료구조"
summary: "자료구조를 비주얼노벨로 학습하고, AI는 사람이 작성한 기준 안에서 자유서술 답안을 채점만 하는 인터랙티브 콘텐츠입니다."
status: complete
visibility: private
role: "UI·아트 방향과 제품 구현 참여"
teamScope: "팀 프로젝트이므로 전체 성과를 개인 기여로 표현하지 않음"
contributionEvidence: ["공개 배포는 보류", "23 engine tests 기록", "Playwright 완주 기록"]
image: "../../assets/projects/ddsc-game.png"
imageAlt: "두근두근 자료구조 비주얼노벨 플레이 화면"
tags: ["AI Grading", "Vanilla JS", "Education", "Game Engine"]
infra: ["Static fallback", "Optional Node proxy"]
metrics:
  - { label: "Engine tests", value: "23" }
  - { label: "Scenario beats", value: "8" }
order: 3
featured: true
repositories: []
---

## 핵심 결정

교육 콘텐츠에서 AI가 설명과 대사를 자유 생성하면 틀린 내용을 가르칠 위험이 있습니다. 문제·정답·대사는 사람이 작성하고 AI는 정답 anchor와 학습자의 답을 비교해 판정만 반환하게 했습니다.

## 장애 격리

호감도, 문제 순서, 재설명, 엔딩은 결정론 엔진이 소유합니다. 서버나 AI 키가 없는 정적 배포에서는 mock grader로 완주할 수 있고, 실제 AI 채점은 서버 프록시를 사용할 때만 활성화됩니다.

## 기여 경계

이 프로젝트는 팀 작업입니다. 블로그에서는 확인된 개인 역할과 설계 과정만 설명하고 팀 전체 결과를 단독 구현으로 표현하지 않습니다.
