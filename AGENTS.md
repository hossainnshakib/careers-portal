# AGENTS.md — Careers Portal (careers.fixenmedia.com)

You are working on a small, purpose-built recruitment hub (a lightweight ATS) that serves several brands from one place. Candidates browse open jobs from many brands and apply through a dynamically generated form. Internal admins create jobs, review applications and export candidate profiles. It is NOT an HRMS. Keep it small and maintainable.

## Read first, every session
1. `docs/PRODUCT.md` — scope, user flows, what is out of scope
2. `docs/ARCHITECTURE.md` — stack, flows, security model, environments
3. `docs/SCHEMA.md` — database tables and rules
4. `docs/SEED_DATA.md` — departments, the 19 jobs, brands, demo-data rules
5. `docs/DESIGN.md` — look and feel, logos, fonts
6. `docs/DECISIONS.md` (if it exists) — decisions made during the build; newer entries win

If a task conflicts with these files, stop and ask. If you change a decision, update the relevant doc in the same change.

## Project facts
- Project root: `G:\career` (Windows dev machine). All paths relative to it.
- Production URL (later): `careers.fixenmedia.com`. Brand sites link in with `/?brand=<slug>`.
- Public site and admin live in ONE Next.js app (route groups). Admin is under `/admin`.
- Candidates have no accounts. Only internal admins log in.
- Data owner is a single small team. Do not build multi-tenancy, roles/permissions, or workflows beyond what PRODUCT.md lists.

## Stack (decided)
- Next.js App Router, TypeScript strict. The owner's other projects use Next.js 15; use 15.x unless there is a concrete reason, and ask before using a different major version.
- Tailwind CSS + shadcn/ui
- Drizzle ORM + drizzle-kit migrations on Supabase Postgres (postgres.js driver; `prepare: false` for the transaction pooler)
- Supabase: Auth (`@supabase/ssr`) and Storage only. All other data access goes through Drizzle.
- Zod, react-hook-form, nuqs (URL-driven filter state)
- `@react-pdf/renderer` for the candidate PDF (Bengali text must be tested early; see ARCHITECTURE.md)
- Cloudflare Turnstile for spam protection
- Vitest (unit/integration) and Playwright (e2e)
- pnpm, Node 20+ (pin in `.nvmrc` and `engines`)
- Do not add other dependencies without asking. When you propose one, say why and what you considered instead.
- Do not trust memory for framework APIs. Check the docs/types of the installed versions (Next.js 15 made `cookies()`, `headers()`, `params` and `searchParams` async, for example).

## Scope guard
Do NOT build, even if it seems helpful: candidate accounts/login, interview scheduling, offer letters, payroll, employee management, email automation or notifications, assessments, AI ranking/scoring, interview scorecards, calendar integrations, role-based permissions, multi-tenant architecture, a CMS, a blog. If a task seems to need one, stop and ask.

## Security rules (non-negotiable)
- Every admin page, server action and route handler calls `requireAdmin()` itself. Middleware is only a redirect convenience, never the gate.
- `requireAdmin()` uses `supabase.auth.getUser()` (never `getSession()` for authorization) and then checks the `admin_users` allowlist table.
- Supabase sign-ups are disabled. Admin users are created manually (see Phase 1 prompt) and added to `admin_users`.
- `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are server-only: only imported from files that start with `import "server-only"`. Never prefix them with `NEXT_PUBLIC_`.
- RLS is enabled on every table with NO policies, so the public anon key can read nothing. All data access is server-side.
- Storage: the `applications` bucket is private. Candidate files are never served by public URL; admins get short-lived signed URLs (about 60 seconds) after `requireAdmin()`.
- Validate every input server-side with Zod, even if the client already validated. Never trust client-sent job/question definitions: reload them from the database.
- File uploads: allowlist of MIME types and extensions, size limits, filename sanitisation, server-chosen storage paths.
- Render user-provided text as text. Markdown fields (job description etc.) are rendered through a sanitising renderer with raw HTML disabled. SVG logos are only ever shown via `<img>`, never inlined.
- No secrets, tokens, applicant data or PII in logs, error messages shown to users, or git.
- Never edit a migration that has been applied; add a new one.

## Environments and data safety
- Right now only a DEV Supabase project exists. Demo data lives there.
- Scripts that create demo data or reset the database must refuse to run if `APP_ENV=production` or if the database URL looks like the production project. Include a hard guard and a test for it.
- You never receive production credentials. The owner runs production migrations manually.

## Windows / dev machine notes
- Write scripts so they work in PowerShell and cmd: use `tsx`/Node scripts, not bash-only syntax; no `rm -rf` in npm scripts (use `rimraf` or Node `fs`).
- `.gitattributes` enforces LF line endings. Do not commit CRLF.
- Keep paths short and avoid spaces.

## Workflow
- For any non-trivial task: write a short plan first (files you will touch, approach, risks) and wait for the owner's "go". Small fixes can proceed directly.
- Small, reviewable commits with clear messages. One phase per branch (`phase-0-foundation`, `phase-1-admin`, ...).
- Prefer simple, boring code over abstractions. No generic frameworks, no premature configurability.
- Before declaring a task done run: `pnpm typecheck && pnpm lint && pnpm test`. For user-visible flows also run the relevant Playwright test, and say plainly what you did NOT verify.
- Write tests for: `buildSchema` (every question type, valid/invalid), auth gating of every admin route and action, RLS (anon key reads nothing), the demo-seed production guard, and the apply + review happy paths (e2e).
- Do not do large refactors or rewrite files you were not asked to touch. Do not reformat unrelated code.

## Code conventions
- English for code, comments, docs, commit messages. UI copy is English first; Bengali text must render correctly everywhere (names and answers can be Bengali).
- Server actions return a typed result (`{ ok: true, data } | { ok: false, error }`), never throw to the client for expected failures.
- Keep DB access in `src/db/queries/*`. Keep storage access behind `src/lib/storage/*` so the storage provider could change later.
- Use `import "server-only"` in server-only modules.
- Dates stored as UTC `timestamptz`; display in the viewer's locale/timezone (the team is in Bangladesh, UTC+6).

## Communication
- The owner writes in Bangla or English. Reply in the language the owner uses in the current message; keep code and docs in English.
- End every task with a short report: what you did, files changed, how you verified it, what you did not verify, deviations from the docs, and open questions.
- If something is ambiguous, ask one focused question instead of guessing on anything touching security, data shape, or scope.
