# Prompt 13 - authorized shared-DEV DEMO validation

## Authorization and target

The owner approved the existing DEV project `xmtoccukridshadnxrlc` and temporary
public DEMO visibility at https://careers-portal-sigma.vercel.app. This supersedes
the earlier separate-project requirement in `DEMO_VALIDATION_STATUS.md`.
There is no production authorization, new database/project, migration or policy
change. Candidates/files in agent-driven testing are synthetic only.

The command checks `APP_ENV=development`, the independent DEV project pin, the
Supabase API origin and **both** DB connection targets (`/postgres`) before I/O,
then independently requires the owner-approved reference. The live login CSP
names the same API origin; all five newly seeded Apply slugs were independently
read from the deployment with HTTP 200 and the disclaimer. This is evidence of
the shared dataset, not direct access to Vercel's private connection settings.

Every seeded title and summary contains **DEMO / TEST ONLY — Not a real job
opening**. The description repeats it and the exact ownership marker
`Validation dataset: prompt-13-demo-v1.`. Keeping the warning in data makes it
visible even on the existing deployed app before this branch's UI is deployed.
This branch additionally renders a high-contrast notice on role cards, featured
cards, Job and Apply pages; demo detail metadata is noindex and has no JobPosting
JSON-LD, and the sitemap excludes demo and ephemeral E2E jobs. Those code-level
SEO safeguards are not claimed live until the branch is deployed.

## Exactly five roles

Titles also contain the complete disclaimer; the short labels below are not
real vacancies or offers. Primary brand is first. All brand/department/option
rows are looked up, never seeded or modified by these commands.

| Slug | Fictional role / department | Brands | Options | Salary / vacancies / CV |
|---|---|---|---|---|
| `demo-platform-developer` | Platform Developer / Web Development & Technical | Fixen Media, Accoraze | Work from home; Full-time; Mid-level | Sample BDT 45,000–65,000/month; 1; required |
| `demo-visual-designer` | Visual Designer / Design & Creative | Doshok, Avagata | Hybrid; Freelance; Entry-level | Negotiable (fictional); 2; required |
| `demo-video-producer` | Video Producer / Video Editing, Motion & Production | Builtale, Ghora Fera | On-site; Project-based, Duration-based; Senior | Sample BDT 70,000–90,000/project; 3; required |
| `demo-bengali-editor` | Bengali Editor / Content & Copywriting | Wiki Bangla | Work from home; Part-time; Entry-level | Negotiable (fictional); 4; optional |
| `demo-campaign-coordinator` | Campaign Coordinator / Marketing & Social Media | Mactie, Fixen Media | Hybrid; Internship; Fresher welcome | Sample BDT 12,000–18,000/month; 5; required |

Across five jobs: all eight existing brands and all 13 existing options. Five
single-department jobs cannot span six departments: Presentation & Production
Operations remains preserved, not artificially linked through unsupported data.
Each job has distinct sample duties, requirements, skills, experience text,
engagement note, location, nice-to-have and three benefits explicitly marked
“not an offer”. All editable supported fields are populated where representable;
negotiable salary correctly has no range text. Deadline is the deterministic
fictional horizon `2099-12-31T17:59:00Z`, not a soon-expiring real hiring deadline.

## Question coverage (52 questions)

Every job independently copies all seven standard questions with stable IDs:
LinkedIn, portfolio URL, years of experience, current role/company, earliest
joining date, expected salary and motivation. IDs are deterministic per slug and
label, preserving references on reruns.

| Role | Total | Additional questions/configuration |
|---|---:|---|
| Platform | 15 | Radio + dropdown, both Other-enabled; multi-choice min 1/max 2 + Other; yes/no; email; phone; required PDF/PNG upload max 2 MB; fractional number min 0.5/max 40 |
| Design | 10 | Required short text min 5/max 120; optional JPG/WebP upload max 3 MB; long text min 10/max 800 |
| Video | 9 | Optional ZIP upload max 5 MB; required date min today/max 2099-12-31 |
| Bengali | 9 | Required Bengali long text min 10/max 1000; date min 2000-01-01/max today |
| Campaign | 9 | Optional multi-choice min 0/max 3, Other disabled; dropdown, Other disabled |

