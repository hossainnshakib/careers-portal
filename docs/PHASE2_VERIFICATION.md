# Phase 2 — Public careers and applications

## Scope delivered
- Careers home with active-brand tiles, job cards, search, URL multi-filters, facet counts, removable chips, empty state, single-brand header and native mobile filter sheet.
- Public job detail with sanitized Markdown, metadata, mobile sticky Apply link and closed/expired state. Drafts return 404.
- Dynamic application form with fixed contact fields/CV, all eleven question types, Other/date handling, Bengali input, react-hook-form and shared Zod validation.
- Real Turnstile verification, honeypot and server-timed minimum fill time.
- Direct private Storage uploads, two-hour job-bound signed sessions, server-owned reservations/paths, serialized eight-file quota, progress/remove/retry UX and fresh-session recovery.
- Transactional application/answer/attachment snapshots, attachment IDs in file answers, unique references, idempotent retries and reference-only success pages.
- Sitemap and robots rules.

## Verification
Results are recorded at the final checkpoint below. Browser tests use actual dev Supabase/Auth/Storage and official Cloudflare test keys; they are not a production deployment test.

Commands:
```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Targeted browser command:
```powershell
pnpm exec playwright test tests/e2e/public-apply.spec.ts
```

Coverage includes failed/expired challenges and sessions, closed/draft jobs, unknown/missing answers, path/token/slot tampering, actual MIME/size/signature mismatch, private reservation ownership, concurrent quota enforcement, persistence-failure recovery and commit-acknowledgement loss. The happy path verifies application, answer and attachment rows, Bengali text, snapshots and attachment-answer linkage.

## Owner walkthrough
1. Start `pnpm dev` and browse `/`. Select multiple brands or filters; copy the resulting URL and reload it.
2. Open a role and read its brand/department/content sections. Apply with Bengali or English contact details and answers.
3. Complete the security check, upload a CV and any required question attachments, wait for uploads to finish, then submit after the fresh security check is ready.
4. Keep the displayed `APP-......` reference. Applicant review is a Phase 3 deliverable.
5. For a phone, run `pnpm dev --hostname 0.0.0.0` and visit the PC's IPv4 address on port 3000 over the same Wi-Fi. Detailed phone/preview instructions are in `docs/DEV_SETUP.md`.

## Decisions and limitations
- Branch starts directly from Phase 1 under explicit owner approval. No migration, reset or reseed is required.
- Reservation sidecars include unfinished/removed files in the lifetime eight-slot quota. **Start fresh uploads** preserves written answers and resets file selections.
- Uncommitted finalized objects are restored rather than deleted on failure, with a committed-record check before recovery. See ARCHITECTURE/DECISIONS for this change from the original plan.
- Abandoned pending files/sidecars require Phase 5's daily cleanup. A recovery infrastructure failure can require manual reconciliation of an uncommitted final object; no automated orphan-final cleanup is claimed.
- File signatures are bounded type checks, not antivirus or full format validation.
- No physical phone test, Vercel preview deployment, real production Turnstile-key test, production database operation or production-runtime deployment has been performed.
- Candidate PDF shaping and applicant review are outside Phase 2. Bengali website text is covered; Bengali PDF shaping remains untested before Phase 4.
- Opt-in live auth/RLS/seed/job suites are separate from the default tests; recorded skips are not live verification.

## Final checkpoint
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: 26 files / 219 cases passed; five opt-in live files / 55 cases skipped. Those skipped suites were not rerun in this phase.
- `pnpm build`: passed, including Next.js compilation, framework type/lint checks, static metadata generation and route build traces. Build used the existing development configuration, not production credentials.
- `pnpm test:e2e`: all 11 Chromium tests passed in serial execution, including existing admin authorization/catalog/job/question regressions and both Phase 2 browser tests.
- The public apply browser case verified actual dev application/answer/attachment rows and Bengali snapshots, a generated PDF CV plus required PDF work sample, a warm detail cache with a future deadline, exactly six accepted/one rejected concurrent reservations after two completed uploads, and denial of further upload authorization after submission.
- Dev target checks passed before live work. Temporary account/catalog/application rows and all tracked pending/reservation/final test objects were removed by the guarded fixture teardown. No production access, reset, reseed or migration was performed.
- Earlier browser failures were resolved without dropping assertions: no-JavaScript HTML required moving the old root loading boundary; the test now awaits the complete admin action response before logout and job navigation before reloading the detail cache.
- No unresolved failing checks or implementation blockers remain. The owner subsequently authorized a local Phase 2 commit on `phase-2-public-apply`; no push has been requested.
