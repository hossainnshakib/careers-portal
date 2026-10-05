# Phase 0 development setup (Windows)

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

Open `http://localhost:3000`. The foundation home reads active brands from Postgres; it does not substitute static seed data. A fresh demo database should have 6 departments, 8 brands, 19 jobs, 118 questions, and 30 applications. Repeat seeds preserve owner edits instead of resetting them. The health endpoint is `http://localhost:3000/api/health` and returns only `{ "ok": true }`.

Without configured server environment variables the placeholder shows a generic setup state. With configuration but a failed database connection it shows the normal error boundary. This is not proof of database connectivity.

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

The owner authorized Chromium installation and e2e execution during Phase 1. Chromium is installed on this development machine. Run `pnpm exec playwright test tests/e2e/admin-shell.spec.ts` for anonymous admin redirects/login accessibility. The Phase 0 smoke test remains in `tests/e2e/smoke.spec.ts`; the full job-creation flow is being added in Phase 1.

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

**Bengali PDF shaping is untested.** The owner deferred the spike; complete it before Phase 4 as described in DECISIONS.md. The website has self-hosted Hind Siliguri; any future PDF test must use static TTFs, not Inter's website-only variable font.

## Resetting development
`pnpm db:reset:dev` is destructive: it removes known application files, drops the application tables/types/migration ledger, reapplies migrations, and runs demo seeding. It requires the independent dev pin and validates both database targets before touching data. It does not drop Supabase Auth, Storage schemas, or the public schema. It does not clean unreferenced/pending uploads; stale pending cleanup belongs to Phase 5.

## Optional dev database availability workflow
After creating a private GitHub repository, add these **dev-only** repository secrets:
- `DEV_DATABASE_URL`
- `DEV_DIRECT_URL`
- `DEV_SUPABASE_URL`
- `DEV_SUPABASE_PROJECT_REF`

Set repository variable `DEV_KEEPALIVE_ENABLED` to `true` and merge `.github/workflows/dev-keepalive.yml` onto the default branch. Run it manually once before relying on its daily schedule. It executes a guarded `select 1`, prints no credentials, and cannot target a different project. GitHub schedules can be delayed; an already paused project must be restored in the Supabase dashboard.

No GitHub remote or production project is configured by these files. No production credentials are needed during this phase.
