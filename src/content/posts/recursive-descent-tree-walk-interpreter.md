---
title: "렉서부터 AST 평가까지 만든 미니 언어, 그리고 코드 감사에서 찾은 문법 계약"
description: "Python·C++ 재귀하향 인터프리터의 tokenizer·symbol table·tree-walk 구조를 설명하고, README와 실제 연산 의미의 불일치도 함께 검증한 학습 기록입니다."
publishedAt: 2026-07-18
category: engineering
tags: ["Interpreter", "Recursive Descent", "AST", "Python"]
project: cs-coursework
role: "개인 프로그래밍 언어론 과제의 lexer·parser·AST·evaluator 구현과 현재 source 재감사"
evidence:
  - "cs-coursework Programming_Languages의 Python·C++ source와 과목 README"
  - "문법 함수와 AST node가 tokenizer부터 environment mutation까지 이어지는 구현"
validation:
  - "괄호식 출력 9, 상수 재할당 Syntax Error를 현재 Python source에서 실행"
  - "추가 probe로 1+2*3이 9, repeat-until 예제가 1에서 종료되는 현재 의미 확인"
limitations:
  - "저장소에 정형 automated test suite가 없고 이번 확인은 소수의 audit probe"
  - "현재 parser는 +·-·*를 같은 우선순위로 좌결합하며 README의 일반적 우선순위 설명과 다름"
  - "RepeatStmt 종료 조건도 README 예시와 불일치해 과제 명세 원문 대조가 필요"
featured: false
draft: false
---

## 작은 언어도 네 개의 경계를 모두 가져야 했다

프로그래밍 언어론 과제에서 선언, 대입, 출력, 반복과 조건 분기를 가진 미니 언어를 Python과 C++로 구현했습니다. 입력 문자열을 바로 실행하는 대신 네 단계로 나눴습니다.

```text
source
  -> tokenizer
  -> recursive-descent parser + symbol table
  -> AST
  -> tree-walk evaluator + environment
```

tokenizer는 다문자 비교 연산자를 단일 문자 delimiter보다 먼저 분리하는 역할만 합니다. 식별자·숫자 길이와 reserved word는 parser가 호출하는 `is_var_name`·`is_number` 같은 lexical validation helper에서 검사합니다. parser의 `parse_program`, declaration, statement, block, boolean expression과 arithmetic expression 함수는 각각 문법 규칙에 대응합니다.

## syntax와 일부 semantic error를 parse 단계에서 막았다

symbol table에는 변수·상수 여부와 초기값을 저장합니다. 중복 선언, 미선언 식별자와 상수 재할당은 AST를 실행하기 전에 예외가 됩니다. runtime environment는 parser가 만든 symbol table에서 시작하고 `AssignStmt`, `RepeatStmt`, `SelectStmt`가 이를 갱신합니다.

expression과 statement는 같은 거대한 switch가 아니라 `eval`과 `execute`를 가진 AST node로 나뉩니다. `BinExpr`는 두 child를 평가하고 `SelectStmt`는 조건 결과에 따라 block 하나를 순회합니다. 새 문법 요소의 parse 책임과 실행 책임을 별도 class에 둘 수 있습니다.

## 현재 코드를 다시 실행하자 문서보다 중요한 사실이 보였다

이번 감사에서 공개 main과 로컬 blob hash가 같은 source를 직접 실행했습니다. 괄호를 명시한 `(1 + 2) * 3`은 9를 출력하고 상수 재할당은 `Syntax Error!`가 됐습니다.

그러나 README는 문법 계층이 일반적인 연산자 우선순위를 표현한다고 설명하지만 실제 `parse_aexpr`는 `+`, `-`, `*`를 한 loop에서 처리합니다.

```python
while self.peek() in ("+", "-", "*"):
    op = self.pop()
    right = self.parse_term()
    expr = BinExpr(op, expr, right)
```

따라서 `1 + 2 * 3`은 `(1 + 2) * 3`처럼 좌결합돼 9가 됩니다. conventional precedence로 7을 기대하면 parser 계약이 틀립니다. `RepeatStmt`도 현재 code는 condition이 false일 때 break해 README의 `until(i > 3)` 예제가 첫 iteration의 1에서 끝났습니다.

## 불일치를 숨기지 않는 것이 학습 기록의 완성이다

[현재 source](https://github.com/ghdtjdwn/cs-coursework/tree/main/Programming_Languages)는 compiler frontend의 구조를 실제로 구현했다는 근거입니다. 동시에 정형 test suite가 없고 문서·실행 의미가 어긋나는 지점도 분명합니다. 이 글에서는 이를 완성된 production language의 정확성으로 포장하지 않습니다.

수정한다면 multiplicative rule을 별도 `parse_factor` 계층으로 분리하고, repeat semantics를 과제 명세와 대조한 뒤 valid·invalid program을 fixture로 고정해야 합니다. 이 재감사에서 가장 중요한 배움은 AST class 수가 아니었습니다. grammar, parser와 examples가 같은 의미를 말하는지 executable test로 확인해야 언어 구현의 계약이 완성된다는 점입니다.
