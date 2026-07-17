---
title: "AI 학습 게임에서 LLM에게 게임 진행을 맡기지 않은 이유"
description: "자유서술 답변의 네 단계 판정만 LLM에 맡기고 정답, 호감도, 재시도와 엔딩은 결정론 엔진이 소유하게 만든 자료구조 학습 게임입니다."
publishedAt: 2026-07-17
category: ai-systems
activity: competition
tags: ["LLM", "Game Engine", "Data Structures", "Guardrails"]
project: ddsc-learning-game
role: "스택 학습 route·정답 anchor, 결정론 게임 엔진, grader provider 계약과 UI 통합 개인 설계·구현"
evidence:
  - "사람이 작성한 dongki-stack 원문과 scenario/stack.json의 문제·정답 anchor"
  - "engine invariant test, mock·provider contract와 전체 route Playwright 기록"
validation:
  - "호감도·밴드·재설명·엔딩·호출 횟수·실제 Stack route를 포함한 Node test 23개"
  - "mock provider로 타이틀에서 demo ending까지 Playwright 전체 플레이"
limitations:
  - "정적 배포는 browser mock만 사용하며 실제 provider 채점 server를 제공하지 않음"
  - "실제 provider 품질 평가와 학습 효과 실험을 완료하지 않음"
  - "완성된 학습 route는 Stack이며 Queue·Tree 확장은 아직 없음"
featured: true
draft: false
---

## 생성형 대화보다 회상 연습을 제품 중심에 뒀다

두근두근 자료구조는 자료구조를 visual novel 흐름으로 학습하는 대회 데모입니다. 학습자는 설명을 읽고 선택지를 고르는 대신 Stack 개념을 자유서술로 답합니다. AI는 작성된 정답 anchor와 답변을 비교해 네 판정 중 하나만 제공합니다.

```text
wrong | partial | correct | critical
```

문제, 정답, 설명과 반응 script는 사람이 작성합니다. LLM이 새로운 학습 내용을 가르치거나 다음 문제를 발명하지 않습니다. “그럴듯한 대화”보다 학습자가 기억에서 개념을 꺼내 설명하는 retrieval practice가 핵심 상호작용이기 때문입니다.

## 모델 출력은 명령이 아니라 제한된 입력이다

server의 grader provider는 모두 같은 `{ verdict }` contract를 가집니다. prompt에는 현재 질문과 해당 anchor만 전달하고, 허용 enum 밖의 값과 깨진 응답은 안전한 판정으로 정규화합니다. API key는 server configuration에만 있고 browser용 `/api/config`에는 노출하지 않습니다.

각 자유서술 제출은 한 곳에서 한 번만 grader를 호출합니다. UI event가 중복 실행돼 호감도가 두 번 오르는 것을 막고, provider 교체가 engine에 퍼지지 않게 했습니다. key가 없을 때는 같은 contract의 keyword mock으로 동작합니다.

중요한 것은 verdict가 game state를 직접 수정하지 못한다는 점입니다.

```text
authored scenario + current snapshot + validated verdict
                 -> deterministic transition
                 -> next snapshot
```

호감도 증가·감소, 0~100 clamp, character별 gauge, band 변화, 오답 재설명, problem 순서와 ending 조건은 모두 `engine.js`가 결정합니다. 모델이 느리거나 잘못 판정해도 state schema와 진행 규칙은 코드 안에 남습니다.

## view와 engine 사이에도 snapshot 경계를 뒀다

DOM에서 현재 호감도나 problem index를 다시 읽어 game logic을 계산하지 않습니다. engine이 immutable한 snapshot을 만들고 view는 이를 그립니다. 화면 자산이 없으면 character는 표정 box, background는 gradient로 대체돼 학습 흐름이 멈추지 않습니다.

정적 GitHub Pages 형태의 demo는 server가 없으므로 browser mock을 사용합니다. 실제 OpenAI·Claude provider는 별도 Node server의 `/api/turn`이 필요합니다. 정적 화면이 열렸다는 사실을 실제 AI 채점 배포로 표현하지 않도록 두 mode를 문서에서 구분했습니다.

## invariant와 실제 이야기 경로를 함께 테스트한다

Node test 23개는 단일 함수 예시뿐 아니라 다음 불변식을 검사합니다.

- 호감도는 허용 범위 밖으로 나가지 않는다.
- 제출 한 번에 grader call은 한 번이다.
- 오답은 재설명과 재시도로 이어지고 soft-lock을 만들지 않는다.
- 각 character gauge와 band가 의도한 verdict delta를 따른다.
- 실제 `stack.json`의 8개 beat를 끝까지 진행하면 demo ending에 도달한다.
- CC ending은 작성된 조건을 만족할 때만 선택된다.

Playwright는 mock server를 띄우고 타이틀, New Game, Stack route, 자유서술 제출을 거쳐 ending 화면까지 자동으로 플레이했습니다.

이 검증은 engine의 결정론과 화면 연결을 증명합니다. 실제 provider가 교육적으로 타당하게 판정하는지, 이 방식이 학습 성과를 높이는지는 별도의 평가가 필요합니다. AI의 역할을 작게 만든 것은 그 평가가 끝나지 않은 상태에서도 게임과 학습 원문을 통제하기 위한 선택입니다.
