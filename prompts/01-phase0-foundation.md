# 01 — Phase 0: Foundation

**Owner checklist before running**
- Create a Supabase **dev** project in the Singapore region. Disable email sign-ups (Auth settings). Copy the URL, anon/publishable key, service-role/secret key and the database connection strings into `.env.local` (never commit it).
- Create a Cloudflare Turnstile widget (or use Cloudflare's documented test keys for local dev) and put the keys in `.env.local`.
- Generate two long random strings for `UPLOAD_SESSION_SECRET` and `CRON_SECRET`.
- Create a private GitHub repo and connect it (the agent will do the first commit/push if you allow it).
- Do NOT attach the custom domain yet.

---

## PROMPT (paste everything below)

Phase 0 of the Careers Portal. Re-read `AGENTS.md` and `docs/` first, plus `docs/DECISIONS.md` if it exists, then write a **plan** (files you will create, dependencies with exact versions and why, risks) and wait for my "go" before changing anything.

After I say go, create branch `phase-0-foundation` and build only this:

1. **Scaffold** the Next.js app in this folder. The folder is not empty (docs, prompts, design), so scaffold in a temporary subfolder and move the result, or set up manually. Keep my existing files. TypeScript strict, App Router, Tailwind, shadcn/ui, ESLint, Prettier, `src/` directory, `@/` alias. Pin Node in `.nvmrc` and `engines`.
2. **Tooling**: Vitest, Playwright (config only plus one smoke test), scripts `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `seed:base`, `seed:demo`, `db:reset:dev`. All scripts must work on Windows PowerShell. GitHub Actions workflow running install, typecheck, lint, test.
3. **Env**: `src/lib/env.ts` with Zod validation split into server and public parts, failing fast with clear messages. `.env.example` already exists; keep it in sync.
4. **Database**: implement `docs/SCHEMA.md` exactly with Drizzle (enums, tables, FKs, indexes). Generate the first migration. Add a second migration that enables RLS on every table with no policies, creates the one-primary-brand partial unique index and the slug-immutability trigger. Run migrations against the dev project.
5. **Storage**: a small script or documented step that creates the `applications` (private) and `brand-assets` (public) buckets in the dev project. Put storage helpers behind `src/lib/storage/`.
6. **Seeds**: `seed:base` (departments + brands per `docs/SEED_DATA.md`) and `seed:demo` (everything demo, per that file). Copy `design/logos/*.svg` to `public/brands/`. Add the production guard to `seed:demo` and `db:reset:dev` and unit-test it.
7. **Design foundation**: self-hosted fonts in `assets/fonts` (a Bengali font and a Latin font, OFL licensed, with the licence files), Tailwind theme tokens from `docs/DESIGN.md`, a `BrandLogo` component (fixed box, `object-fit: contain`, light panel), a `BrandAccent` helper, and a bare layout shell. No real pages yet beyond a placeholder home that lists the brands from the database to prove the stack works end to end.
8. **Bengali PDF spike**: a dev-only page/route `/dev/pdf-test` (404 unless `APP_ENV=development`) that renders a PDF with `@react-pdf/renderer` containing this text with the registered Bengali font: `বাংলাদেশ`, `কর্মক্ষেত্র`, `যুক্তাক্ষর: ক্ষ ঞ্জ দ্ব স্ত্র ন্ধ শ্রী`, `আমি একজন ওয়েব ডেভেলপার।` and the Latin text `Candidate Profile — Shakib`. Try to rasterise the PDF to PNG yourself (for example `pdftoppm`) and look at it. Report honestly whether conjuncts and vowel signs look correct, and ask me to open the PDF and confirm. Record the outcome and your recommendation in `docs/DECISIONS.md`. Do not build the real PDF yet.
9. `GET /api/health` returning `{ ok: true }` only (no environment details).
10. Create `docs/DECISIONS.md` with the dated decisions made in this phase (framework versions chosen, any deviation from the docs).

**Constraints**: no admin UI, no auth pages, no public job pages, no uploads, no applicant flow in this phase. Do not touch production anything. No dependency beyond what you list in the plan without asking.

**Verification you must run and show**: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm db:migrate` on dev, `pnpm seed:demo` on dev, a query showing row counts for departments (6), brands (8), jobs (19), questions, applications; proof that the seed guard refuses to run with `APP_ENV=production`; the placeholder home page rendering brands.

**Report** (end of task): what you did, files changed, how verified, what you did NOT verify, deviations from docs, open questions, and the exact commands I should run to see it working. Then stop and wait.
