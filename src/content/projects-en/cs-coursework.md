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
order: 12
featured: false
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/cs-coursework" }
recordPlan: "Course READMEs and Git history remain the sources of truth. Rather than inflating them into product experience, I will select only assignments that meaningfully demonstrate systems, language, or AI fundamentals for learning-focused posts."
recordLinks:
  - { label: "Course code and READMEs", url: "https://github.com/ghdtjdwn/cs-coursework" }
---

## Purpose of the archive

This repository is not a single product. It preserves implementations from computer science coursework, organized by course. Rather than presenting it with the same weight as current service projects, it provides evidence of the operating systems, languages, networking, algorithms, and AI fundamentals behind later backend and infrastructure decisions.

## Scope of the record

The archive includes an interpreter, RISC-V simulator, file processing, network sockets, algorithms, and PyTorch models. It is positioned as a record of learning and fundamentals rather than mixed with completed products.

The C and C++ work covers POSIX file processing, a linked-list-based duplicate-file finder, and systems programming. The mini-language interpreter was implemented in Python and C++, while the Java assignments focus on data structures and object-oriented fundamentals. The RISC-V simulator and FTL assignments explore instruction execution and storage layers in code. Networking assignments include sockets, TLS, and ZeroMQ.

The AI assignments use PyTorch to implement and experiment with CNNs, ViT, BERT, and Transformer components. Accuracy figures in the course READMEs apply only to those datasets and course conditions and are not generalized as production-model performance.

## Position in the hiring portfolio

The flagship projects are operating, data-intensive user products such as the ssu platform and Geuneul. This archive serves as supporting evidence when an interview calls for code-level discussion of data structures, execution models, networking, or ML fundamentals. Rather than turning all 12 courses into posts, I plan to expand only two or three topics that connect to current work, such as the interpreter, RISC-V, and Transformer.

## Limitations

Coursework does not demonstrate real users, team operations, deployment, or incident response. Detailed code and results will be cited only after rechecking the publication scope of assignment requirements and external materials.
