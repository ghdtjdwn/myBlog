---
title: "UNITHON 음성 키오스크 Macro"
summary: "음성 주문과 키오스크 자동 조작을 잇는 팀 프로젝트에서 launcher·설정·패키징과 매크로 통합 범위를 담당했습니다."
status: complete
statusNote: "2024 해커톤용 클라이언트 구현은 완료됐고 운영 서비스는 아닙니다. 공개 저장소는 안전 기본값, 실행 경로, 문서와 CI를 보강해 검토 가능한 아카이브로 유지합니다."
activity: competition
visibility: public
role: "macro_pkg launcher·설정·패키징과 매크로 통합"
teamScope: "Backend와 Frontend 구현은 팀원 소유"
contributionEvidence: ["원본 사용자 커밋의 macro_pkg 21개 파일", "launcher 경로·주문 안전 경계·공개 문서·CI 정비"]
tags: ["Python", "WebSocket", "VAD", "UI Automation"]
infra: ["Local Windows runtime", "HTTP/WebSocket contracts"]
metrics:
  - { label: "Safety mode", value: "Dry-run default" }
order: 10
featured: false
repositories:
  - { label: "Macro", url: "https://github.com/UNITHON24/Macro" }
recordPlan: "Macro 저장소의 코드, ADR과 작업 로그를 원본 근거로 두고 음성·주문·UI 자동화 경계와 안전장치를 설명합니다. 팀의 Backend·Frontend 구현은 개인 기록에 포함하지 않습니다."
recordLinks:
  - { label: "Macro architecture and limitations", url: "https://github.com/UNITHON24/Macro/blob/main/README.md" }
  - { label: "Safe client boundary", url: "https://github.com/UNITHON24/Macro/blob/main/docs/ARCHITECTURE.md" }
  - { label: "Macro work log", url: "https://github.com/UNITHON24/Macro/blob/main/WORKLOG.md" }
---

## 해결하려는 문제와 역할

키오스크 화면을 직접 누르기 어려운 사용자가 음성으로 주문하면, 백엔드가 구조화한 주문을 실제 키오스크 UI 조작까지 이어주는 해커톤 프로젝트입니다. 원본 커밋에서 확인되는 직접 기여는 `macro_pkg/`의 launcher, 설정 도구, 패키징과 기존 `kioskMacro` 연결 범위입니다. 이후 공개 정리에서는 이 경로의 깨진 launcher와 안전 경계, 문서와 CI를 보강했습니다. 앞선 커밋에 있던 기존 키오스크 구현과 Backend·Frontend는 개인 구현으로 주장하지 않습니다.

## 동작 흐름

마이크 PCM을 WebSocket으로 보내고, 백엔드가 반환한 주문 항목을 HTTP로 받습니다. 메뉴 인덱스에서 카테고리와 페이지, 좌표를 찾은 뒤 키오스크를 클릭해 장바구니에 담습니다.

16kHz PCM 녹음과 VAD가 발화·무음을 구분하고, WebSocket 연결이 음성 스트림을 전달합니다. 주문 결과를 받으면 메뉴 인덱스에서 카테고리, 페이지와 좌표를 찾고 pyautogui가 실제 화면 순서대로 이동합니다. EasyOCR은 메뉴 위치 초기 설정을 보조합니다.

## 안전한 테스트

기본값이 dry-run이므로 명시적으로 해제하기 전에는 실제 클릭을 수행하지 않습니다. 첫 클릭 전에 주문 전체의 메뉴명과 수량을 검증하고, 기본 상한을 넘거나 알 수 없는 메뉴가 하나라도 있으면 전체를 실행하지 않습니다. HTTP 주문 허브 한 경로에서 주문을 하나씩 처리해 WebSocket 이벤트와의 중복 실행도 막았습니다.

드라이런에서는 선택한 메뉴와 예정 좌표만 기록하며 포인터를 이동하지 않습니다. 실제 클릭 모드는 검증된 메뉴를 장바구니에 담은 뒤 멈추고, 운영자가 수량·금액·화면 상태를 확인해 결제를 수동으로 이어갑니다. 화면 모서리 failsafe가 작동하면 남은 항목과 이후 주문을 재시작 전까지 거부합니다. 표준 라이브러리 테스트가 설정 평가, launcher 경로, 메뉴 인덱스, 전체 사전 검증, 주문 상한, 동시 실행 거부, 긴급 중단과 수동 결제 경계를 검증하고 GitHub Actions가 같은 suite와 문법 검사를 실행합니다. 마이크·OCR·실제 포인터 통합은 데스크톱 장치가 필요한 수동 검증 범위로 명시합니다.

## 한계

좌표 기반 자동화는 해상도와 UI 변경에 취약합니다. 이 한계와 OCR 기반 초기 설정, 접근성 API 기반 대안을 별도 글에서 비교합니다.

Windows 데스크톱 권한과 고정된 화면 구조에도 의존합니다. 실제 제품이라면 좌표 보정보다 키오스크 자체 접근성 API 또는 애플리케이션 내부 명령 계약이 더 안정적입니다. 현재 코드는 2024 해커톤 산출물이며 이후 운영 중인 서비스로 표현하지 않습니다.
