# Development setup (Windows)

## Owner prerequisites
1. Use Node 24 and pnpm 12.9.1. pnpm was activated on this machine through Corepack.
2. Use the existing DEV Supabase project in Mumbai (`ap-south-1`). Disable email sign-ups. Production region will be chosen by comparing Singapore/Mumbai latency before creating the production project; Vercel functions must match the chosen Supabase region.
3. Copy `.env.example` to `.env.local` locally (never into chat or git).
4. Fill every required field. Pin `DEV_SUPABASE_PROJECT_REF` to the DEV dashboard's project reference. Runtime `DATABASE_URL` uses the pooler; migration `DIRECT_URL` uses direct Postgres or the session pooler if your network cannot reach IPv6.
5. Use documented Cloudflare Turnstile test keys for development. Generate independent random secrets of at least 32 characters for upload sessions and cron.

## Commands (one at a time in PowerShell)
```powershell
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm storage:ensure
pnpm seed:demo
pnpm db:counts
pnpm dev
```

Open `http://localhost:3000`. The careers home reads open jobs and active brands from Postgres; it does not substitute static seed data. A fresh Phase 1 demo database should have 6 departments, 8 brands, 19 jobs, 212 active questions, and 30 applications. An untouched Phase 0 database upgraded by the conservative seed has 269 total questions, including 57 archived legacy definitions. Edited jobs are preserved and may retain their previous question counts. The health endpoint is `http://localhost:3000/api/health` and returns only `{ "ok": true }`.

Without configured server environment variables the home shows a generic setup state. With configuration but a failed database connection it shows the normal error boundary. This is not proof of database connectivity.

## Verification
```powershell
pnpm typecheck
pnpm lint
pnpm test
```

For the live anonymous-key RLS check after migrations and seeding:
```powershell
$env:RUN_SUPABASE_TESTS = '1'
node --env-file=.env.local node_modules/vitest/vitest.mjs run src/db/rls.test.ts
Remove-Item Env:RUN_SUPABASE_TESTS
```

The production guard tests include the actual demo/reset CLI entry points with synthetic connection strings. They must refuse before making network calls. Do not weaken the dev project pin to get a test to pass.

The owner authorized Chromium installation and e2e execution during Phase 1. Chromium is installed on this development machine. Run `pnpm exec playwright test tests/e2e/admin-shell.spec.ts` for anonymous admin redirects/login accessibility. The smoke test remains in `tests/e2e/smoke.spec.ts`; job authoring and public application flows have separate browser coverage.

## Phase 1 admin access
After creating an Auth user manually in the **dev** dashboard (email/password, auto-confirm; sign-ups remain disabled), add that existing user to the allowlist:
```powershell
pnpm admin:add <email>
```
Replace `<email>` with the Auth user's email. This idempotent command checks the pinned dev target, does not create Auth accounts and does not print credentials. Then run `pnpm dev` and visit `http://localhost:3000/admin/login`.

To run the live auth foundation checks:
```powershell
$env:RUN_SUPABASE_TESTS = '1'
node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/auth/requireAdmin.live.test.ts
Remove-Item Env:RUN_SUPABASE_TESTS
```
The tests check the independent dev pin before any mutation, create ephemeral Auth users, verify anonymous/non-allowlisted denial and allowlist revocation, then delete the test users in teardown. They never use the owner's credentials. These foundation checks do not replace the exhaustive admin surface and job-creation e2e tests required later in Phase 1.

Departments and brands management are available from the signed-in sidebar. Run their browser checks with:
```powershell
pnpm exec playwright test tests/e2e/departments.spec.ts tests/e2e/brands.spec.ts
```
The shared dev-guarded fixture creates a temporary admin and deletes its Auth/allowlist entries, random-prefix catalog rows and uploaded test logos in teardown. Tests disable traces for credential-entry flows and never use the owner's account. These tests perform dev-only writes; they refuse a target that fails the independent dev-project guard.

## Phase 1 job authoring
Open `/admin/jobs` and choose **Create job**. The one-page editor contains Basics, Content, Questions and Candidate form preview. Choose brands and one primary, enter an ASCII slug, write Markdown, add/edit questions or copy them from another job, and use **Add standard questions** for the seven defaults. Save a draft or publish. Published slugs are locked; close/reopen preserves the URL. Duplicate creates an independent draft. Only unpublished drafts without applications can be deleted.

Use the local candidate preview to check answers, radio/dropdown/Other controls and date bounds before saving. Preview files and answers are never submitted; date `today` bounds use UTC, while the deadline input uses your local timezone. Question removal archives definitions when the job has applications. Existing answers keep snapshots.

See `docs/PHASE1_VERIFICATION.md` for the acceptance matrix and complete authoring walkthrough.

