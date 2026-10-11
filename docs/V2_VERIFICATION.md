# V2 Verification — `v2-job-model-and-ui` branch

Status of the v2 delivery as of 2026-10-10. Owner-facing summary of what shipped, what was verified and what remains.

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

### Workstream D — tests, seeds and docs (commits `9703e09`, `d947186` + doc sync)
- Unit/integration tests and fixtures cover the v2 model; demo seed links options per job and stores consent timestamps; shells create no option links.
- Playwright suite updated for v2 behaviour and fully passing.
- PRODUCT, DESIGN, SEED_DATA, UI_REDESIGN, RUNBOOK, ARCHITECTURE (plus already-current SCHEMA/DECISIONS) are in line with the shipped behaviour: managed options, publish rule, consent, inline noindex apply route, poster theme, shells and seeds.

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
| Full browser e2e (admin shell, gating, brands, departments, job editor, jobs list, question builder, review, MFA, session persistence, cron, smoke) | `pnpm test:e2e` | 18 pass, 1 skipped (Lighthouse, opt-in only) |
| Applied migrations on dev | manual (0004, 0005) | applied, never edited |

`public-apply.spec.ts` was updated for v2 behaviour (200/noindex apply route instead of a 308, verbatim "Work from home" filter label, required consent checkbox). `job-editor.spec.ts` and `question-builder.spec.ts` now select one arrangement and one engagement option before publishing (the v2 publish rule). `review.spec.ts` asserts the sentence-case "Shortlisted" status label (the raw enum stays lowercase in the database). No test was deleted or weakened.

## Not verified

- Lighthouse performance spec (skipped by design; runs only with `RUN_LIGHTHOUSE=1`).
- Real-browser visual review against the poster references (owner review expected).
- Any production deployment, migration or credential handling — owner task only.
- The two missing design references (dark application block, job detail images) were never found; those screens were designed from the posters plus the existing layout. See DECISIONS.md.

## Owner checklist before merge/launch

1. Visually review home, job detail, apply block and `/admin/options` against the posters.
2. Confirm brand accent colors/logos and real role content in admin.
3. Run production migrations (`0004`, `0005`) personally when promoting the branch.
4. Optional: run Lighthouse once via `RUN_LIGHTHOUSE=1 pnpm test:e2e performance` after the visual review.
