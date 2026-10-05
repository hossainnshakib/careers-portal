# Decisions

Newer entries override earlier planning documents. All code and database work in this phase targets development only.

## 2026-10-05 — Phase 0 foundation

### Runtime and tooling
- Keep Next.js **15.5.27**, as required by AGENTS.md. Do not adopt Next.js 16 in this phase.
- Use Node **24.x** (`.nvmrc` and `engines`), matching the installed machine and a supported Vercel runtime. pnpm **12.9.1** is pinned through `packageManager`.
- Use React/React DOM **19.1.9** (patched scaffold release line), rather than the proposed 19.3.0. React types stay on the 19.1 release line. Node types match Node 24.
- TypeScript **5.9.3**, ESLint **9.39.5**, Tailwind **4.3.3**. Newer TypeScript/ESLint majors were not adopted for this Next.js 15 setup. ESLint 9 emits a deprecation notice; it is an intentional compatibility choice for now.
- pnpm 12 build permissions live in `pnpm-workspace.yaml`, not `package.json`. Only esbuild and unrs-resolver install scripts are explicitly allowed.
- The mandatory `server-only` marker package is installed. Node maintenance scripts use `--conditions=react-server --import tsx`; `.env.local` is loaded with Node's `--env-file-if-exists` option. All scripts are PowerShell/cmd compatible.
- The package uses native ESM (`type: module`) so tsx scripts load the PDF library's ESM exports correctly; the CLI production-guard tests caught the CommonJS import failure before this was corrected.
- shadcn's configuration and CSS-variable theme are present. Actual UI components and their supporting dependencies are deferred to Phase 1; they are not needed by the foundation placeholder.

### Database and seed safety
- Two migrations exist: the generated schema, then RLS on all **11 application tables**, the partial unique primary-brand index, and the publication/slug trigger. Both have now been applied to the pinned Mumbai dev project; never edit these applied migrations.
- The publication timestamp cannot be cleared or changed after publication, preventing a two-step bypass of slug immutability.
- `DEV_SUPABASE_PROJECT_REF` is an independent pin for demo/reset/keep-alive operations. The guard verifies the Supabase API host and both `DATABASE_URL` and `DIRECT_URL`; transaction/session pooler tenants are checked through the project-specific username. Missing or mismatched targets fail closed.
- Seeds insert missing rows by slug rather than overwrite owner edits on repeat runs. Demo identifiers/references are deterministic; repeat runs preserve existing applications and do not multiply files. `db:reset:dev` deliberately discards application tables/data only after the dev guard passes; it does not drop the public schema.
- Blank TBD brand descriptions are stored as empty strings rather than displaying the word "TBD". Sector/accent placeholders retain SEED_DATA.md values.
- `admin_users.role` remains in the prescribed schema but is not used for permissions. There are no demo Auth accounts or demo allowlist entries.
- Storage setup fails rather than silently changing an existing bucket's public/private visibility. Storage calls, including demo file creation and reset cleanup, live behind `src/lib/storage/`.

### Website fonts and assets
- Hind Siliguri **Regular and Bold static TTFs** are self-hosted for Bengali, with Inter variable TTF for website Latin text only. Both OFL licence files are included in `assets/fonts/`.
- Font source is the official `google/fonts` repository: `ofl/hindsiliguri/` and `ofl/inter/`. A rate-limited raw download was not retried in a loop; remaining repository assets were obtained through the jsDelivr mirror of that repository.
- All eight source SVG logos are copied into `public/brands/`, verified by listing that directory. Logos are rendered only through `<img>` on light panels.
- Public dark mode is deferred. The foundation is light-only with mobile-safe body text and Bengali font fallback.

### Owner-requested verification changes (latest instructions)
- **Skip the Bengali PDF spike for now. Bengali PDF support is UNTESTED and must be checked before Phase 4 starts.** There is no `/dev/pdf-test` route in this phase.
- Before Phase 4, test conjuncts/vowel signs and mixed text with a **static, non-variable TTF** (Hind Siliguri is available). Verify the required strings from ARCHITECTURE.md visually, including `ক্ষ`, `ঞ্জ`, `দ্ব`, `স্ত্র`, `ন্ধ`, and `শ্রী`. Do not assume successful font embedding proves shaping correctness. If shaping fails, agree on and document the Chromium fallback before building the real profile PDF.
- `@react-pdf/renderer` remains installed for generating tiny Latin-only demo CV placeholders. Those placeholders do **not** verify Bengali PDF support.
- PDF generation needs ordinary React rather than the `react-server` export used by secret-reading maintenance scripts. Demo seeding generates its Latin placeholder once through a credentials-free child CLI worker, then uploads the in-memory bytes. This worker is tested separately; no demo PDF binary is committed.
- Write the Playwright smoke test, but **do not install browsers or execute e2e until Phase 2**.
- Run typecheck once per logical group; run lint/unit tests at the final checkpoint. No full production build is run in this step.

