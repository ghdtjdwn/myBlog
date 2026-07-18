---
title: "Computer Science Coursework"
summary: "A course-by-course learning archive covering systems, algorithms, networking, AI, and data analysis assignments."
status: archive
statusNote: "A learning archive preserving code from 12 computer science courses. It is not under active feature development or operation."
activity: coursework
visibility: public
role: "Individual coursework"
contributionEvidence: ["Public repository covering 12 courses"]
tags: ["C", "C++", "Java", "Python"]
infra: []
metrics:
  - { label: "Courses", value: "12" }
order: 11
featured: false
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/cs-coursework" }
recordPlan: "Course READMEs and Git history remain the sources of truth. Rather than inflating them into product experience, I link only the POSIX grader, interpreter, and RISC-V assignments whose current source I re-audited."
recordLinks:
  - { label: "Course code and READMEs", url: "https://github.com/ghdtjdwn/cs-coursework" }
  - { label: "POSIX autograder", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Linux_System_Programming" }
  - { label: "Recursive-descent interpreter", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Programming_Languages" }
  - { label: "RISC-V simulator", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Computer_Architecture" }
---

## Purpose of the archive

This repository is not a single product. It preserves implementations from computer science coursework, organized by course. Rather than presenting it with the same weight as current service projects, it provides evidence of the operating systems, languages, networking, algorithms, and AI fundamentals behind later backend and infrastructure decisions.

## Scope of the record

The archive includes an interpreter, RISC-V simulator, file processing, network sockets, algorithms, and PyTorch models. It is positioned as a record of learning and fundamentals rather than mixed with completed products.

The C and C++ work covers POSIX file processing, a linked-list-based duplicate-file finder, and systems programming. The mini-language interpreter was implemented in Python and C++, while the Java assignments focus on data structures and object-oriented fundamentals. The RISC-V simulator and FTL assignments explore instruction execution and storage layers in code. Networking assignments include sockets, TLS, and ZeroMQ.

The AI assignments use PyTorch to implement and experiment with CNNs, ViT, BERT, and Transformer components. Accuracy figures in the course READMEs apply only to those datasets and course conditions and are not generalized as production-model performance.

## Position in the hiring portfolio

The flagship projects include the operating ssu platform and the completed Geuneul service, both of which address operations, data, and user problems. This archive serves as supporting evidence for code-level discussion of data structures and execution models. I re-audited the current public source and linked three posts on the POSIX parallel grader, recursive-descent interpreter, and RISC-V simulator. They distinguish historical performance from checks run during this review and disclose the interpreter semantics where documentation and code diverge.

## Limitations

Coursework does not demonstrate real users, team operations, deployment, or incident response. Detailed code and results will be cited only after rechecking the publication scope of assignment requirements and external materials.
