---
title: "From a 32-bit string to a RISC-V fetch-decode-execute loop"
description: "A computer-architecture retrospective on R, I, S, and B bit fields, sign extension, two-pass branch labels, and a deliberately limited virtual CPU."
publishedAt: 2026-07-18
category: engineering
tags: ["C", "RISC-V", "Computer Architecture", "Bit Manipulation"]
project: cs-coursework
role: "Implemented the coursework RV32I-subset decoder, two-pass disassembler, and CPU simulator"
evidence:
  - "The cs-coursework Computer_Architecture README and src/main.c"
  - "The actual opcode, function, immediate extraction, label table, and execution-loop implementation"
validation:
  - "Matching blob hashes between public main and the local source"
  - "A current C11 syntax compilation of main.c"
limitations:
  - "The repository contains no automated ISA vectors or comparison with a reference emulator"
  - "By assignment specification, LW returns zero and SW is ignored, so there is no real memory subsystem"
  - "The scope is a subset of R/I/load/store/branch instructions and reports only PC and x1 through x5"
featured: false
draft: false
---

## The implementation starts from 32 bits, not assembly text

The computer-architecture assignment validates that every line contains exactly 32 binary characters, then extracts the opcode, `funct3`, `funct7`, registers, and immediates by bit offset. Its subset covers arithmetic and logical R-type instructions, immediate I-type operations, LW, SW, and conditional branches.

RISC-V immediate bits occupy different physical locations by type. I-type values sign-extend the upper twelve bits; S-type values combine `imm[11:5]` and `imm[4:0]`. B-type values require reconstructing scattered bits into a signed 13-bit offset:

```text
instruction: imm[12] | imm[10:5] | rs2 | rs1 | funct3 | imm[4:1] | imm[11] | opcode
rebuild:     imm[12|11|10:5|4:1|0]
```

Shift decoding uses `funct7` to distinguish SRL and SRA, with a C unsigned cast separating logical from arithmetic right shift.

## Stable branch labels require two passes

Emitting assembly in one scan cannot always name a forward branch target before it has been seen. The first pass reconstructs every branch offset, validates the target instruction index, and assigns a label in a line table. The second pass emits a label before its target and refers to that label from the branch.

```text
pass 1: decode branches -> validate target -> assign lineLabels[target]
pass 2: emit label -> disassemble instruction -> reference label
```

Unsupported `funct7` combinations, unaligned targets, and targets outside the file produce `Instruction Format Error!` and remove incomplete output.

## The virtual CPU reuses the same decoding semantics

A `CPU` structure contains 32 registers and a PC. Execution begins at PC 1000, fetches `(pc - 1000) / 4`, decodes the instruction, and chooses the next PC. Normal instructions advance by four; a taken branch adds the signed immediate. Writes to `x0` are ignored, and SRL and SRA retain distinct behavior.

The phrase “CPU simulator” needs a clear boundary. The assignment specification makes LW write zero to its destination and ignores SW memory effects. There are no caches, exceptions, CSRs, or concrete memory model. It is an ISA-learning subset, not a complete emulator.

## Implementation evidence is not full correctness evidence

For this audit, I matched the [public-main source](https://github.com/ghdtjdwn/cs-coursework/tree/main/Computer_Architecture) blob to the local file and passed a C11 syntax compilation. The repository has no automated instruction vectors or comparison against Spike or another reference model, so I do not claim complete ISA correctness.

The value is not production-emulator performance. It is a direct mapping from the instruction-format table to decoder code, branch targets, and PC transitions. A next version would introduce table-driven decode and golden vectors, then isolate memory behind an interface so the coursework stub and a real load/store model could be exchanged.
