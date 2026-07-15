# myBlog content guidance

Read `/Users/seongju/myBlog/AGENTS.md` before work. Files in this directory can become public portfolio content, so evidence and contribution boundaries are part of the content contract.

## Collection ownership

- `projects/` describes product scope, the user's direct role, team boundaries, evidence, status, visibility, metrics, repositories, and limitations.
- `posts/` explains a technical question through verified implementation, evidence, validation, and explicit limitations.
- `decisions/` records material choices, credible alternatives, rationale, results, and reconsideration conditions.
- `incidents/` records only real failures with verified impact, evidence, cause, remediation, validation, prevention, and remaining risk.

Create new records with `npm run new:record -- <project|post|decision|incident> <slug> "<title>"` so they begin as drafts. Keep `draft: true` until claims, links, dates, images, contribution ownership, and rendered output have been reviewed. Never turn plans, team work, unverified metrics, private repositories, or private operational notes into personal accomplishments.

Keep every entry compatible with `src/content.config.ts`. When changing a schema, update the generator, all affected entries, list/detail pages, and build verification together. Run `npm run check` while editing and `npm test` before considering publishable content complete.

Do not copy secrets, private source documents, local paths, internal endpoints, personal identifiers, or ignored evidence into content. Refer to public artifacts where possible and summarize private evidence only after removing sensitive details and verifying that publication is authorized.
