---
title: "생존 점수를 SQL과 Java 두 층으로 나눈 이유"
description: "PostGIS 집계는 사실을 만들고 순수 함수는 정책을 적용하도록 분리해, 누락 데이터와 가중치 변경을 설명 가능한 점수로 만든 설계입니다."
publishedAt: 2026-07-17
category: backend
activity: personal-project
tags: ["PostGIS", "Domain Modeling", "SQL", "Testing"]
project: geuneul
role: "Geuneul 생존 점수의 공간 집계 view, 정책 함수와 결측치 처리 계약 설계·구현"
evidence:
  - "Geuneul ADR-0007·0009·0017의 점수 모델, review 분리와 신뢰도 정책"
  - "시설 freshness·trust·comfort·risk 집계 SQL과 domain score test"
validation:
  - "순수 정책 함수의 경계값·결측 feature 재정규화 단위 테스트"
  - "PostGIS 통합 테스트와 실제 조회에서 GPS 검증 review·weather 주입 경로 확인"
limitations:
  - "가중치는 제품 가설이며 사용자 효용을 입증한 실험 결과가 아님"
  - "review가 적은 지역과 지역 단위 weather에서는 개인화·미세 기후를 충분히 반영하지 못함"
featured: true
draft: false
---

## 하나의 거대한 SQL은 계산은 해도 설명하기 어렵다

Geuneul의 생존 점수는 주변 시설 수만 세는 값이 아닙니다. 시설 데이터의 최신성, 출처 신뢰도, 운영 여부, GPS가 검증된 review, 날씨 위험까지 함께 반영합니다. 처음부터 모든 가중치와 예외를 하나의 SQL에 넣으면 조회는 한 번에 끝나지만 정책 변경의 이유와 회귀 범위를 설명하기 어렵습니다.

그래서 계산을 두 층으로 나눴습니다.

```text
PostGIS SQL view  -> 관찰 가능한 feature
pure Java policy -> feature를 점수와 설명으로 변환
```

SQL은 반경 안의 시설과 거리, 영업 상태, freshness·trust signal을 집계합니다. Java 함수는 동일한 feature vector에 가중치, cap, risk penalty와 결측치 정책을 적용합니다. database는 공간 사실을 만들고 application은 제품 정책을 소유합니다.

## 없는 값을 0점으로 벌주지 않는다

특정 지역에 review가 없거나 weather provider가 일부 신호를 주지 못할 수 있습니다. 단순히 0으로 채우면 “관측되지 않음”을 “나쁨”으로 오해합니다.

점수 함수는 사용 가능한 feature의 가중치만 다시 합산해 100점 범위로 재정규화합니다. 예를 들어 comfort가 없으면 comfort 점수를 0으로 넣는 대신 나머지 freshness, trust, risk의 상대 가중치를 보존합니다. 응답에는 사용한 signal과 제외한 signal을 함께 남겨 같은 숫자라도 근거를 설명할 수 있게 했습니다.

누락을 무조건 무시하지도 않습니다. 반드시 필요한 위치나 유효 반경이 없으면 계산 자체를 거부합니다. “없어도 계산 가능한 선택 feature”와 “계약을 성립시키는 필수 입력”을 구분했습니다.

## review와 공공시설 사실을 섞지 않는다

사용자 review를 원본 시설 row에 덮어쓰면 공공데이터의 사실과 주관적 평가의 수명주기가 결합됩니다. review는 별도 aggregate로 유지하고, GPS 검증·상태 조건을 통과한 것만 점수 feature로 사용합니다. 원본 시설의 신뢰도와 사용자의 체감 평가는 응답에서 별도 근거로 제시됩니다.

weather도 시설마다 호출하지 않습니다. 한 번의 검색 요청에서 지역·시각 기준 weather를 한 번 가져와 모든 candidate 계산에 주입합니다. 같은 요청 안에서 서로 다른 날씨 snapshot이 섞이는 것을 막고 외부 호출 수도 제한합니다.

## pure policy가 만든 검증 가능성

정책 함수는 database나 clock 없이 동일 입력에 동일 출력을 냅니다. 경계값, cap, risk penalty, feature 누락 시 재정규화를 table-driven unit test로 고정했습니다. PostGIS 통합 테스트에서는 SQL view가 기대한 거리와 집계를 만드는지 따로 검증했습니다.

이 분리 덕분에 점수가 이상할 때 질문도 명확해집니다.

- SQL feature가 잘못됐는가
- 정책 weight나 cap이 잘못됐는가
- 어떤 signal이 누락돼 재정규화됐는가
- review가 GPS·상태 조건을 충족했는가

현재 가중치는 실제 사용자 실험으로 최적화된 값이 아니라 제품 가설입니다. 이 구조의 장점은 그 한계를 숨기는 것이 아니라, 향후 실험에서 정책만 교체하고 동일한 공간 사실과 회귀 테스트를 유지할 수 있다는 데 있습니다.
