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
- Two migrations exist: the generated schema, then RLS on all **11 application tables**, the partial unique primary-brand index, and the publication/slug trigger. None has been applied yet.
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
- `.env.local` is absent. Dev migrations, storage provisioning, seeds, live RLS checks, and database-backed page verification are blocked until the owner supplies local development configuration. Do not claim these checks passed.
- CI runs typecheck/lint/unit tests without cloud credentials. Live RLS checks are explicitly opt-in (`RUN_SUPABASE_TESTS=1`); skipping them is not proof that RLS works.
- A guarded, optional daily GitHub workflow checks only the pinned dev database. Enable it with `DEV_KEEPALIVE_ENABLED=true` and dev-only repository secrets after the repo is connected. Scheduling is best-effort and is not a guarantee against Supabase pausing. It runs from the default branch and does not replace Phase 5's authenticated production cleanup cron.
