---
title: "How Windows CI exposed a SQLite connection leak hidden by Linux"
description: "A WinError 32 portability failure caused by assuming with sqlite3.Connection closes the handle, plus UTF-8 and semantic Path fixes."
publishedAt: 2026-07-18
category: troubleshooting
activity: competition
tags: ["Python", "SQLite", "Windows", "CI"]
project: unithon-macro
role: "Fixed and verified the Macro durable-order queue connection lifecycle and Linux/Windows quality workflow"
evidence:
  - "Macro docs/troubleshooting/2026-windows-ci-portability and the SQLite queue implementation"
  - "A reproducible WinError 32 while deleting the temporary database after Ubuntu had passed"
validation:
  - "The full unittest and compileall suite on macOS plus successful Ubuntu and Windows CI quality jobs"
  - "Immediate temporary-database deletion after transactions, Korean logs, and Windows path tests"
limitations:
  - "The failure was found during pull-request validation and affected no user, order, or payment"
  - "Real Windows UI Automation and a physical kiosk end-to-end test remain separate"
  - "This is the lifecycle of a single-process SQLite queue, not multi-host database concurrency"
featured: true
draft: false
---

## Cleanup failed after every logical assertion had passed

Macro's order queue persists `queued → claimed → awaiting_handoff/uncertain → terminal` transitions and idempotency keys in SQLite. FIFO, duplicate prevention, and recovery tests passed on Linux, but the Windows job failed with `WinError 32` when deleting its temporary `orders.sqlite3` after the assertions completed.

The same job found two more assumptions: Korean diagnostic text raised `UnicodeEncodeError` on a cp1252 console, and a configuration test compared a POSIX-slash suffix that could not match a Windows path. The symptoms differed, but all three treated one development OS's defaults as part of the contract.

## A SQLite context manager manages a transaction, not the connection

Queue access used:

```python
with sqlite3.connect(path) as connection:
    # query and update
```

The `sqlite3.Connection` context manager commits on success and rolls back on failure, but it does not close the connection. macOS and Linux either allow unlinking an open handle or hid the leak behind object-finalization timing. Windows prevented deletion while the file handle remained open.

The [Python sqlite3 reference](https://docs.python.org/3/library/sqlite3.html#how-to-use-the-connection-context-manager) explicitly states that leaving the context does not close the connection.

## Transaction and resource lifetime moved behind one seam

I routed every queue operation through a dedicated context manager that closes in `finally`:

```python
@contextmanager
def open_queue(path):
    connection = sqlite3.connect(path)
    try:
        with connection:
            yield connection
    finally:
        connection.close()
```

I rejected cleanup sleeps and deletion retries because they would make tests pass while retaining a real handle leak. Removing WAL would weaken concurrent access without fixing ownership.

## Tests now compare platform-independent meaning

Rather than remove Korean operational diagnostics, the CI jobs explicitly enable Python UTF-8 mode. Paths are verified through `pathlib.Path.parts` instead of replacing separators or comparing a slash-formatted string.

The full unittest suite and `compileall` passed again on macOS, followed by the same quality workflow on Ubuntu and Windows. Temporary databases became deletable immediately after the transaction, while Korean messages and path coverage remained intact. The [troubleshooting record](https://github.com/UNITHON24/Macro/blob/main/docs/troubleshooting/2026-windows-ci-portability.md) preserves the alternatives and impact boundary.

The value of cross-platform CI was not more OS-specific branches. One OS turned a lifecycle bug tolerated by another into a deterministic failure, and the fix repaired resource ownership instead of hiding cleanup symptoms.
