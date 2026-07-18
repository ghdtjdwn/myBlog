---
title: "Turning a sequential autograder into a 5.73-second parallel pipeline"
description: "A systems-programming retrospective on student-level pthreads, overlapped fork/exec preparation, answer caching, buffered I/O, and deterministic output."
publishedAt: 2026-07-18
category: engineering
tags: ["C", "POSIX", "pthread", "Performance"]
project: cs-coursework
role: "Analyzed the coursework baseline and implemented its parallel pipeline, process timeouts, and I/O optimizations"
evidence:
  - "The cs-coursework Linux_System_Programming README and ssu_score C source"
  - "Three recorded PASS runs at 5.742, 5.732, and 5.732 seconds in the course environment"
validation:
  - "The historical record shows matching results in all three runs and the top five-second 70/70 timing bracket"
  - "A current GNU11/pthread syntax compilation of the public main source on macOS"
limitations:
  - "The original course dataset and grader environment are unavailable, so this audit did not reproduce 5.73 seconds"
  - "The current compiler audit still reports format, return-path, and dangling-else warnings"
  - "This is a batch coursework grader, not a production sandbox for untrusted code"
featured: false
draft: false
---

## Adding one thread was not the whole performance problem

The systems-programming `ssu_score` assignment compares students' fill-in answers and C programs against references and emits `score.csv`. Correct results were a prerequisite; total runtime determined the performance grade. The baseline processed students serially and repeatedly compiled, executed, and compared each problem.

One pthread per student would still leave compilation, reference preprocessing, and file I/O on a sequential critical path. I reorganized grading into four phases:

```text
1. create the score.csv header once
2. overlap answer preprocessing with student precompile/execute
3. grade students in pthread workers from prepared outputs
4. join and write per-student CSV buffers in deterministic order
```

The unit of parallel work and the merge order had to be designed together to improve time without changing the CSV contract.

## Processes and threads received different responsibilities

Student C programs are compiled and run through `fork → execvp → waitpid` rather than a shell `system()` call. Child stdin is redirected to `/dev/null` so a program waiting for input cannot block the batch forever. The parent polls with `waitpid(WNOHANG)`, sends `SIGKILL` after five seconds, and reaps the child.

Reference compilation and execution run in a child process while the parent simultaneously builds the blank-answer cache and preprocesses student programs. Once preparation completes, student pthreads compare saved `.stdout` files and cached answers. Compilation leaves the grading hot path, and independent setup time overlaps.

This is not an unbounded multi-tenant executor. It fans out processes for a controlled course dataset and lacks namespaces, seccomp, and cgroup isolation, so it is not appropriate for arbitrary user code as written.

## Fewer syscalls did not sacrifice deterministic output

Blank references are loaded once instead of opened for every student. One-byte reads became block reads with `lseek`, and CSV cells are accumulated rather than written one system call at a time.

Concurrent writes to a shared descriptor would interleave rows and require locking. Each worker builds only its own buffer; after `pthread_join`, the main thread writes buffers in the original student order. Parallel computation and deterministic output are separate phases.

## Historical measurement is distinct from current verification

The course README records three correct PASS runs at 5.742, 5.732, and 5.732 seconds, which fell in the top five-second timing bracket worth 70/70. These are historical results from the assignment environment, not a benchmark recreated on my current machine.

For this blog audit, I cross-checked the public-main [source and record](https://github.com/ghdtjdwn/cs-coursework/tree/main/Linux_System_Programming) and ran a GNU11/pthread syntax compilation. It succeeds, while still reporting warnings for a format type, a return path, and a dangling else. Without the original dataset, I do not claim to have rerun the PASS result or timing.

The durable lesson was not simply that threads are fast. End-to-end time fell only after splitting the critical path into process preparation, cached comparison, and ordered output, with an explicit failure boundary that terminates and reaps stalled children.
