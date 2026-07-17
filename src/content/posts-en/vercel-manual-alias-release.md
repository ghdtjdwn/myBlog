---
title: "Production was Ready while the primary URL served the old release"
description: "Git and Vercel succeeded, but a manually assigned .vercel.app alias remained pinned to an older deployment until promotion became an explicit, reversible step."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["Vercel", "Release Engineering", "Post-deployment Verification", "Rollback"]
role: "Diagnosed deployment routing for my technical blog and designed alias promotion, rollback, and public verification"
evidence:
  - "The vercel-primary-alias-stale incident record in myBlog"
  - "Comparison of Git commit, Production deployment ID, alias source, and public responses"
validation:
  - "Alias deployment IDs matched the verified Production ID after promotion"
  - "Korean and English homes, projects, canonical metadata, HSTS, and security headers were checked at the primary URL"
limitations:
  - "Promotion remains manual and can still be omitted"
  - "Automatic Production assignment through a personal domain or scoped credentials is not implemented"
featured: false
draft: false
---

## Three green statuses did not deliver the latest page to users

GitHub CI passed for a project-content pull request, and the Vercel Production linked to the main commit was `Ready`. Its unique deployment URL showed the new Korean and English content. The hiring URL, `seongju.vercel.app`, continued to serve the previous version.

CDN cache and an Astro build omission were plausible at first. I compared four distinct states:

```text
GitHub main commit          latest
Vercel production build    Ready, latest content
unique deployment URL      latest content
seongju.vercel.app alias   previous deployment
```

`vercel inspect` returned different deployment IDs for the primary URL and the new Production. `vercel alias ls` showed that the short address pointed directly to an older deployment source. The request was routed to the old artifact; it was not stale content from the new artifact.

## A project domain and a manual deployment alias have different lifetimes

The short `.vercel.app` name was not the project's automatically assigned Production domain. It had been attached to one deployment with `vercel alias set`. A later Git deployment did not move that manual mapping.

The root cause was treating “Production Ready” as proof of public routing. Rebuilding would not have helped because both the build and new deployment were already correct.

## Record rollback before promotion

I retained the manual alias but turned it into an explicit release step:

1. Require both main CI and its linked Vercel Production to succeed.
2. Inspect that commit's unique URL for the expected project, production target, and `Ready` state.
3. Record the current primary alias URL and deployment ID as rollback.
4. Run `vercel alias set` only against the verified unique URL.
5. Inspect the primary alias again and compare deployment IDs.
6. Probe Korean and English routes, metadata, and security headers at the public URL.
7. Restore the recorded deployment if any check fails.

I do not select whichever deployment happens to be newest. The immutable URL must be associated with the intended main commit, avoiding accidental promotion of a preview or unrelated artifact.

## Post-deployment verification ends at the public route

After promotion, the primary alias and final Production returned the same deployment ID. Korean and English homes plus representative projects returned 200 and contained the new content. Canonical metadata pointed to the primary address, and HSTS, MIME-sniffing protection, frame restrictions, and referrer policy remained intact.

CI verifies source and build. Hosting status verifies a deployment. The URL users know may be a separate routing object, so the release checklist now includes a content probe on that exact alias.

Manual promotion can still be forgotten. With higher release frequency, a personal domain assigned through project settings or scoped credentials behind an approval gate may be justified. At the current frequency, an explicit reversible procedure avoids introducing a long-lived deployment token and another automation failure path.
