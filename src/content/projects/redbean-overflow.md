---
title: "RedbeanOverflow"
summary: "DOCX 어휘와 HWP 템플릿에서 시험지와 답지를 만드는 HWPX/XML 자동화 프로젝트입니다."
status: complete
statusNote: "문서 자동화 도구 자체는 완성됐지만 사용자 직접 기여를 입증할 Git 기록이 없어 블로그 공개는 계속 보류합니다."
activity: other
visibility: private
role: "참여·검수 범위 추가 확인 필요"
teamScope: "현재 Git 기록은 kwon32 기여만 확인되어 사용자 직접 구현으로 공개하지 않음"
contributionEvidence: ["로컬 결과와 문서 존재", "사용자 연결 commit/PR 근거 없음"]
tags: ["HWPX", "XML", "DOCX", "Document Automation"]
infra: ["Local Python CLI"]
metrics:
  - { label: "Publication", value: "On hold" }
order: 11
featured: false
draft: true
repositories: []
recordPlan: "역할과 저작 기여를 먼저 확인합니다. 확인 전에는 기술 세부를 개인 성과로 공개하지 않고, 이후에도 실제 참여·검수 범위와 한계만 기록합니다."
recordLinks: []
---

## 프로젝트 맥락

HWPX 내부 XML을 직접 조작해 기존 표와 서식을 유지하면서 단어와 뜻을 채웁니다. 고정 seed로 시험지의 빈칸을 재현하고 답지와 시험지를 함께 생성합니다.

DOCX에서 어휘를 읽을 때는 `python-docx`의 고수준 구조를 사용하고 필요한 경우 XML fallback으로 표를 해석합니다. HWP 템플릿은 HWPX ZIP/XML로 변환한 뒤 namespace, 표 셀과 문단 속성을 보존하며 텍스트를 교체합니다. 시험지와 답지가 같은 seed와 항목 순서를 공유하도록 설계된 로컬 Python CLI입니다.

## 현재 코드의 범위

현재 README와 코드 기준으로 워드마스터 템플릿의 20개 슬롯을 채웁니다. 하루 항목이 20개를 넘거나 뜻이 두 줄을 초과하면 절삭될 수 있으며, Ollama를 이용한 뜻 요약은 연결되지 않았습니다. 과거 검수 문서의 더 큰 수치보다 현재 코드와 README를 최신 근거로 봅니다.

## 공개 보류 이유

기술적으로는 좋은 글감이지만 현재 확인한 Git 이력만으로 홍성주의 직접 구현 범위를 입증할 수 없습니다. 역할을 확인한 뒤 참여·검수·문제 정의 중 실제 범위만 공개합니다.

저장소 Git 작성자는 다른 사람으로 확인되고 사용자 계정과 연결된 commit·PR은 없습니다. 기존 문서에도 구현과 검수 주체가 별도로 적혀 있어, 결과 파일을 갖고 있다는 이유만으로 개인 구현 성과로 표현하지 않습니다. 역할이 확인되면 HWPX namespace, Hancom layout cache와 문서 무결성 검증 중 실제 참여한 부분만 글로 다룹니다.

## 검증과 한계

ZIP 무결성, 원문 대조, namespace·line spacing·layout cache 관련 검수 자료는 존재합니다. 다만 이 검증도 사용자 개인 성과로 귀속하지 않습니다. 역할 확인, 공개 권한과 현재 템플릿 제한을 모두 정리할 때까지 `draft: true`를 유지합니다.
