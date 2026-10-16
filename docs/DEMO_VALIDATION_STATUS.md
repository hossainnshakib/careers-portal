# Task 13 - partial code-only delivery (2026-10-16)

## Boundary and isolation

Feature branch: `demo-jobs-and-deletion`, based on `origin/main`
`cd360c5e78057eec6573135df899c91ed5c10dfe` (PR #5), in `G:\career-mr`.
The primary `G:\career` worktree remains on `ui-live-fixes`, with 149 status
entries, the user-owned `test-accounts.ts` modification and untracked files
untouched and unstaged. No main mutation, force push or PR merge.

The shared development project is `xmtoccukridshadnxrlc` (Mumbai). Read-only
counts at audit time: 6 departments, 8 brands, 0 jobs, 0 questions, 0 applications.
These counts do **not** verify the deployed public site's empty state.

No database writes, seed/reset/wipe/import commands, Auth mutations or Storage
mutations were performed. Read-only privilege/connection probes do not prove a
functional second Supabase database. A bare second database lacks the managed
Auth tables required by migration 0003, and the same Supabase API configuration
would still share Auth and Storage. No second database was created.

**Owner approval/setup needed:** a separate development-only Supabase test
project with private local credentials, followed by independent target guards
and verification of its API/DB/Auth/Storage/migrations before any writes. Do not
send credentials in chat or commit them. No new dependencies or migrations were
added. Production and shared-project configuration were not changed.

## Implemented code

- Draft/open/closed jobs with zero applications have a confirmed delete path in
  the editor and list. Confirmation names the saved job, uses a native dialog,
  supports cancellation and blocks pending dismissal. Browser behavior remains
  unverified. A client-supplied `confirmed: true` validates intent only; it is not
  authorization or evidence that a human saw the dialog.
- Admin authorization stays first. The existing locked transaction reloads the
  job and applications before deletion; the restrictive application FK prevents
  orphaned applications. Dependent brand/option/question links cascade. No
  application files are touched by job deletion. Missing-job and retention
  failures use safe messages; other database errors remain generic.
- Cache invalidation retains catalog/detail tags, including sitemap dependencies;
  deleted public URLs become 404. List success messages preserve row-menu filters.
- MFA spec line 6 applies the helper's clear-first/retry pattern while retaining
  distribution, focus and Backspace assertions. No authentication code changed.

The five DEMO jobs, eleven-type/five-section coverage matrix, strict isolated
seed/cleanup commands and isolated public apply journey are **not implemented**.
No fictional salaries, benefits or vacancies were added to the shared catalog.
The 19 owner-authored roles and real importer were not modified or published.

## Tests and evidence

- `pnpm typecheck` and `pnpm lint`: passed.
- `pnpm test`: 649 passed / 88 skipped; 93 files passed / 8 skipped.
  The additional skips are newly authored opt-in live tests, not formerly
  failing E2E cases being hidden. Earlier runs encountered the existing 5-second
  PDF-worker timeout; isolated and subsequent full runs passed. A later truncated
  failure's details were not retained; the full-log rerun passed.
- `pnpm build`: passed including the PDF trace guard. The initial
  build failed due to absent worktree environment configuration; a private,
  gitignored local copy enabled the successful build.
- Live Vitest / full Playwright / screenshots: **NOT RUN / BLOCKED** pending
  independently verified test-project isolation. Auth refusal, validation, policy
  matrix and static dialog markup have unit coverage. FK cleanup and competing
  delete tests are authored but not executed. Runtime concurrent apply/delete,
  browser focus/pending/error behavior, upload/consent/download/PDF journeys and
  RLS against a live target remain unverified.
- The ten previously catalog-dependent failures were inspected statically, not
  reproduced: `accessibility:3`, `public-apply:5`, `public-brand-links:5/:20`,
  `public-mobile:16`, `public-states:5/:16/:38`, `public-sticky:73` at two widths.
  Their environmental diagnosis is provisional until isolated execution.
  `public-states:38` hardcodes `web-developer`, so new `demo-*` rows alone will not
  satisfy it. No catalog assertions were weakened or blanket skips introduced.
- Deployed empty state: **UNVERIFIED**; the actual deployed URL was not supplied.
  No claim about it is inferred from local/shared database counts.
- No changes to requireAdmin, MFA actions, Turnstile, upload checks, private
  Storage, CSP, migration SQL or hosting configuration.

## Acceptance checklist

“Implemented” describes code delivered, not unperformed browser verification.
“Justified Deviation” denotes a partial/blocked item, not full acceptance.

| # | Status | Evidence or remaining work |
|---|---|---|
| 1 | Implemented | Separate feature worktree; main/user work preserved |
| 2 | Justified Deviation | Isolation insufficient; stopped before writes |
| 3 | Not Implemented | Five DEMO roles pending isolated target |
| 4 | Not Implemented | Full question/section fixture and E2E matrix pending |
| 5 | Not Implemented | Isolated seed/cleanup and their guard tests pending |
| 6 | Implemented | Authorized confirmed delete code; browser verification blocked |
| 7 | Justified Deviation | Transaction/FK safety retained; cleanup/race live tests unrun |
| 8 | Justified Deviation | UI/server/FK protect applications; cleanup command not built |
| 9 | Implemented | MFA clear-first test fix; runtime verification blocked |
| 10 | Justified Deviation | Static dependency review only; reproduction blocked |
| 11 | Justified Deviation | Local gates run; full E2E/live gates blocked |
| 12 | Justified Deviation | Live public empty state explicitly unverified |
| 13 | Implemented | No writes/publishing or production-resource changes |
| 14 | Justified Deviation | Partial runbook/status delivered; DEMO matrix/commands absent |

Totals: **4 Implemented / 7 Justified Deviation / 3 Not Implemented**.

Compare (no PR created or merged by the agent):
https://github.com/hossainnshakib/careers-portal/compare/main...demo-jobs-and-deletion

## Exact changed files

```text
docs/DECISIONS.md
docs/DEMO_VALIDATION_STATUS.md
docs/RUNBOOK.md
src/app/admin/(protected)/jobs/actions.test.ts
src/app/admin/(protected)/jobs/actions.ts
src/app/admin/(protected)/jobs/page.test.ts
src/app/admin/(protected)/jobs/page.tsx
src/components/admin/job-editor.test.ts
src/components/admin/job-editor.tsx
src/components/admin/job-row-menu.test.ts
src/components/admin/job-row-menu.tsx
src/db/queries/jobs.live.test.ts
src/lib/questions/job-policy.test.ts
src/lib/questions/job-policy.ts
src/lib/validation/jobs.ts
tests/e2e/admin-ui.spec.ts
tests/e2e/job-editor.spec.ts
```
