---
title: "32비트 문자열에서 RISC-V fetch-decode-execute까지 구현하기"
description: "R·I·S·B type bit field, sign extension과 두 번의 scan으로 branch label을 만든 뒤 제한된 가상 CPU에서 실행한 컴퓨터 구조 과제 회고입니다."
publishedAt: 2026-07-18
category: engineering
tags: ["C", "RISC-V", "Computer Architecture", "Bit Manipulation"]
project: cs-coursework
role: "개인 컴퓨터 구조 과제의 RV32I subset decoder, two-pass disassembler와 CPU simulator 구현"
evidence:
  - "cs-coursework Computer_Architecture README와 src/main.c"
  - "opcode·funct·immediate bit extraction, label table과 execution loop의 실제 구현"
validation:
  - "공개 main blob과 로컬 source hash 일치 확인"
  - "현재 main.c를 C11 syntax compile해 decoder·execution source의 컴파일 가능성 확인"
limitations:
  - "저장소에 자동화된 ISA test vector나 reference emulator 비교가 없음"
  - "과제 명세에 따라 LW는 0을 반환하고 SW는 무시해 실제 memory subsystem을 구현하지 않음"
  - "RV32I 전체가 아닌 R/I/load/store/branch 일부와 x1~x5 결과 출력 범위"
featured: false
draft: false
---

## assembly 문자열이 아니라 32개 bit에서 시작했다

컴퓨터 구조 과제는 각 줄이 정확히 32자의 `0`·`1`인지 검증한 뒤 opcode, `funct3`, `funct7`, register와 immediate를 bit offset으로 추출합니다. 지원 범위는 산술·논리 R type, immediate I type, LW, SW와 조건 branch입니다.

RISC-V의 immediate는 type마다 물리적 bit 위치가 다릅니다. I type은 상위 12bit를 sign-extend하고, S type은 `imm[11:5]`와 `imm[4:0]`을 합칩니다. B type은 다음처럼 흩어진 bit를 다시 배치한 뒤 13bit signed offset으로 만듭니다.

```text
instruction: imm[12] | imm[10:5] | rs2 | rs1 | funct3 | imm[4:1] | imm[11] | opcode
rebuild:     imm[12|11|10:5|4:1|0]
```

shift instruction에서는 SRL과 SRA를 `funct7`로 구분하고, C의 unsigned cast를 사용해 logical right shift와 arithmetic right shift의 의미를 나눴습니다.

## branch label은 두 번 읽어야 안정적으로 만들 수 있다

한 번의 scan에서 instruction을 바로 출력하면 앞으로 가는 branch의 대상 label을 아직 모를 수 있습니다. 첫 pass는 모든 branch offset을 계산해 target instruction index를 검증하고 label 번호를 table에 기록합니다. 두 번째 pass가 각 instruction을 assembly로 출력하면서 target 위치 앞에 `labelN:`을 삽입합니다.

```text
pass 1: decode branches -> validate target -> assign lineLabels[target]
pass 2: emit label -> disassemble instruction -> reference label
```

잘못된 `funct7`, 4-byte alignment가 맞지 않거나 파일 범위를 벗어나는 branch target은 output을 남기지 않고 `Instruction Format Error!`로 처리합니다.

## 같은 decoder 의미를 가상 CPU 실행에 사용했다

`CPU` 구조체는 32개 register와 PC를 가집니다. PC 1000에서 시작해 `(pc - 1000) / 4`로 instruction을 fetch하고 decode한 뒤 다음 PC를 결정합니다. 일반 instruction은 4를 더하고 branch 조건이 참이면 signed immediate를 더합니다. `x0` write는 무시하고 SRL/SRA를 구분합니다.

여기서 “CPU simulator”의 범위를 과장하면 안 됩니다. 과제 명세에 따라 LW는 destination에 0을 넣고 SW는 memory write를 무시합니다. cache, exception, CSR와 실제 memory model이 없는 ISA 학습용 subset입니다.

## 구현 증거와 정확성 증거를 구분한다

이번 감사에서 [공개 main source](https://github.com/ghdtjdwn/cs-coursework/tree/main/Computer_Architecture)의 blob hash를 로컬 파일과 대조하고 C11 syntax compile을 통과시켰습니다. 하지만 repository에 automated instruction vector나 Spike 같은 reference model과 비교한 test가 없어 ISA 정확성을 완전히 검증했다고 주장하지 않습니다.

이 과제의 가치도 production emulator 성능이 아닙니다. instruction format 표의 각 bit가 decoder code, branch target과 PC transition으로 어떻게 이어지는지를 직접 구현한 기록입니다. 다음 단계라면 table-driven decode와 golden vector를 추가하고, memory abstraction을 분리해 과제용 stub와 실제 load/store model을 교체 가능하게 만들 것입니다.