Final verification commands (one at a time):
```powershell
pnpm typecheck
pnpm lint
pnpm test
$env:RUN_SUPABASE_TESTS = '1'
node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/auth/requireAdmin.live.test.ts src/lib/auth/surfaces.live.test.ts src/db/rls.test.ts src/db/queries/jobs.live.test.ts
Remove-Item Env:RUN_SUPABASE_TESTS
pnpm test:e2e
```
The default browser suite runs serially against the shared dev database. Do not run the seed-upgrade preservation test concurrently with other tests that create applications, because it intentionally fingerprints all existing applications/answers before and after seeding. To repeat that check separately, use the same live flag with `src/db/seed/upgrade.live.test.ts`.

**The deferred Bengali PDF spike passed in Phase 4.** Static Hind Siliguri Regular/Bold were compared visually with a same-font Chromium reference. See `docs/PHASE4_VERIFICATION.md` for generated samples and limitations; Inter's website-only variable font is not used in PDFs.

## Resetting development
`pnpm db:reset:dev` is destructive: it removes known application files, drops the application tables/types/migration ledger, reapplies migrations, and runs demo seeding. It requires the independent dev pin and validates both database targets before touching data. It does not drop Supabase Auth, Storage schemas, or the public schema. It does not clean unreferenced/pending uploads; stale pending cleanup belongs to Phase 5.

## Phase 2 public applications
Browse `/`, try `/?brand=doshok,builtale&mode=remote&q=developer`, open a role, then choose **Apply for this role**. Drafts are unavailable publicly; closed/expired roles do not accept uploads or submissions. Contact fields, CV requirements and role questions are validated on the server against current definitions. Successful submission redirects to a reference-only acknowledgement. Applicant review is available at `/admin/applications`.

Use Cloudflare's always-pass test site/secret keys in the dev environment. No Turnstile bypass endpoint is provided, and test secrets are rejected when `APP_ENV=production`. A security check starts the upload session, then a fresh check protects submission. Files go directly to the private Storage bucket; at most eight upload reservations are issued per two-hour session. Use **Start fresh uploads** if the session expires or its slots are exhausted; written answers remain, but files must be selected again.

To test on a phone on the same Wi-Fi network:
```powershell
pnpm dev --hostname 0.0.0.0
ipconfig
```
Open `http://<your-PC-IPv4-address>:3000` on the phone. Check brand links, the Filters bottom sheet, job detail, Bengali input, upload progress and the success reference. For local-network testing use the documented dev Turnstile keys; real keys validate the hostname from `NEXT_PUBLIC_SITE_URL`. If Windows prompts for firewall access, allow the dev server on your private network. Stop the server with Ctrl+C.

Alternatively, deploy this branch as a Vercel preview with **dev-only** Supabase credentials, the dev project pin, `APP_ENV=development`, a preview-appropriate `NEXT_PUBLIC_SITE_URL` and Turnstile configuration. Never point a preview at production. No preview was deployed by this phase.

Run the targeted browser checks:
```powershell
pnpm exec playwright test tests/e2e/public-apply.spec.ts
```
They cover initial URL-filtered HTML without JavaScript, mobile filters, sitemap/robots, actual Turnstile checks, direct uploads of a generated PDF CV and work sample, concurrent reservation limits, final application/answer/attachment rows and Bengali preservation. The ephemeral admin/job and all tracked test upload objects are dev-guarded and removed in teardown; traces are disabled. See `docs/PHASE2_VERIFICATION.md` for results and limitations.

## Optional dev database availability workflow
After creating a private GitHub repository, add these **dev-only** repository secrets:
- `DEV_DATABASE_URL`
- `DEV_DIRECT_URL`
- `DEV_SUPABASE_URL`
- `DEV_SUPABASE_PROJECT_REF`

Set repository variable `DEV_KEEPALIVE_ENABLED` to `true` and merge `.github/workflows/dev-keepalive.yml` onto the default branch. Run it manually once before relying on its daily schedule. It executes a guarded `select 1`, prints no credentials, and cannot target a different project. GitHub schedules can be delayed; an already paused project must be restored in the Supabase dashboard.

No GitHub remote or production project is configured by these files. No production credentials are needed during this phase.

## Phase 3 application review
1. Sign in at `/admin/login`. The dashboard shows Total/New/Under review/Shortlisted/Rejected/Hired counts and the latest ten applications. Click a count to filter the list.
2. Open **Applications**. Filter by brand, department, job, status, date range or name/email; choose sorting and use pagination. Copy the URL to retain filters. Calendar date bounds use the timezone shown below the controls.
3. Click a candidate name/reference to open the profile. Review contact details, Bengali answers, snapshots, previous applications, status history and attachments.
4. Choose **Application status** and click **Update status**. Write an **Internal note** and click **Add note**; only your own notes show **Delete own note**.
5. Use **Download CV** or an attachment link. Each request independently checks the allowlist and redirects to a roughly 60-second signed URL; files remain private.
6. To remove an application, choose **Delete application** and confirm. If Storage cleanup fails, use the displayed retry link/control. A retained application recovers its quarantined files before retry/download; a committed deletion retries temporary-file cleanup.

