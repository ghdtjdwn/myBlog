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
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/cs-coursework" }
recordPlan: "Course READMEs and Git history remain the sources of truth. I link the POSIX grader, interpreter, and RISC-V assignments whose current source I rechecked."
recordLinks:
  - { label: "Course code and READMEs", url: "https://github.com/ghdtjdwn/cs-coursework" }
  - { label: "POSIX autograder", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Linux_System_Programming" }
  - { label: "Recursive-descent interpreter", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Programming_Languages" }
  - { label: "RISC-V simulator", url: "https://github.com/ghdtjdwn/cs-coursework/tree/main/Computer_Architecture" }
---

## Purpose of the archive

This repository is not a single product. It preserves implementations from computer science coursework, organized by course. It records operating systems, languages, networking, algorithms, and AI concepts practiced in code.

## Scope of the record

The archive includes an interpreter, RISC-V simulator, file processing, network sockets, algorithms, and PyTorch models. It separates the original course conditions from checks rerun against the current source.

The C and C++ work covers POSIX file processing, a linked-list-based duplicate-file finder, and systems programming. The mini-language interpreter was implemented in Python and C++, while the Java assignments focus on data structures and object-oriented fundamentals. The RISC-V simulator and FTL assignments explore instruction execution and storage layers in code. Networking assignments include sockets, TLS, and ZeroMQ.

The AI assignments use PyTorch to implement and experiment with CNNs, ViT, BERT, and Transformer components. Accuracy figures in the course READMEs apply only to those datasets and course conditions and are not generalized as production-model performance.

## Rechecked scope

I rechecked the current public source and linked three posts on the POSIX parallel grader, recursive-descent interpreter, and RISC-V simulator. They distinguish historical performance from current checks and disclose the interpreter semantics where documentation and code diverge.

## Limitations

Coursework does not include real users, team operations, deployment, or incident-response conditions. Detailed code and results are cited only after rechecking the publication scope of assignment requirements and external materials.
