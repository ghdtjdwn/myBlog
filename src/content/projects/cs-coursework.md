---
title: "Computer Science Coursework"
summary: "시스템, 알고리즘, 네트워크, AI와 데이터 분석 과제를 과목별로 정리한 학습 아카이브입니다."
status: archive
statusNote: "12개 전공 과제의 코드를 보존한 학습 아카이브입니다. 현재 기능 개발이나 운영은 하지 않습니다."
activity: coursework
visibility: public
role: "개인 전공 과제"
contributionEvidence: ["12과목 공개 저장소"]
tags: ["C", "C++", "Java", "Python"]
infra: []
metrics:
  - { label: "Courses", value: "12" }
order: 11
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/cs-coursework" }
recordPlan: "과목별 README와 Git 이력을 원본으로 유지합니다. 현재 소스를 다시 검증한 POSIX 채점기·인터프리터·RISC-V 세 과제를 학습 글로 연결합니다."
recordLinks:
  - { label: "과목별 코드와 README", url: "https://github.com/ghdtjdwn/cs-coursework" }
  - { label: "POSIX 자동채점기", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Linux_System_Programming" }
  - { label: "재귀하향 인터프리터", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Programming_Languages" }
  - { label: "RISC-V 시뮬레이터", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Computer_Architecture" }
---

## 아카이브의 목적

이 저장소는 하나의 제품이 아니라 컴퓨터공학 전공에서 구현한 과제를 과목별로 보존합니다. 운영체제·언어·네트워크·알고리즘·AI 개념을 코드로 실습한 기록입니다.

## 기록 범위

인터프리터, RISC-V 시뮬레이터, 파일 처리, 네트워크 소켓, 알고리즘과 PyTorch 모델을 포함합니다. 과제 당시의 학습 조건과 현재 다시 실행한 검증을 구분해 기록합니다.

C/C++에서는 POSIX 파일 처리, 연결 리스트 기반 중복 파일 탐색과 시스템 프로그래밍을 다뤘습니다. mini-language interpreter는 Python과 C++로, Java 과제는 자료구조와 객체지향 기본기를 중심으로 구현했습니다. RISC-V simulator와 FTL 과제는 명령 실행·저장장치 계층을 코드로 이해하는 과정이었습니다. 네트워크 과제에는 socket, TLS와 ZeroMQ가 포함됩니다.

AI 과제는 PyTorch로 CNN, ViT, BERT와 Transformer 구성 요소를 구현하고 실험한 기록입니다. 과제 README에 남은 정확도는 해당 데이터와 수업 조건의 결과일 뿐 실제 제품 모델의 성능으로 일반화하지 않습니다.

## 다시 확인한 범위

현재 공개 소스를 다시 확인해 POSIX 병렬 채점기, 재귀하향 interpreter와 RISC-V simulator 세 글을 연결했습니다. 기록된 과거 성능과 현재 실행한 검증을 구분하고, 문서와 코드가 어긋난 interpreter 의미도 한계로 기록했습니다.

## 한계

수업 과제이므로 실제 사용자, 팀 운영, 배포와 장애 대응 조건은 포함하지 않습니다. 과제 요구사항이나 외부 자료의 공개 범위를 다시 확인한 뒤에만 상세 코드와 결과를 인용합니다.
