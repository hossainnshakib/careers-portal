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

**Bengali PDF shaping is untested.** The owner deferred the spike; complete it before Phase 4 as described in DECISIONS.md. The website has self-hosted Hind Siliguri; any future PDF test must use static TTFs, not Inter's website-only variable font.

## Resetting development
`pnpm db:reset:dev` is destructive: it removes known application files, drops the application tables/types/migration ledger, reapplies migrations, and runs demo seeding. It requires the independent dev pin and validates both database targets before touching data. It does not drop Supabase Auth, Storage schemas, or the public schema. It does not clean unreferenced/pending uploads; stale pending cleanup belongs to Phase 5.

## Phase 2 public applications
Browse `/`, try `/?brand=doshok,builtale&mode=remote&q=developer`, open a role, then choose **Apply for this role**. Drafts are unavailable publicly; closed/expired roles do not accept uploads or submissions. Contact fields, CV requirements and role questions are validated on the server against current definitions. Successful submission redirects to a reference-only acknowledgement. Applicant review comes in Phase 3.

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
