# V2 Verification — `v2-job-model-and-ui` branch

Status of the v2 delivery as of 2026-10-09. Owner-facing summary of what shipped, what was verified and what remains.

## What shipped

### Workstream A — job options model and admin (commit `a8d7163`)
- Replaced fixed `employment_type` / `work_mode` / `experience_level` columns with managed option lists (`job_options` + `job_option_links`). Migrations `0004` (additive) and `0005` (drop) are applied to the pinned dev project only; production migration is an owner task.
- Option slugs equal the legacy enum values, so old shared filter URLs keep working; labels render verbatim everywhere.
- Publish rule: at least one arrangement and one engagement option (experience optional). New job fields: salary mode/text, vacancies, experience text, skills, benefits, nice-to-have, engagement note.
- `/admin/options` surface (protected) to create/edit/activate/reorder/delete options; delete is blocked while linked.
- Application consent checkbox (required), stored as `applications.consent_at`, shown in admin profile and candidate PDF.
- `/jobs/:slug/apply` no longer redirects: it renders the same job page with `robots: noindex, follow` (old poster/bookmark URLs keep working).

### Workstream B — public design system (commit `06b8c9b`)
- Public-only theme scoped via `.public-theme` on the public layout; admin keeps the existing look.
- Warm canvas `#edece7`, ink `#141412`, red accent `#e0341f` (black-on-red buttons, AA), hairline borders, tight radii, font-black poster typography.
- Header wordmark with red dot, dark ink footer, hero with "We're hiring" kicker and job-title pill marquee, poster-style hub filters/chips/sections, red department and step numbers, pill tags in results.

### Workstream C — job detail page (commit `ff21817`)
- Poster hiring header with pill tags, red-triangle benefit bullets, skills pills, dark `bg-ink` apply block wrapping the form in a light card; closed roles get the same dark block with no `id="apply"` and no form.

## Verification matrix (all against dev data only)

| Check | Command | Result |
| --- | --- | --- |
| Types | `pnpm typecheck` | pass |
| Lint | `pnpm lint` | pass |
| Unit/integration | `pnpm test` | 528 passed, 85 skipped (67 files) |
| Production build + PDF trace guard | `pnpm build` | pass (Helvetica/chunks/ICC, both Bengali fonts, 8 logos) |
| RLS (anon key reads nothing) | `pnpm test` live (`RUN_SUPABASE_TESTS=1`, `rls.test.ts` + `jobs.live.test.ts`) | 17/17 pass |
| Public e2e: pages, accessibility | `playwright test public-pages accessibility` | 2 pass |
| Public e2e: full apply flow (Bengali answers, PDF uploads, consent, legacy apply route 200 + noindex) | `playwright test public-apply` | 2 pass |
| Applied migrations on dev | manual (0004, 0005) | applied, never edited |

`public-apply.spec.ts` was updated for v2 behaviour (200/noindex apply route instead of a 308, verbatim "Work from home" filter label, required consent checkbox). No test was deleted or weakened.

## Not verified

- Full admin/browser e2e suite (job editor, options page, review flows) was not re-run end-to-end on this branch beyond unit coverage; re-run `pnpm test:e2e` before merging.
- Real-browser visual review against the poster references (owner review expected).
- Any production deployment, migration or credential handling — owner task only.
- The two missing design references (dark application block, job detail images) were never found; those screens were designed from the posters plus the existing layout. See DECISIONS.md.

## Owner checklist before merge/launch

1. Run `pnpm test:e2e` (or at least the admin specs) once against dev.
2. Visually review home, job detail, apply block and `/admin/options` against the posters.
3. Confirm brand accent colors/logos and real role content in admin.
4. Run production migrations (`0004`, `0005`) personally when promoting the branch.
