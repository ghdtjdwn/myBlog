---
title: "UNITHON 음성 키오스크 Macro"
summary: "음성을 실시간 전송하고 구조화된 주문 결과를 받아 실제 키오스크 화면을 자동 조작하는 Python 매크로입니다."
status: complete
visibility: public
role: "Python 매크로 구현"
teamScope: "Backend와 Frontend 구현은 팀원 소유"
contributionEvidence: ["Macro 저장소 전체 Python 추가 커밋", "사용자 명의 1 commit"]
tags: ["Python", "WebSocket", "VAD", "UI Automation"]
infra: ["Local Windows runtime", "HTTP/WebSocket contracts"]
metrics:
  - { label: "Owned scope", value: "Macro client" }
order: 10
featured: false
repositories:
  - { label: "Macro", url: "https://github.com/UNITHON24/Macro" }
---

## 동작 흐름

마이크 PCM을 WebSocket으로 보내고, 백엔드가 반환한 주문 항목을 HTTP로 받습니다. 메뉴 인덱스에서 카테고리와 페이지, 좌표를 찾은 뒤 키오스크를 클릭해 장바구니에 담습니다.

## 안전한 테스트

`KIOSK_DRY_RUN=1`에서는 실제 클릭을 수행하지 않습니다. 음성 처리 중 마이크 상태와 무음 종료를 분리하고, 주문 처리 후 내비게이션 상태를 초기화합니다.

## 한계

좌표 기반 자동화는 해상도와 UI 변경에 취약합니다. 이 한계와 OCR 기반 초기 설정, 접근성 API 기반 대안을 별도 글에서 비교합니다.
