# myBlog project guidance

This directory is an active work-in-progress Astro portfolio and engineering blog. Preserve unfinished pages, content models, and styling unless the task explicitly changes them. Follow the global personal development workflow, but do not treat an incomplete scaffold as a validated application.

## Current state

- The site is configured as a static Astro build in `astro.config.mjs`.
- `src/content.config.ts` defines `projects` and `posts` collections backed by `src/content/projects/` and `src/content/posts/`.
- `src/lib/site.ts` owns shared site metadata and base-path URL handling.
- `src/layouts/BaseLayout.astro` owns global metadata, navigation, structured data, and the page shell.
- npm is the selected package manager, `.nvmrc` selects Node 24, and `package.json` pins the Astro toolchain. Keep `package-lock.json` synchronized with it.
- Git may be initialized as part of the initial implementation, but creating a remote repository and publishing still require explicit confirmation.

## Implementation boundaries

- Keep reusable site metadata and URL construction centralized rather than duplicating it in pages.
- Preserve `SITE_URL` and `BASE_PATH` deployment overrides and use `withBase()` for internal asset and route URLs.
- Keep content schema changes synchronized with every affected Markdown or MDX entry and card/detail component.
- Maintain semantic HTML, keyboard navigation, the skip link, useful alternative text, canonical URLs, RSS metadata, Open Graph metadata, and JSON-LD.
- Treat public metrics, project outcomes, dates, live URLs, and technical claims as evidence-backed portfolio content. Do not invent or silently inflate them.
- Never place private notes, credentials, unpublished personal data, or environment values in public content.

## Validation

Use Node 24 and npm with the pinned lockfile.

- Reproducible install: `npm ci`
- Development server: `npm run dev`
- Focused type and content validation: `npm run check`
- Static build: `npm run build`
- Generated-output and draft-isolation verification: `npm run verify`
- Full local gate: `npm test`
- Preview a completed build: `npm run preview`
- Create a draft record: `npm run new:record -- <project|post|decision|incident> <slug> "<title>"`

For visual changes, inspect the affected desktop and mobile pages after a successful build or development start. Check internal links under both `/` and a non-root `BASE_PATH` when deployment-path behavior changes. Do not report validation as passed when dependencies or required content are still missing.

## Documentation and delivery

Use `docs/TECH_SPEC.md` for the technical contract, `docs/adr/` for material architecture or publishing decisions, `docs/PROJECT_CATALOG.md` for audited project scope, and `WORKLOG.md` for completed work and validation. Keep `docs/private/` and local source maps out of public output. Before publishing, review the rendered output, links, dates, claims, accessibility, draft isolation, and generated RSS/sitemap behavior. Require explicit confirmation before creating a remote repository, publishing the site, changing DNS, or modifying a production deployment.
