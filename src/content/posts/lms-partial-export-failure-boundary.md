---
title: "PDF 70개를 살리기 위해 전체 성공과 실패의 경계를 다시 그린 방법"
description: "일반 첨부 4개의 실패가 정상 PDF 70개까지 폐기하던 LMS 내보내기에서 URL 신뢰 경계와 부분 성공 정책을 함께 설계한 기록입니다."
publishedAt: 2026-07-17
category: backend
activity: personal-project
tags: ["LMS", "SSRF", "Partial Failure", "Async Jobs"]
project: ssu-platform
role: "LMS export resolver·worker 실패 분류, origin 검증과 운영 복구 검증"
evidence:
  - "ssuMCP PR #224와 2026-07-16 LMS 74-item export 트러블슈팅 기록"
  - "LMS ZIP export, single-use token과 shared PVC ADR"
validation:
  - "relative·absolute URL, origin 거부, 부분·전체 실패, 404·410·429·503과 retry temp truncation fixture"
  - "전체 Gradle·JaCoCo, PR/main CI와 Security workflow 성공"
  - "동일 실계정 74-item job의 READY와 archive 다운로드 확인"
limitations:
  - "화면 증거만으로 문제 ZIP 4개가 archive에 포함됐는지 안전 보고서에 누락됐는지는 구분하지 못함"
  - "5분 이상 build의 lease heartbeat와 다운로드 TTL 잠식은 별도 과제"
  - "사용자 파일 URL, content id, cookie와 원시 예외는 공개하지 않음"
featured: true
draft: false
---

## 네 파일의 실패가 70개 성공을 지웠다

한 학기의 비영상 강의자료 74개를 ZIP으로 내보내는 작업에서 PDF 70개만 선택하면 약 312MB archive가 정상 생성됐습니다. 일반 ZIP 첨부 4개만 선택하면 실패했고, 74개 전체를 선택하면 이미 내려받은 PDF까지 폐기됐습니다.

처음에는 네 파일의 비어 있는 `sizeBytes`와 합계 0이 원인이라고 생각했습니다. 그러나 worker는 예상 크기로 파일을 선할당하지 않았고 실제 stream byte로 한도를 적용했습니다. PDF 70개와 바깥 ZIP 압축이 성공한 A/B 결과도 총용량, 파일 수와 archive 생성기를 원인에서 제외했습니다.

문제는 URL 계약과 실패 단위였습니다.

- PDF fixture의 다운로드 URI는 상대경로라 base URL 문자열 접두가 우연히 맞았습니다.
- 일반 첨부는 absolute Canvas/Commons URI를 반환할 수 있는데 같은 접두 로직이 잘못된 URL을 만들었습니다.
- 선택 loop 전체가 하나의 catch-all에 있어 항목 하나의 resolve 실패가 job 전체를 `FAILED`로 만들었습니다.

`sizeBytes`는 원인이 아니라 선택적 metadata enrichment가 이미 실패하고 있다는 증상이었습니다.

## 부분 성공과 fail-closed를 동시에 유지한다

모든 예외를 건너뛰면 archive는 만들어집니다. 하지만 인증 만료, owner revocation, rate limit, 서버 한도나 내부 저장 장애까지 성공으로 숨길 수 있습니다. 반대로 하나의 지원 가능성 오류로 전체 job을 죽이면 정상 자료를 보존하지 못합니다.

실패를 다음처럼 분류했습니다.

| 범위 | 처리 |
| --- | --- |
| metadata parse, 지원하지 않는 capability, 404·410 | 해당 항목 제외 |
| 하나 이상 파일 성공 | 누락 보고서를 포함한 부분 `READY` |
| 인증·owner 폐기, 429, 400, 소진된 5xx | 전체 실패 |
| timeout, 크기·디스크 한도, 내부 저장 오류 | 전체 실패 |
| 모든 항목 제외 | 빈 성공 ZIP이 아니라 전체 실패 |

부분 성공 ZIP에는 `_ssuAI_export_report.txt`를 넣어 누락된 과목·파일명과 고정된 사유만 알립니다. 원시 URL, content id, cookie와 예외 본문은 archive, metric과 log 어디에도 남기지 않습니다.

## absolute URL 지원이 SSRF 허용이 되지 않게

상대 URI는 문자열 연결이 아니라 표준 URL resolve로 Commons base에 붙입니다. absolute HTTP(S) URI는 설정된 Canvas 또는 Commons의 scheme, host와 effective port가 모두 정확히 일치할 때만 허용합니다.

userinfo나 origin mismatch는 `HEAD`와 `GET` 전에 거부하고, cookie jar도 같은 origin 경계를 따릅니다. “absolute URL도 지원한다”를 “외부 주소에 인증 cookie를 보내도 된다”로 해석하지 않게 한 것입니다.

transient 실제 download는 새로 truncate한 temp file로 한 번만 재시도합니다. 이전 시도의 일부 byte가 남은 파일에 이어 쓰면 손상된 archive entry를 만들 수 있기 때문입니다. 쓰기 재시도와 달리 외부 파일 GET은 이 제한된 조건에서 안전하게 다시 시작할 수 있습니다.

## 비동기 artifact의 다른 생명주기 경계

이 export 경로는 파일 수집만으로 끝나지 않습니다.

- job과 token hash는 DB가 소유합니다.
- ZIP은 단일 노드의 공유 PVC에서 두 backend replica가 함께 읽습니다.
- 실제 byte stream과 flush가 끝난 뒤에만 `READY → DOWNLOADED` 조건부 UPDATE로 token을 소비합니다.
- 스트림 중간에 끊기면 token을 소비하지 않아 TTL 안에서 다시 받을 수 있습니다.

동시 in-flight 다운로드 둘을 완전히 직렬화하지는 않습니다. 긴 stream 동안 DB row lock을 유지하는 비용보다 성공 완료 뒤 replay를 막는 현재 threat boundary를 선택했습니다.

## 운영에서 확인한 범위

[ssuMCP PR #224](https://github.com/ghdtjdwn/ssuMCP/pull/224)는 relative/absolute URI, origin 거부, 부분 성공, all-skipped, 인증 실패, 404·410, 400·429·503과 temp truncation을 fixture로 고정했습니다. 전체 Gradle·JaCoCo와 PR/main CI·Security workflow가 성공했습니다.

배포 뒤 동일 계정의 74-item job이 `READY`가 되고 archive download까지 완료돼 “네 항목 때문에 전체 job이 사라지는” 장애는 복구됐습니다. 다만 화면만으로 네 일반 ZIP이 실제 entry로 들어갔는지, 안전 보고서에 누락됐는지는 구분하지 못했습니다. 따라서 “74개 모두 수집 성공”이 아니라 “전체 job 실패가 복구되고 정상 자료가 보존됐다”까지만 주장합니다.
