---
title: "firstStudy"
summary: "An early learning project for practicing member-management CRUD and REST API fundamentals with Spring Boot."
status: archive
statusNote: "This records the beginning of my Spring Boot studies. Development has ended, and detailed promotion remains on hold until credential-like content in the public documentation is remediated."
activity: personal
visibility: public
role: "Independent learning project"
contributionEvidence: ["2 commits in the user's repository"]
tags: ["Spring Boot", "JPA", "Validation", "REST"]
infra: []
metrics:
  - { label: "Stage", value: "Learning archive" }
order: 13
featured: false
draft: true
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/firstStudy" }
recordPlan: "First complete security cleanup and secret scanning in the source repository, then write a growth retrospective focused on the difference between early CRUD work and an operable system rather than promoting the feature set."
recordLinks: []
---

## Starting point

This independent learning project was my first attempt to connect Spring Boot's controller-service-repository layers, JPA entities and member-management CRUD, Bean Validation, REST responses, and Swagger. It has less technical depth than my current representative projects, but it documents the starting point of my backend development studies.

## Why it remains in the portfolio

Although it is less technically deep than my current work, it provides evidence of where the learning path began. I keep it as an archive that explains growth rather than presenting it with the same prominence as recent projects.

At the time, I practiced MySQL connectivity, development and test profiles, a small React/Vite example, and API calls in one repository. The README documents unit and integration test commands and an API verification script, but there is no recent record confirming that they still pass in the current environment.

## What later projects changed

A working CRUD application is not the same as an operable service. Later projects expanded the implementation boundary to include schema migrations, authentication boundaries, caching and messaging, CI/CD, observability, load testing, and recovery paths. This repository supports a factual retrospective about that growth.

## Security cleanup before publication

The public README contains credential-shaped database configuration. I need to determine whether the values were ever active, rotate them if necessary, remove unsafe defaults, and run secret scanning before publication. Until that work is complete, I will not quote the configuration example or move detailed usage instructions to the blog. Repository hygiene issues such as tracked dependencies will be addressed at the same time.
