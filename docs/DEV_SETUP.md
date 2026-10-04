# Phase 0 development setup (Windows)

## Owner prerequisites
1. Use Node 24 and pnpm 12.9.1. pnpm was activated on this machine through Corepack.
2. Create/confirm the DEV Supabase project in Singapore. Disable email sign-ups.
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

**Do not install Playwright browsers or run `pnpm test:e2e` until Phase 2**, per the owner's instruction. The smoke test is written in `tests/e2e/smoke.spec.ts`.

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
