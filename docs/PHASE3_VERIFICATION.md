# Phase 3 — Applications dashboard and review

## Delivered / acceptance coverage
| Requirement | Implementation / coverage |
|---|---|
| Dashboard | Total and five status counts; pre-filtered links; latest ten applications |
| Applications list | Brand/department/job/status/name-email/date filters in URL; newest/oldest/name sorting; 25-row server pagination; stable tie-breaker; clear badges/New marker; empty/loading states |
| Applicant profile | Contact data; historical position/brand/department/answer snapshots; grouped answers; safe HTTP(S) links; previous email matches; Bengali text; two-column desktop layout |
| Status management | Locked transactional from/to/actor event and matching change timestamp; no-op does not create an event; readable history |
| Notes | Trusted author UUID/email snapshot, newest first, add and author-only deletion; candidate pages never load notes |
| Downloads | Independently gated UUID route; 60-second private signed download redirect; no-store/no-referrer |
| Application deletion | Confirmation dialog; reversible quarantine; DB cascade; original/quarantine object cleanup; committed-state checks; authorized retry after cleanup failure |
| Security/tests | Discovery registry, anonymous/non-admin direct and HTTP denial, real allowlist checks, RLS, transaction/storage-failure tests, live mutation/pagination/download/deletion checks and full browser regressions |

## Owner walkthrough
1. Run `pnpm dev` and sign in at `/admin/login` with an existing allowlisted dev admin.
2. Click a dashboard status card, then try Brand/Status/Job and name/email filters. Change Sort and use Next/Previous page. Copy/reload the URL; filters and timezone remain.
3. Open a candidate name/reference. Check contact details, Bengali answers, previous applications and safe portfolio links.
4. Choose a status and click **Update status**; confirm the new history entry with actor and date.
5. Add an internal note, then use **Delete own note**. Other admins' notes remain visible but cannot be deleted by you.
6. Click **Download CV** or another attachment link. The browser receives a short-lived signed download, never a public applicant URL.
7. Choose **Delete application**, confirm, and return to the list. On cleanup failure, follow the provided retry link/control.

## Commands
```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Cloud integration (run separately from browsers):
```powershell
$env:RUN_SUPABASE_TESTS = '1'
node --env-file=.env.local node_modules/vitest/vitest.mjs run src/db/queries/review.live.test.ts src/lib/auth/surfaces.live.test.ts src/db/rls.test.ts
Remove-Item Env:RUN_SUPABASE_TESTS
```

## Decisions / deviations
- Owner-approved branch starts from committed Phase 2, without a main merge.
- No schema/migration/dependency changes. Statuses/permissions remain the documented model.
- Deletion quarantines originals reversibly before DB commit, then removes them. A cleanup failure after commit leaves no dangling DB references and is explicitly reported; retries remove remaining private quarantine objects.
- Downloads recover files from an interrupted deletion while the application still exists. Permanent provider failures require an admin retry; automatic quarantine reconciliation is not claimed.
- Date filters retain the viewer's timezone in the URL; assignment filters use current job IDs while labels/details use snapshots. Previous-email matches are capped at the latest 50 other applications.
- Existing Phase 2 abandoned-upload/reservation cleanup remains Phase 5; deletion verification covers linked application objects and deletion quarantine.

## Not verified / later work
- No physical-phone review test, Vercel preview, production deployment/credentials, or real production outage/crash injection.
- Storage move/remove and commit-acknowledgement failure handling is tested with controlled provider/transaction fixtures; healthy-path persistence/deletion is also tested against actual dev Supabase.
- Bengali website/profile/notes are verified. Bengali PDF shaping is still untested and must be checked before Phase 4; PDF export is not in this phase.
- The remaining old opt-in auth-foundation/job/seed cases were not rerun here; default skips are not live verification of those cases.

## Final checkpoint
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: 31 files / 249 cases passed; six opt-in live files / 73 cases skipped in the default run.
- Separate live execution of `review.live.test.ts`, `surfaces.live.test.ts` and `rls.test.ts`: all three files / 64 cases passed, none skipped (six review cases, 47 real authorization checks and 11 anonymous RLS checks). The six review cases passed again after adding explicit Bangladesh-timezone and literal wildcard/SQL-text search assertions.
- `pnpm build`: passed with the existing pinned development configuration, including framework lint/types and new dynamic review/download routes.
- `pnpm test:e2e`: all 12 serial Chromium tests passed, covering existing admin/public regressions and the new review flow. Anonymous and authenticated non-admin HTTP requests were denied for every protected page and the attachment endpoint, with no signed URL for denied API callers.
- The review browser case verifies Bengali snapshots, previous-email matches, inert unsafe URL text, an actor-labelled status event, own-note add/delete, an actual private PDF download, removal of the application and cascading rows/original/quarantine objects, and preservation of a different application.
- Dev guards passed before cloud operations. Fixtures removed their temporary accounts, allowlist rows, random-prefix data and tracked private objects. No owner credentials, production access, reset, reseed, dependency addition or applied migration edit was used.
- No unresolved failing checks remain. The owner subsequently approved a local Phase 3 commit as the starting point for Phase 4; no push was requested.
