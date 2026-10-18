# Bulk job import

## Administrator workflow

1. Sign in at `/admin` with the existing password and TOTP MFA flow.
2. Open **Jobs → Import jobs** (`/admin/jobs/import`). Download the JSON example/template or use an approved dataset below.
3. Upload one UTF-8 JSON file, at most **750,000 bytes and 20 jobs**. All jobs must use the version 1 contract. The template is only an example draft; replace its example content before importing.
4. Click **Validate and preview**. Resolve every error. Review each proposed status, duplicate/skip result, and the expanded full-field/question-options preview.
5. Tick the explicit confirmation and click **Confirm import**. Jobs marked `published` open immediately; `draft` jobs remain private.
6. Review the per-job results. Open **Jobs** to edit a newly created draft or inspect a published job at `/jobs/<slug>` and its questions at `/jobs/<slug>/apply`. Do not submit a test application on production.

The feature must be reviewed and deployed by the owner before these routes exist on the hosted website. Implementing/preparing files does not publish any live jobs.

## Contract

See `public/imports/job-import-template.json` for the complete strict JSON shape. Unknown properties, database IDs, unsupported versions, oversized files and invalid values are rejected. Every field in the template is required; optional content uses an empty string, empty list or `null` as shown. There is no CSV support.

- `department`, `primaryBrand`, `brands`, and `options` use **existing catalog slugs**, not labels or database IDs. Department and selected options must be active; brands must be visible/active. The primary must belong to `brands`. Import never creates or changes catalog entries.
- `options.arrangement` maps work arrangements; `options.engagement` maps engagement/employment types; `options.experience` maps experience levels. Exclude `senior` to leave it off. Published jobs need at least one arrangement and one engagement.
- Salary is `negotiable` with empty `salaryText`, or `range` with nonempty single-line text. Existing limits apply: summary 200 characters; skills at most 20 items / 40 characters each; benefits at most 12 items / 60 characters each. No truncation, splitting or silent content shortening.
- All existing content fields, deadline, vacancies, experience text, engagement note and CV policy are supported. New datasets use **Chittagong**, not Chattogram.
- `status` is `draft` or `published`; the latter maps to the existing service's publish intent and stored `open` status/publication timestamp. No closing or updating through import.
- `includeStandardQuestions: true` prepends independent copies of the existing seven standards. Set false and list standards explicitly for exact authored wording/required flags, as the approved datasets do. Do not include both copies accidentally. The final total cannot exceed 100 questions.
- `questions` use the existing eleven types, sections, help text, config, ordered options (`{value,label}`) and required flags. Array order determines stored question order; the existing application renderer groups by section. Options retain their exact order. Single choice defaults to dropdown; an explicit `radio` config is rejected with an error rather than silently changed. Other question types keep existing behavior and limits.
- `portfolioRequired` is an import-time policy, **not a new database column**. When standards are included it makes their portfolio URL required. Otherwise supply an explicitly required `url` question in the `portfolio` section. Missing that question is an error. It uses the existing shared client/server answer validator. Portfolio attachment requests can additionally be expressed through existing file-upload questions; they do not substitute for this specified portfolio URL policy.

## Approved dataset status

### Job 04

`public/imports/job-04.json` contains the complete owner-supplied content, five separate benefits, all eighteen skills and fourteen questions. It requests publication; single choice is a dropdown with the exact four options. Associated brands are exactly the three explicitly specified by the owner: Fixen Media (primary), Accoraze, Builtale. No additional relationships are inferred. The administrator must confirm those active hiring needs when reviewing the import; remove any unconfirmed association before confirmation.

### Job 05

`public/imports/job-05.json` contains the complete approved specification, all seventeen skills, fourteen questions and required portfolio URL. Only Fixen Media is associated, following the owner's fallback when other hiring needs are unverified. It requests publication and passes the actual importer schema with the owner's three approved benefit corrections:

| Benefit | Length | Existing maximum |
|---|---:|---:|
| Work on brand identity projects across industries | 49 | 60 |
| Build complete brand identities, not just logos | 47 | 60 |
| Grow through creative concepts and project ownership | 52 | 60 |

The other two benefits and all remaining Job 05 content are unchanged. Both Job 04 and Job 05 validate individually and together through the importer and existing job validator using catalog fixtures; live catalog references and duplicates are rechecked by the authenticated import workflow. No field limits were changed and neither file is automatically imported.

## Safety, duplicates and recovery

