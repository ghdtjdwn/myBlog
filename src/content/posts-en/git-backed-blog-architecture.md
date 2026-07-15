---
title: "Why I Split My Technical Blog into Static Pages and a Git-Backed Admin"
description: "An architecture record of separating Astro's static reading experience from browser-based management of posts, categories, and drafts with Keystatic."
publishedAt: 2026-07-15
category: engineering
activity: personal-project
tags: ["Astro", "Keystatic", "Vercel", "Content Architecture"]
role: "Requirements definition, architecture selection, implementation, and deployment validation"
evidence:
  - "Content Collections, Keystatic configuration, and ADR-0002 in the myBlog repository"
  - "GitHub Actions and Vercel Production deployment records"
validation:
  - "Type and content checks across 21 Astro files: 0 errors, 0 warnings"
  - "Validation of 25 generated documents and private-draft isolation"
  - "Public home, post, and category returned HTTP 200; private post returned 404"
limitations:
  - "No real-time collaborative editing for multiple authors"
  - "During a GitHub outage, content must be edited as local Markdown instead of through the web admin"
featured: true
draft: false
---

## What it means to build a blog yourself

I initially focused on building a polished portfolio that presented projects clearly. The result was organized, but it felt more like a product landing page than a technical blog. This site's purpose is not simply to promote outcomes. It is meant to preserve decisions and failures as development happens and present evidence that can be verified during a hiring process.

I rewrote the requirements:

- Recent posts should be immediately readable from the home page.
- Posts should be browsable by date, category, title, and summary.
- Projects should support and contextualize the writing rather than dominate the home page.
- Posts and categories should be creatable, editable, and removable in a browser.
- A draft must never appear in Production until it is explicitly published.

## Separating the responsibilities of public pages and the admin

Astro generates the reader-facing home, post, category, and project pages as HTML ahead of time. A blog without per-user data has no reason to add server rendering and a database to every request.

The `/keystatic` content manager and GitHub OAuth API, by contrast, run as Vercel Functions. Content saved through Keystatic becomes Markdown and YAML in the repository rather than records in a separate database. Browser editing, Git history, CI validation, and automatic deployment therefore form one continuous workflow.

I also considered building a custom admin and database. Operating authentication, sessions, authorization, image storage, backups, and an editor, however, would add complexity unrelated to the central evidence this blog should provide. I retained only the necessary complexity and used Git to preserve content ownership and portability.

## Convenience should not bypass validation

Category and project relationships are stored as file slugs. Deleting or renaming a referenced entry in the admin can leave a broken value in a post. I added a dedicated relationship validator to prevent that, and local development, GitHub Actions, and Vercel all run the same `npm test` command.

New posts and projects default to `draft: true`. Production builds do not create routes for drafts, and a verification script checks again that representative draft URLs are absent. The admin and API responses also carry `noindex, nofollow`.

## Boundaries discovered during deployment

Adding the admin required the Astro Vercel adapter, which changed the static output location from `dist` to `dist/client`. The build succeeded, but every existing artifact check failed. I updated the verification path to match the real deployment structure.

After connecting the new `seongju.vercel.app` address, every request was redirected to Vercel SSO. The application was not responsible: Deployment Protection was guarding the manually assigned alias. I corrected the protection scope so public posts remain readable without authentication, while Keystatic's GitHub OAuth owns admin authentication.

The first operational record for this blog is less about flashy features than about drawing clear boundaries. Future posts will not summarize only successful outcomes; they will record what I expected, what actually happened, and how the resulting decision was validated.
