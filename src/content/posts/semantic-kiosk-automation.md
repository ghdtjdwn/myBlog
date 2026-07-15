---
title: "좌표 클릭을 검증 가능한 상태 전이로 바꾼 이유"
description: "소스 없는 Windows 키오스크를 UIA→OCR→승인 좌표 순으로 관찰하고, postcondition과 결제 경계로 물리 UI 자동화의 불확실성을 다룬 설계입니다."
publishedAt: 2026-07-15
category: engineering
activity: competition
tags: ["Windows UIA", "OCR", "State Machine", "Safety"]
project: unithon-macro
role: "macro_pkg launcher·음성 클라이언트·자동화 통합과 현재 안전 실행 구조"
evidence:
  - "Macro ADR-0002의 UIA 우선·OCR fallback·결제 terminal 결정"
  - "2024 시연 좌표 drift 문제해결 기록과 현재 아키텍처"
  - "Ubuntu·Windows quality workflow와 main Actions run 29399898239"
validation:
  - "69개 안전 코어 테스트를 Ubuntu와 Windows에서 모두 통과"
  - "동일 postcondition 2회 관찰, 장바구니 delta와 모호한 후보 거부 검증"
  - "모든 주문 endpoint의 32자 이상 token, single claim과 uncertain 복구 검증"
limitations:
  - "실제 Windows UIA provider·EasyOCR 한국어 모델·마이크·물리 포인터 E2E는 미검증"
  - "새 키오스크마다 profile 작성과 현장 acceptance가 필요하며 범용 지원을 주장하지 않음"
  - "장애 당사자 사용성, 접근성 인증과 법률 적합성을 검증하지 않음"
featured: true
draft: false
---

## 클릭 API가 성공해도 주문은 실패할 수 있다

UNITHON 2024 시연 직전 화면 문제가 생겼을 때, 제한된 시간 안에 흐름을 끝내기 위해 메뉴와 버튼 좌표를 직접 넣었습니다. 당시의 정확한 DPI, focus와 UI 변경 로그는 남아 있지 않아 촉발 원인을 사후에 단정하지 않습니다.

다만 구조적 실패는 코드에서 확인할 수 있었습니다. 1080×1920 화면과 2×8 카드 배치를 가정하고 포인터 API가 예외 없이 끝나면 내부 상태를 다음 화면으로 바꿨습니다. 실제 UI가 이동했는지, 옵션 모달이 열렸는지, 장바구니 수량이 늘었는지는 다시 보지 않았습니다.

소스, DOM, 전용 API가 없는 외부 키오스크에서는 “어디를 클릭했는가”보다 “그 동작 뒤 무엇을 관찰했는가”가 성공 조건이어야 했습니다.

## UIA, OCR, 좌표는 동등한 세 가지 방법이 아니다

현재 navigator는 다음 우선순위를 가집니다.

1. Windows UI Automation에서 `Name`, `ControlType`, `AutomationId`, 활성 상태와 bounding box를 읽고 `Invoke` 패턴을 우선 사용합니다.
2. 현재 목표를 UIA에서 찾지 못했을 때만 대상 창을 잘라 EasyOCR로 텍스트 위치를 다시 찾습니다.
3. 두 방법이 모두 실패하고 운영자가 명시적으로 허용한 경우에만 기준 좌표를 현재 창 크기에 맞춰 사용합니다.

UIA는 키오스크가 노출하는 의미 정보를 직접 사용해 가장 안정적입니다. OCR은 텍스트가 보이지만 접근성 트리에 없는 UI를 보완합니다. 좌표는 최후 fallback이며 기본값은 꺼져 있습니다. 어떤 방법으로 action을 실행했든 같은 postcondition을 통과해야 하므로 좌표는 성공의 증거가 되지 않습니다.

같은 이름의 후보가 비슷한 점수로 두 개 남거나, control이 offscreen·disabled이거나, 중심점이 대상 창 밖이면 동작하지 않습니다. automation root와 OCR 캡처를 최초에 고정한 native window handle 안으로 제한해 overlay나 다른 전면 창을 키오스크로 오인하는 것도 막습니다.

## action을 폐쇄루프 상태 전이로 만든다

