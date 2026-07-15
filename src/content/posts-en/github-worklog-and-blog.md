---
title: "Why Worklogs Belong on GitHub and Explanations Belong on the Blog"
description: "A documentation structure that connects Issues, worklogs, ADRs, troubleshooting records, and technical articles without copying every project change into the blog."
publishedAt: 2026-07-15
category: engineering
activity: personal-project
tags: ["Documentation", "Worklog", "Troubleshooting", "GitHub"]
role: "Research, design, and blog implementation of the project documentation structure"
evidence:
  - "Official GitHub documentation for profiles, Issues, and Projects"
  - "ADR and troubleshooting practices in the ssuMCP and Geuneul repositories"
  - "myBlog ADR-0003 and per-project record links"
validation:
  - "Documented current status and record-management policy for 14 projects"
  - "Confirmed HTTP 200 for public GitHub record links"
  - "Passed category and project relationship validation"
limitations:
  - "Primary documents from private team repositories are not published"
  - "Existing project documentation is not migrated all at once; the structure applies to new records first"
featured: true
draft: false
---

## The problem with putting every record in one place

When deciding to keep project worklogs and troubleshooting records, the first question is not only what to write, but which artifact is the source of truth. Turning every commit into a blog post lets minor changes bury important engineering cases. Keeping everything only on GitHub, however, forces a hiring reviewer to search through multiple repositories and directories.

The records also serve different purposes. Active tasks, completed changes, costly-to-reverse decisions, real incidents, and explanations written for other people do not fit one format. I therefore divided the system into three layers: GitHub source records, blog explanations, and an index on each project page.

## GitHub is the source closest to the code

[GitHub's official documentation](https://docs.github.com/en/get-started/using-github/communicating-on-github) distinguishes Issues as places to discuss specific tasks, improvements, and bugs, and Pull Requests as the connection between actual changes and review. Ongoing work is tracked through Issues and Projects, while completed facts remain in the same repository as the code.

Project documentation has the following responsibilities:

```text
docs/
  worklog/YYYY-MM-DD-topic.md
  adr/NNNN-topic.md
  troubleshooting/slug.md
```

A worklog records the date, objective, important changes, affected scope, validation actually run, and remaining work. An ADR is reserved for decisions such as architecture or infrastructure where reversal is expensive; it preserves rejected alternatives and the conditions for reconsideration as well as the selected option.

A troubleshooting record is not a diary entry saying that an error was fixed. It should contain expected and actual behavior, impact, reproduction, hypotheses, evidence, root cause, alternatives, resolution, post-recovery validation, recurrence prevention, and remaining risk. Routine work is never embellished into an interview-ready incident.

## The blog rewrites selected problems for readers

The blog does not duplicate every worklog. It selects records that can answer one meaningful technical question: narrowing a performance bottleneck with an execution plan and load test, a deployment, authentication, concurrency, or data-consistency failure, a consequential architecture decision, AI evaluation and guardrails, or the central hypothesis of a competition project.

Where the source document preserves chronological facts, a blog post reconstructs the context in this order:

1. User problem and expected behavior
2. Constraints and the scope I directly owned
3. Alternatives considered and the reason for the choice
4. Implementation and failed hypotheses
5. Validation actually performed and the result
6. Limits on generalization and the next work

The end of the post or the project page links the relevant ADR, Issue, PR, commit, and troubleshooting source. A reader can understand the problem through a concise explanation, then follow the link back to evidence closer to the code.

## An in-progress project should say that it is in progress

An unfinished competition or team project does not need to be hidden. It should instead distinguish `planning and preparation`, `prototype and implementation`, and `operation and improvement`, then state what is currently verified and what will be tested next. Planned Kubernetes infrastructure or an AI model must not be listed as though it were already in use; the portfolio should show the next decision gate, such as a data spike or a Day-1 availability check.

For team and private repositories, publication scope comes before source links. Teammates' code, internal URLs, and data are not copied; only the individual's role and publicly shareable contracts and validation are summarized. A collaboration remains unpublished even if it is technically interesting when contribution attribution has not been established.

## How the structure appears on this blog

Each project page now includes a `Worklogs and troubleshooting` section alongside its current status, activity type, and direct role. Public ADR or troubleshooting documents are linked to their source repository. If none exists or the repository is private, the page explains the criteria that will govern publication.

New work will first preserve facts and validation in its own repository. Only decisions that I can explain in depth during an interview and reuse across projects will grow into blog posts. The quality criterion is not the number of posts, but whether code, failure, and validation are connected.
