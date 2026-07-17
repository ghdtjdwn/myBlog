---
title: "429를 해결하자 비로소 보인 성공 경로의 버그"
description: "RAG 임베딩 실패를 RPM이 아닌 TPM 문제로 좁히고, rate limit 뒤에 숨어 있던 Jackson 응답 계약까지 고친 기록입니다."
publishedAt: 2026-07-17
category: troubleshooting
activity: personal-project
tags: ["RAG", "Rate Limit", "Jackson", "Incremental Processing"]
project: ssu-platform
role: "ssuMCP RAG 임베딩 장애 재현, provider 한도 추론, 배치 제어와 응답 DTO 수정"
evidence:
  - "ssuMCP TROUBLESHOOTING의 RAG embedding 429·Jackson primitive null 역직렬화 기록"
  - "ADR-0065의 증분 임베딩 저장·재시도 경계와 실제 임베딩 테이블 점검"
validation:
  - "동일 endpoint에 실제 한국어와 반복 문자열의 배치 크기를 바꾼 교차 실험"
  - "embedding row 0개에서 217개 생성, 검색 응답의 embeddingUsed=true와 fusionMethod=rrf 확인"
  - "성공 응답 fixture와 유사 DTO 회귀 검사"
limitations:
  - "확인한 한도는 당시 provider 계정과 모델의 quota이며 보편적인 임계값이 아님"
  - "217개 문서의 적재 성공은 검색 품질 자체를 증명하지 않음"
featured: true
draft: false
---

## 429는 원인 이름이 아니라 관찰값이었다

RAG 검색이 계속 lexical fallback으로만 동작했습니다. 데이터베이스의 embedding row는 0개였고 외부 embedding API는 429를 반환했습니다. 처음에는 요청 횟수 제한, 잘못된 API key, 네트워크 egress를 모두 후보로 두었습니다.

추측 대신 같은 endpoint를 직접 호출했습니다. 단건 요청은 200이었기 때문에 key와 egress는 제외할 수 있었습니다. 이후 배치 크기와 입력의 정보량을 따로 바꿨습니다.

```text
실제 한국어 16개  -> 200
실제 한국어 48/96개 -> 429
반복 문자열 96개 -> 200
```

요청 수가 같아도 실제 한국어 토큰이 많을 때만 실패했습니다. 이 결과는 RPM보다 TPM 한도가 병목이라는 가설과 일치했습니다. 압축 가능한 반복 문자열을 대조군으로 둔 덕분에 단순한 배열 길이 제한과도 구분할 수 있었습니다.

## 로그에 상태 코드만 남기지 않는다

기존 client는 429라는 상태만 남기고 provider 응답 본문을 버렸습니다. 장애를 분류하려면 retry 가능 여부와 quota 종류가 필요합니다. 오류 본문을 민감정보 없이 구조화해 남기고, embedding batch를 8개로 낮춘 뒤 batch 사이에 15초 간격을 뒀습니다.

여기서 중요한 선택은 전체 corpus를 하나의 transaction처럼 취급하지 않은 것입니다. 성공한 batch는 즉시 저장하고 실패 지점부터 재개할 수 있게 했습니다. 장시간 작업의 마지막 요청이 실패해 앞선 결과까지 잃는 방식보다, 중복을 허용하되 idempotent하게 이어가는 편이 운영 비용이 낮았습니다.

## 실패 경로가 사라지자 성공 경로가 깨졌다

rate limit을 넘긴 뒤에도 작업은 완료되지 않았습니다. 이번에는 provider의 200 응답을 Jackson이 읽지 못했습니다. 응답 DTO에는 primitive `int`인 `index`가 있었지만 실제 성공 응답 일부에는 그 필드가 없었습니다. 실패 중에는 한 번도 도달하지 못했던 decode 경로였습니다.

사용하지 않는 필드를 삭제하고, nullable하지 않은 primitive를 가진 유사 응답 DTO도 함께 검색했습니다. 단순히 `Integer`로 바꾸지 않은 이유는 업무 로직에서 필요하지 않은 provider 세부 필드를 계약으로 들고 있을수록 변경 표면만 커지기 때문입니다. fixture 기반 성공 응답 테스트를 추가해 200 이후의 decode까지 회귀 범위에 넣었습니다.

## 복구의 정의를 검색까지 확장한다

최종 확인에서는 embedding row가 0개에서 217개로 늘었습니다. 실제 검색 응답도 `embeddingUsed: true`, `fusionMethod: rrf`를 반환해 vector 검색과 lexical 검색의 융합 경로가 선택됐음을 확인했습니다.

이 사례에서 가장 유용했던 순서는 다음과 같습니다.

1. 단건 성공으로 인증·egress를 먼저 제외한다.
2. 입력 크기와 의미 정보량을 분리해 quota 종류를 추론한다.
3. batch를 줄이기 전에 성공 결과를 증분 저장할 경계를 만든다.
4. 오류가 사라진 뒤에는 성공 응답의 decode와 최종 소비 경로까지 확인한다.

적재 성공이 곧 검색 품질은 아닙니다. 217개라는 수치는 pipeline 복구의 증거일 뿐, relevance 평가는 별도의 query set과 품질 지표로 다뤄야 합니다.