### Environments and CI
- At the initial foundation checkpoint, `.env.local` was absent and live verification was blocked. The owner has since supplied local development configuration; live verification results are recorded separately below.
- CI runs typecheck/lint/unit tests without cloud credentials. Live RLS checks are explicitly opt-in (`RUN_SUPABASE_TESTS=1`); skipping them is not proof that RLS works.
- A guarded, optional daily GitHub workflow checks only the pinned dev database. Enable it with `DEV_KEEPALIVE_ENABLED=true` and dev-only repository secrets after the repo is connected. Scheduling is best-effort and is not a guarantee against Supabase pausing. It runs from the default branch and does not replace Phase 5's authenticated production cleanup cron.

## 2026-10-05 — Development region and production region selection
- Owner approved keeping the existing DEV Supabase project in **Mumbai (`ap-south-1`)**. Do not recreate it solely to match the original Singapore assumption.
- **Production region: Singapore or Mumbai, to be decided by measuring latency before the production project is created; the Vercel function region must match the Supabase region.** For Vercel, use `sin1` with Singapore or `bom1` with Mumbai. Previews using the Mumbai dev database must use Mumbai functions.
- Production region selection is still open; Singapore is not assumed as the production default. This decision overrides earlier Singapore-only setup checklists in the phase prompts.
- Local environment validation and the independent dev-project guard have passed. These configuration checks alone do not prove database connectivity, Storage access, or RLS enforcement.

### Live development verification
- `pnpm db:migrate`: passed against the dev session pooler. Both migrations applied successfully.
- `pnpm storage:ensure`: passed. The `applications` bucket is private and `brand-assets` is public.
- `pnpm seed:demo`: passed, including generating and uploading Latin-only placeholder CVs to private Storage.
- `pnpm db:counts`: **6 departments, 8 brands, 19 jobs, 118 questions, 30 applications**.
- Live RLS tests with the browser publishable key: **11 passed, none skipped**. Every application table exposed zero rows or a recognized permission denial.
- RLS checks use count-only HEAD responses so a failed assertion cannot print applicant records. Environment keys, connection credentials, and applicant content were not printed during verification.
- Website rendering, Playwright e2e, and a full production build were not verified in this step. Browser installation/execution remains deferred until Phase 2; Bengali PDF support remains untested and must be checked before Phase 4.

## 2026-10-05 — Phase 1 question extensions and standard set (docs-only)
- The intended question model has **eleven types**, adding `date` to the original ten. The applied Phase 0 schema still has ten; implement the Drizzle change and a **NEW enum migration in Phase 1**, never edit the applied migrations.
- Single-choice config gains `display: "radio" | "dropdown"`. Single/multiple-choice config gains `allowOther: bool`. "Other" answers are plain text in `application_answers.value` (single-choice string or free-text string in the multiple-choice array), not HTML or a separate object.
- Date config gains inclusive `min`/`max` bounds using absolute ISO calendar dates or `"today"`; date answers are date-only ISO strings. Resolve "today" at validation time and test it with a controlled clock.
- Define the seven standard questions in `src/lib/questions/defaults.ts` as a code constant, **not a database table**: LinkedIn profile (optional URL, professional); Portfolio or website (optional URL, portfolio); Years of relevant experience (required integer 0–50, experience); Current or most recent job title and company (optional short text, experience); Earliest date you can join (optional date, min today, professional); Expected monthly salary (BDT) (optional number, professional); Why do you want to work with us? (required long text, max 1500 characters, professional).
- The **"Add standard questions"** button copies that set into a job as ordinary editable questions with independent IDs. Updates to the constant do not change existing jobs. Existing question archival rules still apply.
- Phase 1 demo jobs include the standard set plus role-specific questions and exercise all eleven types, choice presentation, and "Other" answers. Preserve existing applications/snapshots and owner edits when updating demo seeding.
- Do not ask for age, religion, marital status, or photos.
- Update the Phase 1 prompt to include the new migration, defaults file/button, builder/validation config, and meaningful date/"Other" tests. This decision changes documentation only; application code, applied migrations, and current dev seed data are not updated in this step.

## 2026-10-05 — Phase 1 execution and question config validation
- The owner's Phase 1 execution instructions authorize autonomous implementation on the existing `phase-1-admin` branch, incremental commits/pushes, Chromium installation, and Phase 1 e2e execution. These supersede the earlier approval wait and Phase 0 browser deferral.
- Question definitions use a shared strict Zod validator, including type-specific JSON config, unique choice values, calendar-date bounds and upload limits. Existing JSON columns need no SQL change; only the enum requires a new migration. Unknown or cross-type config fails validation rather than silently changing meaning.
- Date-only validation uses Gregorian ISO dates (years 0001–9999). Relative `today` bounds will resolve at answer-validation time using the UTC calendar date, making results consistent across browser/server time zones. The UI should state this convention.