Targeted browser and live integration checks:
```powershell
pnpm exec playwright test tests/e2e/review.spec.ts tests/e2e/admin-gating.spec.ts
$env:RUN_SUPABASE_TESTS = '1'
node --env-file=.env.local node_modules/vitest/vitest.mjs run src/db/queries/review.live.test.ts src/lib/auth/surfaces.live.test.ts src/db/rls.test.ts
Remove-Item Env:RUN_SUPABASE_TESTS
```
Run cloud integration and browser suites separately. These checks create only dev-guarded, random-prefix fixtures/temporary Auth accounts and remove their rows and original/quarantined objects afterward. Credentials travel over IPC, and traces are disabled. See `docs/PHASE3_VERIFICATION.md` for results. Candidate Profile PDF is now available from the profile sidebar.

## Phase 4 MFA and PDF walkthrough
### Browser fixture recovery
Browser suites run a dev-pinned fixture-account sweep before and after execution, in addition to per-fixture `finally` teardown and child disconnect/signal handling. Run only one suite at a time against the shared dev project (CI already serializes runs). After a hard crash, rerun the suite or run:

```powershell
node --env-file-if-exists=.env.local --conditions=react-server --import tsx src/db/sweep-test-accounts.ts
```

The sweep removes only the reserved `e2e-<32hex>-admin@example.com` accounts and their allowlist rows; output is counts only. Its recovery/preservation check is `src/db/queries/test-accounts.live.test.ts` with `RUN_SUPABASE_TESTS=1`; run that file alone, after other live checks have finished, because it sweeps their shared fixture namespace. CI has a separate sequential step for it. The one-time `orphans` argument removes only allowlist rows with no Auth user and explicitly protects the owner row.

`APP_ENV` must be explicit. Production build/start refuses missing, empty or unknown settings and refuses Cloudflare's test site keys/secrets outside `APP_ENV=development`. Production-mode e2e is the acceptance gate; development-mode editor cold compilation is not a hardening target.

1. Sign in with your allowlisted admin email/password. Password-only sessions go to `/admin/mfa` and cannot read applications, mutate jobs, or download files/PDFs.
2. Choose **Set up authenticator**, re-enter your administrator password (enrollment is refused to a session that only holds a stolen cookie), scan the QR code in a TOTP app (or enter the setup key), then enter its six-digit code. On later sign-ins use **Authenticator code**. Setup secrets/codes are never logged; keep your authenticator available.
3. If a verified authenticator is lost, the portal owner must recover the account manually in the Supabase dashboard: revoke sessions/remove the lost factor, then have that admin sign in and enroll again. The app provides no password-only bypass or verified-factor reset endpoint. Never share recovery credentials in chat or git.
4. Open an applicant profile and choose **Download Profile PDF**. Notes are excluded by default. Select **Include internal notes in PDF** only when intended. CV and attachments remain separate downloads.
5. Review English/Bengali samples and long/many-answer pagination. Temporary files are listed in `docs/PHASE4_VERIFICATION.md`.

Stop any development server before an optimized build. Production-mode Playwright owns a separate port 3100 and never reuses a running dev server:
```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
$env:PLAYWRIGHT_PRODUCTION = '1'
pnpm test:e2e
Remove-Item Env:PLAYWRIGHT_PRODUCTION
```
The optional Lighthouse test is skipped in the normal suite but was executed separately:
```powershell
$env:PLAYWRIGHT_PRODUCTION = '1'
$env:RUN_LIGHTHOUSE = '1'
pnpm exec playwright test tests/e2e/performance.spec.ts
Remove-Item Env:RUN_LIGHTHOUSE
Remove-Item Env:PLAYWRIGHT_PRODUCTION
```
It runs Lighthouse 13.5.0 via pnpm dlx against anonymous public pages, writes reports into the approved temporary directory, and passes no application credentials to the tool. Scores are local simulated-mobile measurements, not deployed field metrics.

For CI's guarded push-only cloud/browser job, set `DEV_TESTS_ENABLED=true` and these **dev-only** repository secrets: `DEV_SUPABASE_PROJECT_REF`, `DEV_DATABASE_URL`, `DEV_DIRECT_URL`, `DEV_SUPABASE_URL`, `DEV_SUPABASE_ANON_KEY`, `DEV_SUPABASE_SERVICE_ROLE_KEY`, `DEV_UPLOAD_SESSION_SECRET`, `DEV_CRON_SECRET`. CI uses official Turnstile test keys and `APP_ENV=development`. No production credentials belong in this job. It runs cloud tests before browsers and serializes shared-dev jobs. No GitHub run was triggered by this phase.
