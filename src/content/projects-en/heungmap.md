---
title: "HeungMap"
summary: "A tourism-data competition project exploring whether TourAPI and visitor data can be combined to forecast festival demand, beginning with validation of the data join."
status: planned
statusNote: "The competition application and problem definition are complete, and the project is now validating data collection and label joins before implementing a model."
activity: competition
visibility: public
role: "Joint planning in a 2-person team; implementation responsibilities not yet assigned"
teamScope: "Pre-implementation stage"
contributionEvidence: ["Competition application and planning documents", "Data-spike go/no-go criteria"]
tags: ["TourAPI", "Data Spike", "Forecasting", "Product Discovery"]
infra: []
metrics:
  - { label: "Current stage", value: "Data validation" }
order: 4
featured: false
repositories:
  - { label: "GitHub", url: "https://github.com/ghdtjdwn/heungmap" }
recordPlan: "The repository will first record the data-spike hypothesis, collection results, and go/no-go decision. Once analysis results exist, failed hypotheses will also be connected to competition and data posts on the blog."
recordLinks:
  - { label: "Project repository", url: "https://github.com/ghdtjdwn/heungmap" }
---

## Problem to solve

This tourism-data competition concept aims to explain a festival's potential using region, timing, and visitor data instead of subjective expectations, while showing visitors likely interest and crowding. The two-person team has defined the problem and candidate data, but detailed implementation responsibilities have not yet been assigned.

## What must be validated first

Instead of building a model first, the project begins by checking whether festival-level labels can actually be joined with regional, temporal, and visitor data. Data leakage, observation windows, and variables unavailable at prediction time must be removed before any forecast can be explained as a product feature.

The plan is to combine TourAPI festival metadata with regional visitor data over matching periods to create a minimum dataset of 50 to 100 festivals. A rule-based baseline comes first, and ML and explainable features will be considered only after label quality is established. The first decision is whether the label can honestly be called “festival-level demand,” not how to maximize model accuracy.

## Current state and next decision

The competition application and planning documents are complete. API key issuance, real-data collection, and the label-join success rate have not yet been verified. If the data spike shows that regional visitor counts cannot be attributed to individual festivals, the project will pivot to crowding prediction or a discovery problem. The go/no-go result itself will be recorded in the work log.

## Publication policy

The project is currently in the planning and application stage. It does not claim model accuracy or deployment results; only facts and technical choices verified during the data spike will be recorded.

Regardless of the competition result, the problem definition, unusable variables, and failed join hypotheses can be documented within the publishable scope. Planned technologies will not be presented as hands-on experience before implementation.