- The import page and both server actions call `requireAdmin()` themselves, including verified AAL2 and the existing active-session/allowlist checks. No public import endpoint, new auth exception, credentials, RLS changes, migration or service-role access in the browser is introduced.
- Preview never writes. Confirmation revalidates the entire file and current references server-side; caller-provided IDs are not accepted.
- Existing slug **or** title matches always skip. Titles are compared after trimming, collapsing whitespace and lowercasing. Same-file repeats are identified and later repeats skip. The transactional save repeats the check under the same advisory lock used by the job editor and lifecycle service, protecting concurrent imports and retries. Existing jobs are never overwritten, including draft shells.
- Each job uses the existing job service transaction for its row, brands, options and questions. A failing job leaves no partial graph. The browser serializes one job per authenticated action request, avoiding one long-running bulk request without changing deployment timeouts.
- Import stops on failure/unknown response; earlier committed jobs remain and later jobs are not attempted. Retry **Validate and preview** with the same file: committed jobs skip. Do not rename a job just to evade a skip. A lost response does not prove rollback. Cache invalidation failure after a successful save is reported as a saved job with a warning, not a failed transaction. The existing five-minute cache fallback still applies.
- Per-job results are displayed for the current page session. Existing job timestamps/publication metadata are retained; there is no existing durable job audit trail and no new audit table is claimed. Refreshing the page clears results, but re-preview reconstructs create/skip state. No applicant records are read or written, and no applicant/file submission occurs.
- No command in this feature automatically loads either approved file into any database. The older `jobs:import-real` dev-only update script is unchanged and is not used by this feature.

## Verification

Unit tests cover contract limits, mapping, approved text preservation, duplicate handling, reference checks, portfolio validation, dropdown rendering, statuses, direct anonymous/non-admin/AAL1/expired-session denial, confirmation, transaction rollback and recovery/cache-failure reporting. `tests/e2e/job-import.spec.ts` exercises actual UI import and public rendering with random-prefix jobs and the existing dev-pinned ephemeral-admin fixture, never owner credentials or actual applicant submissions. Execution results are recorded in the delivery report below after verification.

### Verified development checkpoint — 2026-10-18

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: **638 passed**, **92 opt-in live cases skipped** in the default run (79 passing files, 8 skipped files).
- `pnpm build`: passed, including the existing PDF trace guard. The Webpack large-string cache notices are warnings, not compilation failures.
- Separate dev-pinned `RUN_SUPABASE_TESTS=1` runs: **5/5 job lifecycle/concurrent-import tests passed**; **61/61 real Auth/allowlist surface-denial tests passed**, including the import page and both actions.
- Production-mode Chromium: **2 distinct relevant specs passed** across affected reruns (`admin-gating.spec.ts`, `job-import.spec.ts`). Actual preview, confirmation, multi-job creation, duplicate re-preview, public published details/benefit/skill rendering, dropdown option ordering, mandatory portfolio marking, draft privacy and invalid-JSON feedback passed. No application was submitted. Initial new-test failures were a Node JSON-import attribute mismatch and overly broad nested-fieldset/Next route-announcer selectors; the harness/selectors were corrected without weakening assertions.
- Live/browser fixtures used only guarded development resources, ephemeral identities and random-prefix jobs; cleanup completed. No owner credentials, production import, migration, deployment or merge was performed.
- Not verified: a hosted deployment or live publication of Jobs 04/05; the entire existing browser suite, fresh live RLS, all other skipped live suites, mobile visual review or Job 05 import (deliberately blocked by unchanged benefit limits). The unrelated pre-existing working change in `src/db/queries/test-accounts.ts` is preserved and excluded from this feature commit.

### Final dataset correction — 2026-10-19

- The owner-approved replacements resolve the historical Job 05 benefit blocker above without changing field limits. The validated file is now `public/imports/job-05.json`.
- A structural comparison against commit `4166036` verified that only benefit items 1, 2 and 5 changed; items 3 and 4 and all other Job 05 content are unchanged. Job 04 remains byte-for-byte unchanged.
- Actual importer parser, preview mapping and existing job validation pass for both complete datasets individually and together using catalog fixtures. The focused dataset/validation suite passed all **26 tests**, including the required portfolio checks.
- Typecheck, lint and production build (including PDF trace guard) passed. The final default suite passed **639 tests**, with **92 opt-in live cases skipped**. The first full run hit the pre-existing PDF-worker 5-second timeout while checks ran concurrently; an unchanged standalone full-suite rerun passed.
- No importer logic, database schema, deployment settings or unrelated working changes were modified. Browser/live-database suites were not rerun for this data-only correction. No jobs were imported, merged or deployed; production catalog references and existing-job matches remain checks for the authenticated import workflow.