All 11 types are present across the dataset (and on Platform alone): short/long
text, single/multiple choice, yes/no, number, URL, email, phone, date, file upload.
All five sections and required/optional combinations are present. Both integer
and fractional numbers, radio/dropdown, Other true/false, text limits, selection
limits, absolute/relative date bounds, accept lists and upload size limits are
represented using the actual definition schema. No invented question options.
The global 8-file cap and server MIME/signature/size checks remain unchanged;
CV supports PDF/DOC/DOCX while questions cover PDF/PNG/JPG/WebP/ZIP only.

## Safe repeatable commands (PowerShell)

Run in `G:\career-mr` with the privately configured `.env.local`. Never print it.
Each command defaults to **dry-run**. No generic `seed:demo`/reset/wipe/import is
needed or authorized for this task.

```powershell
pnpm demo:seed
pnpm demo:seed --write --confirm=xmtoccukridshadnxrlc
pnpm demo:seed

pnpm demo:publish
pnpm demo:publish --write --confirm=xmtoccukridshadnxrlc
pnpm demo:publish

pnpm db:counts
pnpm demo:check-live
pnpm demo:cleanup
# Only after confirming the dry-run reports zero applications:
pnpm demo:cleanup --write --confirm=xmtoccukridshadnxrlc
pnpm demo:cleanup
```

Stop on a nonzero exit (`if ($LASTEXITCODE -ne 0) { throw 'Command refused.' }`).
Seed creates drafts through `jobInput`/`saveJob`, never opens real jobs, and never
silently updates or reopens published/closed demos. Draft reruns compare full
content and retain stable question IDs. Saves check the previously read version
under the row lock so a concurrent edit causes refusal rather than overwrite.
Writes are transactional per job, not one atomic five-job batch; a failed seed
can safely be inspected and repeated. Publish requires all five seeded drafts;
already-open jobs are no-ops and closed jobs require deliberate admin controls.
No owner-content import or mass-publish feature was added.

Cleanup requires **exact five-slug membership, DEMO title/disclaimer and dataset
marker**, not `demo-%` or a broad wildcard. An unrelated collision causes refusal.
It reports only project/operation/counts, never candidate data. Any application,
including synthetic, blocks the entire cleanup with nonzero exit and zero
deletions. Do not bypass this by deleting application rows in SQL. Review and
delete only identified synthetic applications through the existing authorized
admin deletion workflow (which cleans private files), then repeat the dry-run.
If an unknown/real application appears, stop for owner review instead.

Under the lifecycle advisory lock and row locks, cleanup reloads ownership and
checks applications again immediately before deleting. The restrictive FK is a
concurrent-apply backstop. Brands, option links and questions cascade; jobs with
zero applications own no submitted files. No structural records or unrelated
jobs/applications are eligible. Cleanup never touches Storage or Auth directly.
CLI writes cannot call Next.js cache invalidation: allow up to 300 seconds for
each deployment's catalog cache to refresh. Do not infer cleanup/live state from
an immediately cached home page; Apply reloads visibility directly.
Unsubmitted private upload reservations remain managed by the existing expiry
cleanup; this command deliberately does not scan/delete unrelated pending files
or bypass submitted-application retention to remove them.

