---
title: "대시보드는 정상인데 알림과 trace가 비어 있던 이유"
description: "Prometheus label 계약과 Spring Boot tracing autoconfiguration을 live data에서 역으로 검증해 관측성의 조용한 실패를 고친 기록입니다."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["Prometheus", "OpenTelemetry", "Tempo", "Spring Boot"]
project: ssu-platform
role: "ssu 플랫폼 Prometheus rule·OpenTelemetry trace pipeline 진단과 회귀 검증"
evidence:
  - "5주 동안 평가되지 않은 alert selector와 Tempo spans=0 트러블슈팅 기록"
  - "live Prometheus series, application classpath·environment, collector와 Tempo 상태 비교"
validation:
  - "잘못된 application selector 0 series와 실제 job selector 69 series 비교"
  - "수정한 7개 live alert rule 평가와 실제 application trace의 Tempo 조회"
limitations:
  - "trace 수집 성공은 sampling 적정성이나 모든 alert threshold의 운영 품질을 보장하지 않음"
  - "무해한 합성 장애로 검증했으며 실제 사용자 장애를 만들지는 않음"
featured: true
draft: false
---

## 관측성도 조용히 실패한다

대시보드는 지표를 보여주고 있었지만 두 개의 핵심 alert가 약 5주 동안 한 번도 의미 있게 평가되지 않았습니다. 별도로 Tempo에는 application span이 0개였습니다. exporter나 collector가 명시적으로 실패하지 않아 둘 다 “트래픽이 조용한 상태”처럼 보였습니다.

첫 번째 문제는 Prometheus rule의 label 계약이었습니다. rule은 `application="ssuai"`를 선택했지만 scrape된 실제 metric에는 그 label이 없었고 `job="ssuai-backend"`가 있었습니다.

```text
count({application="ssuai"})  # 0 series
count({job="ssuai-backend"})  # 69 series
```

PromQL이 문법적으로 유효하고 결과가 빈 vector이면 Prometheus는 오류를 내지 않습니다. alert도 단순히 firing하지 않습니다. 대시보드 쿼리는 이미 고쳐졌지만 별도 파일의 rule은 과거 selector를 유지하고 있었습니다.

## configuration을 읽지 말고 데이터에서 label을 찾는다

rule을 수정하기 전에 live series의 label set을 조회했습니다. 기대한 이름을 configuration에서 복사하는 대신, 실제 scrape target이 노출한 `job`, `namespace`, `service` 조합을 alert의 contract로 삼았습니다. 모든 rule expression을 live Prometheus에 직접 평가하고, 결과가 빈 이유가 정상 트래픽인지 selector 불일치인지 구분했습니다.

수정 뒤 7개 rule이 live data를 대상으로 평가되는 것을 확인했습니다. 실제 장애를 만들지 않고도 안전한 합성 조건과 현재 series를 이용해 selector와 expression을 검증했습니다.

## receiver가 건강해도 application은 span을 보내지 않을 수 있다

Tempo의 경우 collector endpoint와 network path는 정상이었습니다. application Pod에도 OTLP 관련 환경 변수가 있었습니다. 하지만 exporter 초기화 로그도, export 오류도 없었습니다. “전송에 실패한다”기보다 “전송할 component가 생성되지 않았다”는 쪽에 가까운 증거였습니다.

Spring Boot major version 전환 뒤 property 이름만 옮기면 tracing이 활성화될 것이라 생각했지만, classpath에 필요한 OpenTelemetry starter가 없었습니다. 환경 변수는 autoconfiguration을 호출하지 않습니다. starter를 추가해 tracer provider와 exporter bean이 생성되도록 하고, 중복 전송을 피하기 위해 사용하지 않는 OTLP metrics export는 명시적으로 껐습니다.

application을 재기동한 뒤 trace ID가 생성되는 것만 보지 않았습니다. collector를 거쳐 Tempo에서 해당 service의 실제 span을 검색해 end-to-end 경계를 닫았습니다.

## “0”의 의미를 검증하는 운영 습관

관측성 시스템의 위험한 실패는 빨간 오류가 아니라 빈 결과입니다. 이를 줄이기 위해 다음 검증을 배포 조건에 포함했습니다.

- alert selector가 live series를 하나 이상 선택하는가
- dashboard와 rule이 같은 label vocabulary를 쓰는가
- tracing 관련 property뿐 아니라 autoconfiguration class가 classpath에 있는가
- application이 만든 trace를 최종 backend에서 다시 찾을 수 있는가

7개 rule 평가와 Tempo trace 조회는 pipeline이 연결됐다는 근거입니다. sampling 비율, alert threshold, notification 전달 품질은 별도의 운영 검증 대상이며 이 결과로 대신 주장하지 않습니다.
