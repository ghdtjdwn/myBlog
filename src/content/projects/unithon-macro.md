---
title: "UNITHON 음성 키오스크 Macro"
summary: "키오스크 소스 수정 없이 음성 주문을 현재 화면의 의미 기반 UI 조작으로 연결하고, 검증된 결제 방법 선택 화면에서 멈추는 Windows 접근성 retrofit 프로토타입입니다."
status: complete
statusNote: "2024 해커톤 구현을 UIA 우선 의미 탐색, OCR fallback과 영속 주문 경계로 완성했습니다. 운영 서비스는 아니며 실제 Windows 키오스크와 장애 당사자 사용성 검증은 남아 있습니다."
activity: competition
visibility: public
role: "음성 클라이언트·의미 기반 UI 자동화·안전한 주문 인계"
teamScope: "Backend·Frontend 원구현은 팀원 소유이며, Macro 연동에 필요한 인증 계약만 함께 보강"
contributionEvidence: ["원본 사용자 커밋의 macro_pkg 20개 파일", "UIA 우선 탐색·OCR fallback·전이와 postcondition 검증", "SQLite 주문 큐·인증 연동·69개 안전 코어 테스트와 양 OS CI"]
tags: ["Python", "Windows UIA", "EasyOCR", "SQLite"]
infra: ["Local Windows runtime", "Authenticated HTTP/WebSocket contracts", "SQLite durable queue"]
metrics:
  - { label: "Safety", value: "Dry-run default" }
  - { label: "Validation", value: "69 tests · Linux/Windows CI" }
order: 3
featured: true
repositories:
  - { label: "Macro", url: "https://github.com/UNITHON24/Macro" }
recordPlan: "Macro 저장소의 코드, ADR, 작업 로그와 문제해결 기록을 음성·주문·물리 UI 자동화 경계의 원본 근거로 둡니다. 팀의 Backend·Frontend 전체 구현은 개인 기록에 포함하지 않습니다."
recordLinks:
  - { label: "Architecture and safety boundaries", url: "https://github.com/UNITHON24/Macro/blob/main/docs/ARCHITECTURE.md" }
  - { label: "Semantic automation decision", url: "https://github.com/UNITHON24/Macro/blob/main/docs/adr/0002-black-box-semantic-automation.md" }
  - { label: "Live order boundary audit", url: "https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2026-live-order-boundary-audit.md" }
  - { label: "Windows SQLite·UTF-8 이식성 문제", url: "https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2026-windows-ci-portability.md" }
  - { label: "Macro work log", url: "https://github.com/UNITHON24/Macro/blob/main/WORKLOG.md" }
---

## 문제와 역할

터치 조작이 어려운 사용자가 음성으로 주문해도, 기존 키오스크에 음성 인터페이스가 없으면 주문 결과를 실제 화면 동작으로 이어갈 방법이 없습니다. Macro는 키오스크 기기나 프론트엔드 소스를 교체하지 않고 별도 Windows 프로세스로 이 간극을 연결합니다.

한국의 키오스크 접근성 제도는 운영자에게 장애인의 동등한 접근·이용을 위한 편의를 요구하고, 정해진 범위에서는 기존 단말기와 호환되는 소프트웨어도 대체 조치로 인정합니다. Macro는 이 software retrofit 경로의 기술적 가능성을 검증하지만, 접근성 인증이나 법적 적합성을 보장하는 제품은 아닙니다. 법적 범위와 공식 근거는 [저장소 README](https://github.com/UNITHON24/Macro#%EB%AC%B8%EC%A0%9C)에 따로 구분했습니다.

원본 사용자 커밋에서 확인되는 역할은 `macro_pkg/`의 launcher, 설정 도구, 패키징, 음성 클라이언트와 매크로 통합입니다. 공개 완성 작업에서는 의미 기반 탐색과 실행 루프, 영속 주문 큐, 안전 경계, 테스트와 문서를 구현했습니다. 팀원이 만든 Backend·Frontend 전체나 초기 `kioskMacro` 구현은 개인 작업으로 주장하지 않으며, Backend에는 Macro 호출을 위한 인증 header 계약만 연결했습니다.

## 데모 좌표에서 의미 기반 자동화로

2024년 시연 직전 화면 배치가 달라져 절대 좌표를 급히 고정했던 실패를 별도 [문제해결 기록](https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2024-demo-coordinate-drift.md)으로 남겼습니다. 모든 메뉴와 전이를 YOLO로 학습하는 방법도 검토했지만, 텍스트 중심 UI마다 데이터셋과 모델을 유지해야 하고 보이지 않는 상태 의미까지 별도로 저장해야 했습니다.

완성한 구조는 현재 화면을 다시 읽는 방식입니다. 한 native window handle에 관찰을 고정하고 Windows UI Automation의 이름·역할·상태를 먼저 사용합니다. 접근성 트리가 부족한 캔버스 화면에서만 EasyOCR로 현재 텍스트를 다시 찾고, 두 방법이 모두 실패할 때만 명시적으로 허용한 해상도 비례 좌표를 사용합니다.

## 실행과 검증 루프

마이크의 16 kHz PCM과 VAD가 음성 구간을 WebSocket으로 전달합니다. Backend가 반환한 `displayName`, 온도, 크기와 수량은 설치별 token으로 인증된 HTTP 계약을 통해 SQLite 주문 큐에 저장됩니다. 멱등 키와 전역 단일 claim이 중복 주문과 동시 포인터 실행을 막습니다.

키오스크 profile은 화면 상태와 허용 전이를 선언합니다. 각 동작은 `관찰 → 의미 후보 결정 → 실행 → 두 번 안정화 → 재관찰 → postcondition 확인` 순서를 통과해야 합니다. 이름이 같은 control이 둘이거나 화면 전이와 장바구니 수량 변화가 증명되지 않으면 임의로 계속하지 않고 중단합니다.

## 결제와 고객 인계 경계

Dry-run이 기본값이고 주문 전체의 메뉴·옵션·수량을 첫 동작 전에 검증합니다. 결제 이동을 별도로 허용한 경우에만 검증된 결제 방법 선택 화면까지 진행하며, 카드·현금 선택이나 승인 입력은 수행하지 않습니다.

실제 장바구니가 한 번이라도 바뀌면 주문은 `awaiting_handoff`로 남습니다. 동작 결과가 불확실하면 더 강한 `uncertain` 상태가 됩니다. 운영자가 고객 인계 또는 취소와 키오스크 초기화를 확인하기 전에는 다음 주문을 claim하지 않으므로, 메시지 성공과 물리 화면 성공을 같은 transaction으로 취급하지 않습니다.

## 검증과 한계

69개 표준 라이브러리 테스트가 실제 팀 화면을 재현한 중첩 control, UI grounding, 화면 전이, 장바구니 delta, 주문 인증·멱등성·복구와 결제 정지 경계를 검증합니다. GitHub Actions의 같은 안전 코어는 Ubuntu와 Windows에서 통과했습니다. 첫 Windows 실행에서 발견한 SQLite file handle, 콘솔 encoding과 경로 구분자 문제도 실제 [CI 문제해결 기록](https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2026-windows-ci-portability.md)으로 남겼습니다.

이 검증은 순수 안전 코어의 결정론적 회귀 검사입니다. 실제 Windows 키오스크의 UIA 품질, DPI, OCR 모델, 마이크와 물리 포인터를 합친 end-to-end acceptance는 아직 수행하지 않았습니다. 새 키오스크에는 검토된 profile이 필요하며, 장애 당사자 사용성 평가·접근성 인증·전체 법적 적합성도 별도 범위입니다.