## Verification commands and limits

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
$env:PLAYWRIGHT_PRODUCTION = '1'
pnpm test:e2e
Remove-Item Env:PLAYWRIGHT_PRODUCTION
```

For the explicit four-page Lighthouse gate, set `RUN_LIGHTHOUSE=1` before the
full Playwright command. For the separately authorized live synthetic workflow:

```powershell
pnpm exec playwright test --config playwright.live.config.ts
```

The live config is restricted to the approved Vercel URL, verifies its project
origin before fixtures can write, and runs one targeted application/review/PDF/
deletion journey. It is not a substitute for the full local production suite.
The normal suite's setup verifies the exact DEV dataset and waits for the five
published roles to appear in the catalog, avoiding stale-cache false negatives.

The production-mode server runs locally on port 3100 against the approved shared
DEV services, not an isolated project. Browser accounts, jobs and files created
by existing tests use their own strictly validated ephemeral E2E namespaces and
are synthetic; they are separate from the five persistent demo roles. The new
DEMO application test resolves its own application through authorized admin
deletion and verifies that cleanup refuses while it exists. Any failed run that
leaves an application must be resolved through that same safe flow.

Full runtime totals, any failures, cleanup execution and final live read-only
checks are recorded in the completion report and DECISIONS checkpoint. Do not
interpret earlier partial-delivery totals as current full acceptance.

## First runtime pass and fixes

The first full browser pass recorded 43 passed / 4 failed / 1 opt-in performance
skip. The all-eleven-type submission/review/download/PDF/delete journey and MFA
passed. Failures were diagnosed, not blanket-skipped:

- Accessibility started on an old persisted empty catalog: setup now asserts the
  real five-role catalog is ready before any populated-catalog test.
- Closing the mobile filter dialog hid it before the queued native close event
  unlocked scrolling: explicit close now unlocks synchronously, and the listener
  is installed when an empty catalog becomes populated. Assertions are retained.
- All six engagement options add a row to the desktop filter panel: reduce only
  desktop group spacing/fieldset top margin so all controls fit at 900px height.
  The original no-overflow and sticky-boundary assertions remain unchanged.
- Settings assumed an unused base option, but the new matrix uses all thirteen:
  the test now creates a nonce-namespaced unused option and checks Cancel/Escape
  against that record. Teardown removes only its owned option, not base records.

Dashboard disclosure testing also now creates its own ten synthetic applications
instead of relying on wiped shared applicants. Ephemeral public fixtures carry
the exact disclaimer in titles, including before this branch is deployed. Their
teardown checks candidate ownership as well as job namespace and refuses an
unexpected identity; private review-file cleanup is similarly namespace/domain
restricted. These test-only lifecycles are separate from the public DEMO cleanup
command, which never deletes any application.

## Exact changeset (relative to main `cd360c5`)

This includes the preserved `b583191` deletion/MFA work, `ab58263` guarded DEMO
dataset, `c295864` runtime/fixture fixes and the subsequent verification changes.
The feature branch is `demo-jobs-and-deletion`; no merge is authorized.

```text
docs/DECISIONS.md
docs/DEMO_VALIDATION.md
docs/DEMO_VALIDATION_STATUS.md
docs/RUNBOOK.md
docs/SEED_DATA.md
package.json
playwright.config.ts
playwright.live.config.ts
scripts/check-demo-live.ts
src/app/(public)/jobs/[slug]/apply/page.tsx
src/app/(public)/jobs/[slug]/page.tsx
src/app/admin/(protected)/jobs/actions.test.ts
src/app/admin/(protected)/jobs/actions.ts
src/app/admin/(protected)/jobs/page.test.ts
src/app/admin/(protected)/jobs/page.tsx
src/app/globals.css
src/app/sitemap.ts
src/components/admin/job-editor.test.ts
src/components/admin/job-editor.tsx
src/components/admin/job-row-menu.test.ts
src/components/admin/job-row-menu.tsx
src/components/public/careers-hero.tsx
src/components/public/careers-hub.tsx
src/components/public/careers-presentation.test.ts
src/components/public/careers-results.tsx
src/components/public/demo-notice.test.ts
src/components/public/demo-notice.tsx
src/db/queries/counts.ts
src/db/queries/jobs.live.test.ts
src/db/queries/jobs.ts
src/db/queries/public-test-fixture.ts
src/db/queries/review-test-fixture.ts
src/db/queries/test-fixtures.test.ts
src/db/queries/test-fixtures.ts
src/db/queries/validation-demo.test.ts
src/db/queries/validation-demo.ts
src/db/seed/validation-content.test.ts
src/db/seed/validation-content.ts
src/db/seed/validation-guard.test.ts
src/db/seed/validation-policy.ts
src/db/seed/validation.ts
src/lib/demo.ts
src/lib/questions/job-policy.test.ts
src/lib/questions/job-policy.ts
src/lib/validation/jobs.ts
tests/e2e/admin-ui.spec.ts
tests/e2e/demo-validation.spec.ts
tests/e2e/job-editor.spec.ts
tests/e2e/public-apply.spec.ts
tests/e2e/public-states.spec.ts
tests/e2e/question-builder.spec.ts
tests/e2e/settings.spec.ts
tests/support/admin-fixture.ts
tests/support/admin-worker.ts
tests/support/demo-setup.ts
tests/support/live-setup.ts
tests/support/verify-demo-target.ts
```

No changes to the real-role JSON/importer, migration SQL, `requireAdmin`, MFA
actions, Turnstile verification, upload/signature validation, Storage privacy,
CSP or hosting configuration. The primary worktree's 149 existing status entries
remain untouched and unstaged; all task edits live in `G:\career-mr`.

Review URL (agent does not create or merge the PR):
https://github.com/hossainnshakib/careers-portal/compare/main...demo-jobs-and-deletion
