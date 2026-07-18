---
title: "Linux가 숨긴 SQLite connection 누수를 Windows CI가 찾았다"
description: "Python with sqlite3.Connection이 연결을 닫지 않아 WinError 32가 난 문제를 lifecycle·UTF-8·Path 의미 단위로 고친 이식성 기록입니다."
publishedAt: 2026-07-18
category: troubleshooting
activity: competition
tags: ["Python", "SQLite", "Windows", "CI"]
project: unithon-macro
role: "Macro durable order queue의 connection lifecycle과 Linux·Windows 품질 workflow 수정·검증"
evidence:
  - "Macro docs/troubleshooting/2026-windows-ci-portability와 SQLite queue 구현"
  - "Ubuntu 통과 후 Windows 임시 DB 삭제에서 발생한 WinError 32 재현"
validation:
  - "macOS 전체 unittest·compileall과 Ubuntu·Windows CI quality job 성공"
  - "transaction 뒤 임시 SQLite file 즉시 삭제, 한국어 log와 Windows path 테스트"
limitations:
  - "PR 검증에서 발견돼 실제 사용자·주문·결제 영향은 없었음"
  - "실제 Windows UIA와 물리 kiosk end-to-end 검증과는 별도 범위"
  - "SQLite 단일 process queue의 lifecycle 사례이며 다중 host database 동시성을 다루지 않음"
featured: true
draft: false
---

## 모든 assertion이 끝난 뒤 cleanup에서 실패했다

Macro의 주문 queue는 SQLite로 `queued → claimed → awaiting_handoff/uncertain → terminal` 상태와 멱등 key를 보존합니다. Linux CI에서는 FIFO, 중복 방지와 복구 테스트가 통과했지만 Windows job은 논리 검증이 끝난 뒤 임시 `orders.sqlite3`를 삭제할 때 `WinError 32`로 실패했습니다.

같은 job에서 한국어 상태 log는 cp1252 console에서 `UnicodeEncodeError`를 냈고, 설정 path를 POSIX slash 문자열 suffix로 비교한 테스트도 Windows separator에서 깨졌습니다. 세 실패는 서로 달라 보였지만 모두 개발 OS의 암묵적 기본값을 contract로 착각한 결과였습니다.

## SQLite context manager는 transaction을 닫지 connection을 닫지 않는다

queue 코드는 다음 형태였습니다.

```python
with sqlite3.connect(path) as connection:
    # query and update
```

Python의 `sqlite3.Connection` context manager는 block 성공 시 commit, 예외 시 rollback을 수행하지만 connection 자체를 close하지 않습니다. macOS와 Linux에서는 열린 handle이 있어도 unlink가 허용되거나 객체 정리 시점이 빨라 누수가 숨었습니다. Windows는 열린 file handle의 삭제를 막아 lifecycle 오류를 즉시 드러냈습니다.

[Python sqlite3 문서](https://docs.python.org/3/library/sqlite3.html#how-to-use-the-connection-context-manager)는 context manager가 connection을 자동으로 닫지 않는다고 명시합니다.

## transaction과 resource 수명을 하나의 seam에 모았다

모든 queue 접근이 사용하는 전용 context manager를 만들고 `finally`에서 명시적으로 닫았습니다.

```python
@contextmanager
def open_queue(path):
    connection = sqlite3.connect(path)
    try:
        with connection:
            yield connection
    finally:
        connection.close()
```

cleanup sleep이나 삭제 retry는 채택하지 않았습니다. 테스트만 통과시켜 실제 handle 누수를 남기기 때문입니다. WAL을 제거하면 동시 접근 성질을 약화하면서 connection lifecycle은 고쳐지지 않습니다.

## 문자열이 아니라 플랫폼 독립 의미를 검증했다

한국어 운영 진단을 없애는 대신 CI에서 Python UTF-8 mode를 명시했습니다. path는 slash를 치환하지 않고 `pathlib.Path.parts`로 마지막 의미 요소를 비교했습니다. encoding과 separator를 운영체제 기본값에 맡기지 않았습니다.

Mac에서 전체 unittest와 `compileall`을 다시 수행하고 같은 quality workflow를 Ubuntu와 Windows에서 모두 통과시켰습니다. 임시 DB는 transaction 종료 직후 삭제할 수 있었고 한국어 log와 config path 테스트도 유지됐습니다. [문제 해결 원문](https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2026-windows-ci-portability.md)은 대안과 영향 범위를 기록합니다.

cross-platform CI의 가치는 OS별 조건문을 늘리는 데 있지 않았습니다. 한 OS가 관대하게 숨긴 resource lifecycle을 다른 OS가 실패로 바꿔 주었고, 그 실패를 cleanup 우회가 아니라 실제 소유권 계약 수정으로 해결했습니다.
