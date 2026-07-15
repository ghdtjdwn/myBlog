---
title: "UNITHON 음성 키오스크 Macro"
summary: "음성 주문과 키오스크 자동 조작을 잇는 팀 프로젝트에서 launcher·설정·패키징과 매크로 통합 범위를 담당했습니다."
status: complete
statusNote: "해커톤용 Macro 클라이언트 구현은 완료됐으며, 행사 이후 별도 배포나 유지보수는 진행하지 않고 있습니다."
activity: competition
visibility: public
role: "macro_pkg launcher·설정·패키징과 매크로 통합"
teamScope: "Backend와 Frontend 구현은 팀원 소유"
contributionEvidence: ["사용자 커밋의 macro_pkg 21개 파일", "launcher·설정·패키징과 기존 kioskMacro 통합"]
tags: ["Python", "WebSocket", "VAD", "UI Automation"]
infra: ["Local Windows runtime", "HTTP/WebSocket contracts"]
metrics:
  - { label: "Owned scope", value: "macro_pkg 21 files" }
order: 10
featured: false
repositories:
  - { label: "Macro", url: "https://github.com/UNITHON24/Macro" }
recordPlan: "Macro 저장소의 코드와 커밋을 원본 근거로 두고, 음성·주문·UI 자동화 경계와 dry-run 판단을 공모전 회고 글로 정리합니다. 팀의 Backend·Frontend 구현은 개인 기록에 포함하지 않습니다."
recordLinks:
  - { label: "Macro commit history", url: "https://github.com/UNITHON24/Macro/commits/main" }
---

## 해결하려는 문제와 역할

키오스크 화면을 직접 누르기 어려운 사용자가 음성으로 주문하면, 백엔드가 구조화한 주문을 실제 키오스크 UI 조작까지 이어주는 해커톤 프로젝트입니다. 제 커밋에서 확인되는 직접 기여는 `macro_pkg/`의 launcher, 설정 도구, 패키징과 기존 `kioskMacro` 연결 범위입니다. 앞선 커밋에 있던 기존 키오스크 구현과 Backend·Frontend는 개인 구현으로 주장하지 않습니다.

## 동작 흐름

마이크 PCM을 WebSocket으로 보내고, 백엔드가 반환한 주문 항목을 HTTP로 받습니다. 메뉴 인덱스에서 카테고리와 페이지, 좌표를 찾은 뒤 키오스크를 클릭해 장바구니에 담습니다.

16kHz PCM 녹음과 VAD가 발화·무음을 구분하고, WebSocket 연결이 음성 스트림을 전달합니다. 주문 결과를 받으면 메뉴 인덱스에서 카테고리, 페이지와 좌표를 찾고 pyautogui가 실제 화면 순서대로 이동합니다. EasyOCR은 메뉴 위치 초기 설정을 보조합니다.

## 안전한 테스트

`KIOSK_DRY_RUN=1`에서는 실제 클릭을 수행하지 않습니다. 음성 처리 중 마이크 상태와 무음 종료를 분리하고, 주문 처리 후 내비게이션 상태를 초기화합니다.

드라이런에서는 선택한 메뉴와 예정 좌표만 기록해 개발 환경에서 잘못된 클릭을 막습니다. 마이크 준비, 녹음 중, 무음 종료와 요청 완료 상태를 구분하고 한 주문이 끝나면 페이지 상태를 초기화합니다. 자동 테스트의 최신 성공 기록은 확인되지 않아 테스트 통과 수치를 주장하지 않습니다.

## 한계

좌표 기반 자동화는 해상도와 UI 변경에 취약합니다. 이 한계와 OCR 기반 초기 설정, 접근성 API 기반 대안을 별도 글에서 비교합니다.

Windows 데스크톱 권한과 고정된 화면 구조에도 의존합니다. 실제 제품이라면 좌표 보정보다 키오스크 자체 접근성 API 또는 애플리케이션 내부 명령 계약이 더 안정적입니다. 현재 코드는 2025 해커톤 산출물이며 이후 운영 중인 서비스로 표현하지 않습니다.
