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
featured: false
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/cs-coursework" }
recordPlan: "과목별 README와 Git 이력을 원본으로 유지합니다. 제품 경험으로 부풀리지 않고, 시스템·언어·AI 기본기를 설명할 가치가 있는 과제만 학습 글로 선별합니다."
recordLinks:
  - { label: "과목별 코드와 README", url: "https://github.com/ghdtjdwn/cs-coursework" }
---

## 아카이브의 목적

이 저장소는 하나의 제품이 아니라 컴퓨터공학 전공에서 구현한 과제를 과목별로 보존합니다. 최신 서비스 프로젝트와 같은 비중으로 성과를 홍보하기보다, 백엔드와 인프라 판단의 바탕이 된 운영체제·언어·네트워크·알고리즘·AI 기본기를 확인하는 자료입니다.

## 기록 범위

인터프리터, RISC-V 시뮬레이터, 파일 처리, 네트워크 소켓, 알고리즘과 PyTorch 모델을 포함합니다. 완성 제품과 섞지 않고 학습 과정과 기본기를 보여주는 아카이브로 배치합니다.

C/C++에서는 POSIX 파일 처리, 연결 리스트 기반 중복 파일 탐색과 시스템 프로그래밍을 다뤘습니다. mini-language interpreter는 Python과 C++로, Java 과제는 자료구조와 객체지향 기본기를 중심으로 구현했습니다. RISC-V simulator와 FTL 과제는 명령 실행·저장장치 계층을 코드로 이해하는 과정이었습니다. 네트워크 과제에는 socket, TLS와 ZeroMQ가 포함됩니다.

AI 과제는 PyTorch로 CNN, ViT, BERT와 Transformer 구성 요소를 구현하고 실험한 기록입니다. 과제 README에 남은 정확도는 해당 데이터와 수업 조건의 결과일 뿐 실제 제품 모델의 성능으로 일반화하지 않습니다.

## 채용 포트폴리오에서의 위치

대표 프로젝트는 운영 중인 ssu 플랫폼과 개발을 완료한 그늘처럼 운영·데이터·사용자 문제를 함께 다룬 사례입니다. 이 아카이브는 면접에서 자료구조, 실행 모델, 네트워크와 ML 기본기를 코드 수준에서 확인할 때 보조 근거로 사용합니다. 12개를 모두 글로 옮기지 않고 interpreter, RISC-V, Transformer처럼 현재 역량과 연결되는 2~3개만 회고로 확장할 예정입니다.

## 한계

수업 과제이므로 실제 사용자, 팀 운영, 배포와 장애 대응 경험을 증명하지 않습니다. 과제 요구사항이나 외부 자료의 공개 범위를 다시 확인한 뒤에만 상세 코드와 결과를 인용합니다.
