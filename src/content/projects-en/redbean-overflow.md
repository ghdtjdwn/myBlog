---
title: "RedbeanOverflow"
summary: "An HWPX/XML document automation project that generates test sheets and answer keys from DOCX vocabulary and an HWP template."
status: complete
statusNote: "The document automation tool is complete, but publication remains on hold because the Git history does not establish the user's direct contribution."
activity: other
visibility: private
role: "Participation and review scope requires further confirmation"
teamScope: "The current Git history shows contributions only from kwon32, so this is not published as the user's direct implementation"
contributionEvidence: ["Local outputs and documentation exist", "No commit or PR evidence linked to the user"]
tags: ["HWPX", "XML", "DOCX", "Document Automation"]
infra: ["Local Python CLI"]
metrics:
  - { label: "Publication", value: "On hold" }
order: 11
featured: false
draft: true
repositories: []
recordPlan: "Confirm authorship and contribution scope first. Until then, do not publish technical details as an individual achievement; afterward, document only the verified participation, review scope, and limitations."
recordLinks: []
---

## Project context

The tool edits the XML inside HWPX files to populate words and definitions while preserving the template's existing tables and formatting. A fixed seed makes blanks reproducible and generates matching test sheets and answer keys.

It reads vocabulary from DOCX through the high-level `python-docx` structure and, where necessary, uses an XML fallback to interpret tables. The HWP template is converted to HWPX ZIP/XML, after which text is replaced while preserving namespaces, table cells, and paragraph properties. The local Python CLI is designed so that the test and answer sheets share the same seed and item order.

## Scope of the current code

According to the current README and code, the tool fills 20 slots in the Word Master template. Items beyond 20 per day or definitions longer than two lines may be truncated, and definition summarization through Ollama is not connected. The current code and README are treated as more recent evidence than larger figures in older review documents.

## Why publication is on hold

The technical work would make a useful case study, but the Git history reviewed so far does not establish the scope of Hong Seongju's direct implementation. Publication will cover only the confirmed portion of problem definition, implementation, participation, or review.

The repository's Git author is another person, and there are no commits or PRs linked to the user's account. Existing documents also distinguish between implementation and review owners, so possessing the output files is not treated as evidence of individual implementation. If the role is confirmed, a post will discuss only the parts actually contributed to, potentially including HWPX namespaces, Hancom layout caches, or document-integrity validation.

## Validation and limitations

Review materials exist for ZIP integrity, source comparison, namespaces, line spacing, and layout caches. These checks are not attributed to the user as an individual achievement. The project remains `draft: true` until role attribution, publication permission, and the current template constraints are all resolved.
