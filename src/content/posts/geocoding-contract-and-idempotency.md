---
title: "5만 건 공간 데이터 적재를 재실행 가능하게 만든 경계"
description: "좌표가 없는 공공 CSV를 geocoding해 PostGIS에 적재하면서 자연키, 증분 저장, API 계약 테스트로 운영 재실행을 안전하게 만든 기록입니다."
publishedAt: 2026-07-17
category: data
activity: personal-project
tags: ["ETL", "PostGIS", "Geocoding", "Idempotency"]
project: geuneul
role: "공공데이터 ingest pipeline, geocoding 동시성 제어, 자연키 upsert와 운영 검증 설계·구현"
evidence:
  - "Geuneul ADR-0002·0003의 자연키, bulk upsert, geocoding 재사용 결정"
  - "표준 화장실 CSV 59,768행 사전 감사와 운영 적재 트러블슈팅 기록"
validation:
  - "실제 provider 응답 converter 테스트, chunk upsert 통합 테스트와 동일 파일 재실행"
  - "첫 운영 적재 46,897건, 재실행의 기존 좌표 46,897건 재사용·5,437건 추가와 source key 중복 없음 확인"
limitations:
  - "재시도 뒤에도 provider가 해석하지 못한 옛 주소 1,756건은 좌표 없이 남음"
  - "공공 geocoding quota와 주소 품질에 의존하며 전수 위치 정확도를 현장 검증하지 않음"
featured: true
draft: false
---

## 원본 행 수보다 중요한 것은 다시 돌릴 수 있는가였다

표준 화장실 공공 CSV에는 59,768행이 있었지만 지도에 쓸 좌표가 없었습니다. 주소를 외부 geocoding API에 보내고 PostGIS geometry를 만들어야 했습니다. 수만 건 외부 호출은 중간 실패가 정상인 작업입니다. 그래서 목표를 “한 번에 모두 넣기”가 아니라 “어느 지점에서 멈춰도 안전하게 다시 시작하기”로 잡았습니다.

시설의 DB id는 적재할 때마다 바뀔 수 있으므로 idempotency key가 될 수 없습니다. 원천이 제공한 식별자를 보존해 `(source, source_external_id)`를 자연키로 두고 unique constraint와 `ON CONFLICT` upsert를 적용했습니다. 같은 파일을 다시 읽어도 논리적 시설 수가 늘지 않고, 변경된 운영 정보만 갱신됩니다.

## geocoding은 insert 전에, 성공 결과는 즉시 보존한다

처음에는 원본 row부터 저장하고 나중에 좌표를 채우는 흐름도 고려했습니다. 그러나 좌표 없는 시설이 조회 경로에 섞이고, 실패 상태와 아직 처리하지 않은 상태를 구분하기 어려웠습니다. geocoding이 필요한 row는 좌표 계약을 통과한 뒤 insert하도록 경계를 정했습니다.

반대로 이미 좌표가 저장된 자연키는 외부 API를 다시 호출하지 않습니다. 적재는 1,000행 chunk로 수행하고 각 chunk를 독립적으로 commit합니다. process 하나가 마지막에 실패해도 앞선 좌표와 upsert 결과는 남습니다.

네트워크 대기 시간을 줄이기 위해 virtual thread를 사용하되 semaphore를 8로 제한했습니다. thread를 많이 만들 수 있다는 사실과 provider를 무제한 호출해도 된다는 사실은 다릅니다. semaphore가 외부 quota와 connection pressure의 명시적 backpressure가 됐습니다.

```text
CSV row
  ├─ 자연키가 있고 좌표도 존재 -> 저장 좌표 재사용
  └─ 좌표 없음 -> 주소 정규화 -> geocoder(동시성 8) -> 품질 검사
                                              └─ chunk upsert(1,000)
```

## fake가 숨긴 JSON 생태계 전환 문제

로컬 fake geocoder에서는 pipeline이 통과했지만 운영 적재는 조용히 0건을 반환했습니다. Spring Boot 4 전환 뒤 HTTP client는 Jackson 3 converter를 사용하고 있었는데, 응답 type은 Jackson 2의 `JsonNode`를 기대했습니다. status 200이어도 body 변환이 실패해 결과가 비어 있었습니다.

문제는 fake가 완성된 객체를 바로 반환해 실제 HTTP message conversion을 전혀 거치지 않았다는 점입니다. 실제 provider 형태의 JSON fixture를 `MockRestServiceServer`로 통과시키는 converter test를 추가하고, application이 사용하는 Jackson 세대와 response type을 일치시켰습니다. 이후 유사 client도 검색해 같은 혼용이 없는지 점검했습니다.

## 수량과 의미를 함께 검증한다

첫 운영 성공에서는 46,897개 시설이 geocoding된 좌표와 함께 적재됐습니다. 이후 같은 원본을 다시 실행했을 때 기존 46,897건의 좌표를 외부 호출 없이 재사용하고, 과거 실패분 가운데 5,437건을 새로 geocoding해 총 52,334건으로 늘렸습니다. 자연키 중복은 생기지 않았습니다. 단순 row count 외에 geometry SRID, 유효 좌표 범위와 source별 중복도 검사했습니다.

59,768행 중 재시도 뒤에도 1,756건은 provider가 해석하지 못한 옛 지번·불완전 주소로 남았습니다. 이를 전수 성공으로 포장하지 않습니다. pipeline의 성과는 실패를 분리하고, 성공한 작업을 보존하며, 같은 입력을 안전하게 다시 처리해 새로운 성공분만 추가한 데 있습니다.
