---
title: "순차 자동채점기를 5.73초 병렬 pipeline으로 바꾼 과정"
description: "학생별 pthread, fork/exec 전처리 overlap, 정답 cache와 buffered I/O를 결합하되 timeout과 결과 순서를 보존한 시스템 프로그래밍 과제 회고입니다."
publishedAt: 2026-07-18
category: engineering
tags: ["C", "POSIX", "pthread", "Performance"]
project: cs-coursework
role: "개인 시스템 프로그래밍 과제의 baseline 분석, 병렬 pipeline·process timeout과 I/O 최적화 구현"
evidence:
  - "cs-coursework Linux_System_Programming README와 ssu_score C source"
  - "과제 당시 기록된 PASS 3회와 5.742s·5.732s·5.732s 실행 결과"
validation:
  - "기록상 세 번 모두 정답 일치 PASS와 당시 5초대 최고 배점 구간 70/70"
  - "현재 공개 main source를 macOS에서 GNU11/pthread syntax compile해 구조 재확인"
limitations:
  - "원본 과제 dataset과 채점 환경이 없어 이번 감사에서 5.73초를 재측정하지 않음"
  - "현재 compiler audit에서 format·return-path·dangling-else warning이 남아 있음"
  - "수업용 batch grader이며 untrusted code를 격리하는 production sandbox가 아님"
featured: false
draft: false
---

## 문제는 thread 하나를 추가하는 것으로 끝나지 않았다

시스템 프로그래밍 과제의 `ssu_score`는 학생별 빈칸 답과 C 프로그램을 정답과 비교해 `score.csv`를 만듭니다. 정확한 결과를 전제로 전체 수행 시간이 평가 대상이었고, 출발점은 학생을 순서대로 읽고 문제마다 compile·execute·compare를 반복하는 baseline이었습니다.

학생마다 pthread를 하나씩 만드는 것만으로는 compile process, 정답 전처리와 file I/O가 여전히 순차 critical path에 남습니다. 그래서 채점 단계를 네 phase로 다시 나눴습니다.

```text
1. create score.csv header once
2. overlap answer preprocessing with student precompile/execute
3. grade students in pthread workers from prepared outputs
4. join and write per-student CSV buffers in deterministic order
```

병렬화의 단위와 결과 합치는 순서를 함께 설계해야 속도를 얻으면서 기존 CSV contract를 지킬 수 있었습니다.

## process와 thread의 역할을 분리했다

학생 C 프로그램은 shell `system()` 호출 대신 `fork → execvp → waitpid`로 compile하고 실행했습니다. child의 stdin을 `/dev/null`로 연결해 입력 대기 프로그램이 전체 batch를 붙잡지 않게 했습니다. parent는 `waitpid(WNOHANG)`으로 상태를 polling하고 5초를 넘은 child에 `SIGKILL`을 보낸 뒤 반드시 회수합니다.

정답 compile·execute는 별도 child process에서 진행하고, parent는 동시에 빈칸 정답 cache와 학생 프로그램 전처리를 수행합니다. 준비가 끝난 뒤 학생별 pthread가 이미 생성된 `.stdout`과 cache를 비교합니다. compile을 grading hot path에서 빼고 독립 작업의 시간을 겹쳤습니다.

이 구조는 무제한 multi-tenant 실행기가 아닙니다. 과제 dataset 안에서 process fan-out을 사용했고 namespace·seccomp·cgroup sandbox가 없으므로 임의 사용자 code를 받는 서비스에는 그대로 사용할 수 없습니다.

## syscall 횟수와 결과 결정성을 같이 줄였다

빈칸 정답은 학생마다 다시 open/read/close하지 않고 한 번 memory에 올렸습니다. 1 byte씩 읽던 경로는 block read와 `lseek`로 바꾸고, CSV도 column마다 write하지 않고 학생별 buffer를 만들었습니다.

worker가 공유 file descriptor에 동시에 쓰면 row가 섞이고 lock cost가 생깁니다. 각 thread가 자기 buffer만 만들고 `pthread_join` 뒤 원래 학생 순서대로 한 번씩 기록하게 해 병렬 계산과 결정적 output을 분리했습니다.

## 역사적 측정과 현재 검증을 구분한다

과제 README에는 정답 일치 PASS 세 번과 5.742초, 5.732초, 5.732초가 기록돼 있습니다. 당시 구간표의 5초대 최고 수행 시간 점수 70/70에 해당했습니다. 이 수치는 현재 machine에서 다시 만든 benchmark가 아니라 당시 과제 환경의 결과입니다.

이번 블로그 감사에서는 공개 main의 [소스와 기록](https://github.com/ghdtjdwn/cs-coursework/tree/main/Linux_System_Programming)을 대조하고 GNU11/pthread syntax compile을 수행했습니다. compile은 성공했지만 format type, 일부 return path와 dangling else warning이 남았습니다. 원본 dataset이 없어 PASS와 시간은 재실행했다고 주장하지 않습니다.

이 과제에서 배운 핵심은 “thread가 빠르다”가 아닙니다. 전체 critical path를 process 준비, cached comparison과 ordered output으로 나누고, 멈추는 child를 회수하는 실패 경계까지 포함해야 병렬화가 실제 end-to-end 시간을 줄인다는 점입니다.
