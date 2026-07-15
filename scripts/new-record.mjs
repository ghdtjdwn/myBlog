import { mkdir, open, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const [kind, slug, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(" ").trim();
const allowedKinds = new Set(["project", "post", "decision", "incident"]);

if (!allowedKinds.has(kind) || !slug || !title) {
  console.error('Usage: npm run new:record -- <project|post|decision|incident> <slug> "<title>"');
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Slug must contain lowercase ASCII letters, numbers, and single hyphens only.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const templates = {
  project: `---
title: ${JSON.stringify(title)}
summary: "TODO: 검증 가능한 한 문장 요약"
status: planned
statusNote: "TODO: 현재 완료·검증 상태"
activity: personal
visibility: private
role: "TODO: 직접 맡은 범위"
teamScope: "TODO: 팀 범위와 기여 경계"
contributionEvidence:
  - "TODO: commit, PR, 문서 또는 검증 기록"
tags: ["TODO"]
infra: []
metrics: []
order: 999
featured: false
draft: true
repositories: []
recordPlan: "TODO: 원본 작업 로그·ADR·트러블슈팅과 블로그 기록의 연결 방식"
recordLinks: []
---

## 문제

TODO

## 직접 맡은 일

TODO

## 검증과 한계

TODO
`,
  projectEn: `---
title: ${JSON.stringify(title)}
summary: "TODO: One-sentence verified English summary"
status: planned
statusNote: "TODO: Current completion and validation status"
activity: personal
visibility: private
role: "TODO: Directly owned scope"
teamScope: "TODO: Team scope and contribution boundary"
contributionEvidence:
  - "TODO: Commit, pull request, document, or validation record"
tags: ["TODO"]
infra: []
metrics: []
order: 999
featured: false
draft: true
repositories: []
recordPlan: "TODO: How source work logs, ADRs, and troubleshooting records connect to the blog"
recordLinks: []
---

## Problem

TODO

## Direct contribution

TODO

## Validation and limits

TODO
`,
  post: `---
title: ${JSON.stringify(title)}
description: "TODO: 글이 답하는 질문"
publishedAt: ${today}
category: engineering
activity: personal-project
tags: ["TODO"]
role: "TODO: 이 작업에서 직접 맡은 역할"
evidence:
  - "TODO: 근거 문서 또는 코드"
validation:
  - "TODO: 실제 수행한 검증"
limitations:
  - "TODO: 주장하지 않는 범위"
featured: false
draft: true
---

## 맥락

TODO

## 판단과 구현

TODO

## 검증과 한계

TODO
`,
  postEn: `---
title: ${JSON.stringify(title)}
description: "TODO: The question this article answers"
publishedAt: ${today}
category: engineering
activity: personal-project
tags: ["TODO"]
role: "TODO: Direct role in this work"
evidence:
  - "TODO: Source document or code"
validation:
  - "TODO: Validation actually performed"
limitations:
  - "TODO: Scope this article does not claim"
featured: false
draft: true
---

## Context

TODO

## Decision and implementation

TODO

## Validation and limits

TODO
`,
  decision: `---
title: ${JSON.stringify(title)}
decidedAt: ${today}
status: proposed
draft: true
---

## 맥락

TODO

## 선택과 대안

TODO

## 결과와 재검토 조건

TODO
`,
  incident: `---
title: ${JSON.stringify(title)}
occurredAt: ${today}
project: "TODO-project-id"
impact: "TODO: 확인된 영향"
validation:
  - "TODO: 복구 후 실제 수행한 검증"
draft: true
---

## 기대와 실제

TODO

## 증거와 원인

TODO

## 해결, 예방과 남은 위험

TODO
`,
};

const targets = kind === "project"
  ? [
      { collection: "projects", template: templates.project },
      { collection: "projects-en", template: templates.projectEn },
    ]
  : kind === "post"
    ? [
        { collection: "posts", template: templates.post },
        { collection: "posts-en", template: templates.postEn },
      ]
    : [{ collection: `${kind}s`, template: templates[kind] }];

const destinations = targets.map(({ collection, template }) => ({
  destination: path.resolve("src", "content", collection, `${slug}.md`),
  template,
}));

const existing = destinations.find(({ destination }) => existsSync(destination));
if (existing) {
  console.error(`Refusing to overwrite ${path.relative(process.cwd(), existing.destination)}.`);
  process.exit(1);
}

const created = [];
try {
  for (const { destination, template } of destinations) {
    await mkdir(path.dirname(destination), { recursive: true });
    const handle = await open(destination, "wx");
    created.push(destination);
    try {
      await handle.writeFile(template);
    } finally {
      await handle.close();
    }
    console.log(`Created draft: ${path.relative(process.cwd(), destination)}`);
  }
} catch (error) {
  await Promise.allSettled(created.map((destination) => rm(destination, { force: true })));
  throw error;
}