프로필은 절대 좌표 대신 화면 상태, 허용 전이, 의미 별칭과 기대 postcondition을 저장합니다. 한 동작은 다음 순서로 끝납니다.

```text
현재 상태 관찰
  → 의미 후보 하나로 결정
  → UIA Invoke 또는 현재 bounding box 동작
  → 기대 텍스트·화면 signature 재관찰
  → 같은 후속 상태를 두 번 연속 확인
  → 장바구니 delta 또는 terminal evidence 확인
```

애니메이션 때문에 화면 hash만 달라지거나, 장바구니 영역에 우연히 메뉴명이 보이거나, 클릭은 됐지만 수량이 그대로인 경우는 성공이 아닙니다. 물리 화면의 부작용을 확정할 수 없으면 일반 실패로 낮추거나 자동 재시도하지 않고 `uncertain`으로 보존합니다.

## 첫 클릭 전에 주문 전체를 검증한다

음성 backend가 보낸 `displayName`, 온도, 크기와 수량을 모든 항목에 대해 먼저 해석합니다. 후보가 모호하거나 옵션이 충돌하거나 프로필이 일부 항목을 지원하지 않으면 첫 action 전에 전체 주문을 거부합니다. 중간까지 장바구니를 바꾼 뒤 나머지 항목을 처리할 수 없다고 발견하는 일을 줄이기 위해서입니다.

주문 hub는 SQLite에 멱등 키와 상태를 저장하고 한 번에 하나만 claim합니다.

```text
queued → claimed → succeeded
                 ↘ awaiting_handoff
                 ↘ uncertain
                 ↘ failed
```

live 장바구니가 바뀌면 고객 인계 또는 운영자의 초기화 확인 전까지 다음 주문을 받지 않습니다. ACK가 유실됐다고 물리 action을 자동 replay하면 수량이 중복될 수 있으므로, 분산 exactly-once를 주장하는 대신 불확실성을 보존합니다.

dry-run과 live가 같은 영속 queue를 쓰기 때문에 “실제 클릭을 안 한다”는 이유로 인증을 빼지 않았습니다. 주문 등록, claim, ACK와 마이크 상태 endpoint는 모두 32자 이상의 설치별 token을 요구합니다.

## 결제 방법 선택 화면이 자동화의 끝이다

Transition graph의 terminal은 `결제 방법 선택`입니다. 카드·현금 버튼 선택, 카드 정보, PIN, 현금 투입과 결제 확인은 실행하지 않습니다. `KIOSK_ALLOW_PAYMENT_NAVIGATION`도 기본값이 꺼져 있어 profile과 운영 승인 없이 결제 화면으로 이동하지 않습니다.

이 경계는 기능이 덜 완성돼서가 아니라 책임이 달라지는 지점입니다. 주문 항목을 장바구니에 담는 보조와 사용자의 금전 결정을 대신하는 일은 같은 자동화로 취급할 수 없습니다.

## 자동 테스트가 증명하는 것과 남은 것

[quality workflow](https://github.com/UNITHON24/Macro/blob/main/.github/workflows/quality.yml)는 69개 안전 코어 테스트를 Ubuntu와 Windows에서 실행합니다. 의미 grounding, 모호성 거부, window handle, 안정 postcondition, 장바구니 delta, 결제 terminal, 인증, 멱등성, single claim과 `uncertain` 복구를 외부 장치 없이 재생합니다.

반면 실제 Windows UIA provider, 한국어 OCR target-hit rate, 100·125·150% DPI, 마이크·음성 backend·물리 포인터 E2E는 아직 검증하지 않았습니다. 새 키오스크에는 read-only 진단, profile review, dry-run과 비운영 장치 acceptance가 필요합니다. 장애 당사자 사용성이나 접근성 인증을 완료했다고도 주장하지 않습니다.

개인 기여는 `macro_pkg/` launcher·설정·음성 클라이언트·매크로 통합과 현재 안전 구조입니다. 팀의 음성 backend, 키오스크 frontend와 초기 `kioskMacro/`는 개인 성과에서 제외합니다. 설계 원문은 [ADR-0002](https://github.com/UNITHON24/Macro/blob/main/docs/adr/0002-black-box-semantic-automation.md), 사건 범위는 [좌표 drift 기록](https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2024-demo-coordinate-drift.md)에 남겼습니다.
