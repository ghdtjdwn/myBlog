---
title: "LLM이 다운로드 URL을 다시 말하게 하지 않은 이유"
description: "LMS ZIP capability link가 최종 응답 전에 사라진 장애를 결정적 terminal formatter, URL allowlist와 안전한 anchor로 해결한 기록입니다."
publishedAt: 2026-07-18
category: ai-systems
activity: personal-project
tags: ["LLM Orchestration", "Capability URL", "SSE", "Security"]
project: ssu-platform
role: "ssuAgent LMS export routing·terminal 응답과 ssuAI 안전 링크 렌더링 경계 설계·검증"
evidence:
  - "ssuAgent ADR-0022의 실제 전체 강의자료 export transcript와 원인 분석"
  - "ssuMCP가 job과 20분 기본 TTL capability URL을 즉시 반환하는 confirm 계약"
validation:
  - "추가 model call 없이 confirm 결과를 checkpoint하는 graph·공용 loop 테스트"
  - "status·origin·path·token 거부 조합과 assistant-only anchor 보안 속성 테스트"
limitations:
  - "실계정 전체 export는 쓰기 성격이라 자동 테스트에서 실행하지 않음"
  - "외부 LMS 수집 자체가 proxy 시간보다 길면 confirm 이전 단계는 여전히 종료될 수 있음"
  - "capability URL은 만료 전 소유한 사람이 사용할 수 있으므로 로그·history에서 가려야 함"
featured: true
draft: false
---

## ZIP은 준비됐는데 사용자에게 링크가 오지 않았다

운영 대화에서 사용자가 현재 수강 중인 모든 강의 파일을 요청했습니다. LMS handoff, 인증, 과목 조회, export 준비와 confirm 상태까지 SSE에 나타났지만 최종 링크는 없었습니다. “링크 띄워줘”라는 후속 요청도 직전 작업을 이어가지 못했습니다. 같은 전체 요청을 다시 보내자 이번에는 URL이 나왔지만 frontend가 일반 텍스트로 표시해 긴 token을 복사해야 했습니다.

ssuMCP는 ZIP 완성을 기다리지 않습니다. confirm 즉시 job과 20분 기본 TTL의 capability URL을 반환하고, 다운로드 페이지가 BUILDING 상태를 polling합니다. 따라서 worker가 느려서 링크가 없어진 것이 아니라 도구 결과를 최종 답변으로 만드는 orchestration 경계에서 정보가 유실됐습니다.

## URL 뒤의 추가 model turn을 제거했다

기존 ReAct loop는 confirm tool이 URL을 반환한 뒤 모델을 한 번 더 호출해 사용자 문장으로 바꿨습니다. 이 마지막 합성 턴이 60초 SSE 경계 부근에서 끝나지 않으면 ToolMessage는 checkpoint에 남지 않았고 URL도 복구할 수 없었습니다. 전체 export 도구가 LMS 범주에서 빠져 불필요한 조회·prepare 단계가 늘어난 문제도 있었습니다.

전체 자료 요청은 전용 `export_all_lms_materials → confirm_lms_material_export` 두 단계로 줄이고, 성공한 confirm 결과에는 결정적 `terminal_tool_result_formatter`를 적용했습니다. formatter가 파일 수·예상 크기와 링크를 로컬에서 만든 뒤 즉시 최종 AIMessage로 checkpoint합니다. 모델에게 URL을 다시 쓰거나 생략할 기회를 주지 않습니다.

## capability는 문장이 아니라 검증 대상이다

formatter는 단순히 응답에서 `http` 문자열을 찾지 않습니다.

- envelope에 `status: OK`와 object `data`가 모두 있어야 한다.
- scheme은 HTTP(S), userinfo는 없어야 한다.
- origin은 설정된 ssuMCP origin과 정확히 같아야 한다.
- path는 `/api/lms/exports/{jobId}/download`여야 한다.
- 비어 있지 않은 `token` query가 있어야 한다.

다른 origin, `javascript:`, 잘못된 path나 오류 응답은 terminal로 채택하지 않고 기존 오류 처리로 보냅니다. URL을 포함한 terminal message는 사용자에게 전달한 뒤 다음 model history에서는 redaction합니다. 현재 tool result는 formatter만 읽고, 이후 provider prompt나 로그에는 capability를 불필요하게 노출하지 않습니다.

같은 model turn에서 export와 confirm을 함께 요청하면 confirm은 실행하지 않고 `INVALID_TOOL_SEQUENCE`를 반환합니다. preview가 생기기 전에 확정하는 race를 막고, 선행 결과를 받은 다음 별도 tool turn에서만 confirm하게 합니다.

## 렌더링 경계도 같은 allowlist를 사용한다

ssuAI는 assistant message의 HTTP(S) Markdown link와 bare URL만 anchor로 만듭니다. 신뢰 origin, export path와 token이 모두 일치할 때만 긴 URL 대신 “강의 파일 다운로드” action을 표시합니다. 사용자 message나 unsafe scheme은 활성화하지 않고 새 탭에는 `noopener noreferrer`와 접근 가능한 이름을 붙입니다.

[ADR-0022](https://github.com/ghdtjdwn/ssuAgent/blob/main/docs/adr/0022-deterministic-lms-export-download.md)는 실제 transcript, 대안과 테스트 조합을 기록합니다. 실계정 export는 자동화하지 않았고 통제된 운영 확인 대상으로 남겼습니다.

LLM이 자연어를 만드는 능력이 있어도 이미 구조화된 보안 capability를 다시 해석하게 할 이유는 없습니다. 중요한 식별자는 tool contract에서 검증하고 결정적으로 저장하며, UI는 같은 allowlist로 최소한만 활성화해야 링크가 “생성됨”에서 “안전하게 사용할 수 있음”까지 이어집니다.
