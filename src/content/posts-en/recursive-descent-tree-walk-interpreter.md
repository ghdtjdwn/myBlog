---
title: "A mini language from lexer to AST evaluation—and the grammar contract found in review"
description: "A retrospective on a Python and C++ recursive-descent interpreter, including runtime probes that exposed differences between its README and actual semantics."
publishedAt: 2026-07-18
category: engineering
tags: ["Interpreter", "Recursive Descent", "AST", "Python"]
project: cs-coursework
role: "Implemented the coursework lexer, parser, AST, and evaluator, then re-audited the current public source"
evidence:
  - "The Python and C++ sources and course README under cs-coursework Programming_Languages"
  - "Grammar-shaped functions and AST nodes connecting tokenization to environment mutation"
validation:
  - "Executed the current Python source for a parenthesized result of 9 and a constant-reassignment Syntax Error"
  - "Additional probes showing 1+2*3 evaluates to 9 and the documented repeat-until example stops at 1"
limitations:
  - "The repository has no formal automated test suite; this review used a small set of audit probes"
  - "The current parser gives +, -, and * one left-associative precedence level, unlike the README's conventional description"
  - "RepeatStmt termination also differs from the README example and requires comparison with the original assignment specification"
featured: false
draft: false
---

## Even a small language needed four explicit boundaries

For a programming-languages assignment, I implemented a mini imperative language with declarations, assignment, output, repetition, and selection in both Python and C++. Source text is not executed directly; it passes through:

```text
source
  -> tokenizer
  -> recursive-descent parser + symbol table
  -> AST
  -> tree-walk evaluator + environment
```

The tokenizer only separates multi-character comparisons before single-character delimiters. Lexical-validation helpers invoked by the parser, including `is_var_name` and `is_number`, enforce identifier and number lengths and reserved words. Parser functions correspond to program, declaration, statement, block, boolean-expression, and arithmetic-expression rules.

## Syntax and selected semantic failures are rejected during parsing

The symbol table stores whether a name is a variable or constant and its initial value. Duplicate declarations, undeclared identifiers, and constant reassignment fail before AST execution. The runtime environment begins from that table, while `AssignStmt`, `RepeatStmt`, and `SelectStmt` mutate or read it.

Expressions and statements are represented by nodes with `eval` and `execute` rather than one monolithic switch. A `BinExpr` evaluates two children, and `SelectStmt` walks one block based on a boolean result. Parsing responsibility and execution responsibility remain separable when adding a construct.

## Re-executing the source revealed a contract more important than the diagram

For this audit, I verified that the local file had the same blob hash as public main and ran it directly. Explicit `(1 + 2) * 3` prints 9, while assigning to a constant produces `Syntax Error!`.

The README says the grammar provides conventional precedence, but `parse_aexpr` handles `+`, `-`, and `*` in one loop:

```python
while self.peek() in ("+", "-", "*"):
    op = self.pop()
    right = self.parse_term()
    expr = BinExpr(op, expr, right)
```

Consequently, `1 + 2 * 3` is left-associated as `(1 + 2) * 3` and evaluates to 9 rather than 7. The current `RepeatStmt` also breaks when its condition is false, so the README's `until(i > 3)` example stops at 1 after the first iteration.

## A learning record is stronger when it preserves the mismatch

The [current source](https://github.com/ghdtjdwn/cs-coursework/tree/main/Programming_Languages) demonstrates an implemented compiler frontend, but it has no formal test suite and contains documentation-to-runtime mismatches. I do not present it as a production language with proven correctness.

A repair would introduce a separate multiplicative parse layer, reconcile repeat semantics with the original specification, and fix valid and invalid programs as executable fixtures. The most useful lesson from the audit was not the number of AST classes. A language contract is complete only when grammar, parser, and examples say the same thing under tests.
