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

### Auth foundation
- `/admin/login` is the public authentication entry point, as required by the documented email/password flow. Its login action verifies the password and then calls `requireAdmin()` before returning success; a non-allowlisted session is signed out. Every protected page/action/handler must call `requireAdmin()` directly. Login page itself cannot require an existing admin session.
- `requireAdmin()` throws a generic `AdminAccessError` for missing/invalid identity or missing allowlist entry. Protected pages will redirect on this error, actions return typed denials, and API handlers return 401/403. Infrastructure failures fail closed and never expose raw errors to clients.
- Middleware refreshes auth cookies and uses `getUser()` for convenience redirects only. Admin/auth responses use private/no-store headers; all admin pages are dynamic. The installed SSR package's cookie callback supports cache headers, which middleware propagates.
- Login has generic errors, a disabled pending button and a short client retry delay. Supabase Auth's server-side throttling remains the enforcement layer; no unreliable process-local rate limiter or extra dependency is introduced.
- `admin:add` is dev-pinned in this phase and only allowlists an existing Auth account. It paginates Auth users and performs an idempotent database upsert; it never prints email addresses or creates users. Production account setup will require a separately approved owner-run procedure later.

### Answer validation contract
- `buildSchema` accepts validated question definitions and rejects unknown answer keys. Text is trimmed; optional blank/null/empty-array values become absent while `false` and `0` remain valid answers. Number and boolean inputs are not silently coerced.
- Other answers use the prescribed plain-string/string-array representation, with a 500-character limit and at most one Other value per multiple-choice answer. Existing options remain ordinary values; choice UI must avoid a reserved-value sentinel collision when collecting Other text.
- File answers validate opaque UUID token arrays (up to eight, unique), not browser-supplied storage paths or metadata. Actual object ownership, MIME, extension and size checks remain mandatory in Phase 2 upload/submit handling after DB definitions are reloaded; this validator alone is not upload authorization.
- Bangladesh phones accept local 013–019 prefixes or +880 equivalents; general international numbers require a leading + and 8–15 digits. Spaces, parentheses and hyphens are normalized.

### Admin shell and test runtime
- The protected layout, dashboard and applications placeholder each call `requireAdmin()` independently. Expected denials redirect to the public login; infrastructure errors reach a generic error boundary. The applications placeholder contains no applicant data.
- Use native accessible HTML and existing Tailwind styles for the Phase 1 shell. shadcn supporting packages are absent from the Phase 0 installation; no unapproved dependencies were added. The navigation adapts to a wrapped row on mobile and a sidebar on desktop.
- Vite 8's Oxc JSX transform is explicitly set to the automatic runtime in Vitest config. Next.js requires `jsx: preserve`, so the test-runner override is needed to import and exercise actual TSX page modules without altering application compiler settings or adding a plugin.
- Chromium (including its headless runtime and Playwright support binaries) has been installed once under the owner's Phase 1 authorization. `admin-shell.spec.ts` passed for real anonymous redirects and accessible login fields. Signed-in UI flows and exhaustive future admin surfaces remain to be tested as content management is added.

## Phase 1 handoff — 2026-10-05 (foundation boundary)

### Session instructions
- Continue autonomously on **`phase-1-admin`**, never main/merge/force-push. Read this section and `git log --oneline -10` first, then the ordered docs and `prompts/02-phase1-admin.md`; inspect real state and rebuild the remaining todo list before code edits.
- Owner explicitly authorized proceeding without plan approval, incremental commits and regular pushes. Ask only for true blockers or STOP-list decisions. No subagents were requested; do not delegate.
- No dependencies added so far. A markdown renderer plus sanitizer is explicitly authorized by the owner's exception (justify it in one line); other dependency additions require approval. react-hook-form, nuqs and shadcn supporting packages are **not installed**, despite the planned stack. Native HTML/Tailwind is used so far. Do not assume they are available or add them silently.
- Every protected page/action/handler must call `requireAdmin()` itself. Public login is the documented necessary exception; login action calls it after password verification. Maintain typed action results, direct gating tests and generic client errors.

### Done, committed and pushed
1. `9e2b858`: new `0002_yielding_night_thrasher.sql` enum extension, updated Drizzle enum/snapshot/journal, shared strict question-definition/config validator and three tests. **Migration applied successfully to the pinned dev project** after `requireDevTarget()` verification. Never edit migrations 0000, 0001 or 0002 now.
2. `8f3f30b`: request-scoped SSR client, server-only service-role Auth management client, `requireAdmin()` (`getUser()` plus Drizzle allowlist lookup), cookie-refresh middleware, dev-guarded paginated/idempotent `pnpm admin:add <email>`, login/logout and UI. Fourteen unit tests; four real guarded live auth checks passed and ephemeral users were deleted.
3. `a22b492`: `buildSchema` for eleven question types, 36 tests covering required/optional, bounds, membership, Other, phones, leap/calendar dates and parse-time UTC today. Unknown keys rejected; file values are opaque UUID token arrays and need actual Storage checks in Phase 2.
4. `f413051`: responsive protected shell, signed-in email/logout, dashboard/application placeholders, loading/error states; nine direct page/layout denial/outage tests; Chromium anonymous redirect/login accessibility e2e passed. Vitest Oxc automatic JSX runtime allows testing actual TSX modules. DEV_SETUP updated for admin:add/live checks/Phase 1 browser permission.

### Remaining todo list (ordered)
1. Departments list/create/edit/activate/deactivate/up-down reorder; server Zod validation, queries, typed actions, direct denial and mutation tests. Add the appropriate cache revalidation from the start rather than postpone protection of public data.
2. Brands list/create/edit/hide/show/reorder and logo upload behind `src/lib/storage/`; PNG/WebP/SVG <=1 MB, server-selected path, MIME/extension/content validation including unsafe SVG tests. Logo rendering only `<img>`.
3. Jobs list with URL status/department/brand/search filters; transactional save and lifecycle actions (publish/close/reopen/duplicate/delete draft without applications). DB reload to enforce question ownership/archive rules and immutable published slug; exactly one primary brand.
4. Single-page basics/content editor, summary counter and safe live markdown preview. Check installed Next.js cache API/types before using `revalidateTag`.
5. Eleven-type question builder (config, options, section, reorder/archive, copy from job) and shared candidate-form preview validated with `buildSchema`; exercise radio/dropdown/Other/date UI.
6. Seven standard question constants and independent editable copies/button/tests. Non-destructive demo seed extension: current seeding preserves existing jobs and returns early; do not reset dev or overwrite owner edits/application snapshots to update them. Fresh demo jobs need standard+role-specific questions/all eleven types. Existing dev data still has the original 118 questions; design a conservative, tested update of unchanged deterministic demo definitions or document what was intentionally preserved.
7. Revalidation completeness and tests (`jobs`, `job:<slug>`, `brands`, `departments`) for every public-affecting mutation.
8. ASCII slug helper/collision tests plus all 19 intended seed slugs; may introduce a minimal helper earlier if CRUD needs it, then verify this deliverable here.
9. Exhaustive surface registry/discovery tests: every protected admin page/action/route independently rejects anonymous and authenticated non-admin. Expand `admin-pages.test.ts` and add action tests as new surfaces appear. Live HTTP gating tests must cover the completed surfaces; current live test proves requireAdmin only.
10. Full Chromium job-create/publish e2e using ephemeral dev-guarded Auth admin setup+teardown, never owner credentials. Add standard questions/every type and test choice/date/Other preview controls, publish and verify list. Current `admin-shell.spec.ts` covers anonymous routes only.
11. Finish architecture/setup/schema/decisions docs and actual creating-a-job walkthrough; update stale docs in same commit as decisions.
12. Final `pnpm typecheck`, `pnpm lint`, `pnpm test`, opt-in live gating, relevant e2e. Final report per owner's detailed requirements, including `pnpm admin:add <email>` and security-review files.

### Verification at this checkpoint
- `pnpm typecheck`: passed after shell/test runtime changes.
- `pnpm lint`: passed (entire repository).
- `pnpm test`: **8 files passed, 73 tests passed; 2 live files / 15 tests skipped** by default (11 RLS and four live auth). Skips are not proof of live coverage.
- Live auth: `$env:RUN_SUPABASE_TESTS = '1'`, then `node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/auth/requireAdmin.live.test.ts`, then remove the env flag: **four passed**. Checks real anonymous/non-admin denial, allowlisted acceptance and immediate revocation; no owner credentials.
- `pnpm exec playwright test tests/e2e/admin-shell.spec.ts`: **one passed**, using Playwright-managed background dev server. Chromium installed once; do not reinstall unnecessarily. No long-lived foreground dev process was started.
- `pnpm db:migrate`: passed on pinned dev target. No production operation, reset or reseed was performed.
- Not verified: signed-in shell/browser logout, full job authoring (not implemented), exhaustive future surfaces, fresh live RLS in this session, production build, Bengali PDF shaping (still due before Phase 4). No unresolved test failures at checkpoint; initial TS null comparison and Vite TSX import errors were fixed at root cause, not suppressed.

### Known constraints / next command
- Owner Auth user exists but was **not** allowlisted by this session; owner can run `pnpm admin:add <email>` with their actual address. Tests only allowlisted ephemeral accounts and removed them.
- Jobs/Brands/Departments nav links currently point to forthcoming routes. Do not treat the current shell as finished content management.
- `requireAdmin()` throws `AdminAccessError`; pages use `.catch(redirectAdminDenial)`, actions must catch expected denials and return typed results. Infrastructure failures must not reveal secrets/PII.
- Continue from Departments. Next command: **`git log --oneline -10`**, then **`git status --short --branch`**, read the handoff and required docs, reconstruct todos, and implement `src/db/queries/departments.ts` plus gated departments page/actions/UI/tests.

## 2026-10-05 — Departments and guarded browser fixtures
- Departments support create/edit/activation and adjacent up/down ordering; no delete action is offered because jobs restrict deletion and the prompt only requires deactivation. Slugs are explicit lowercase ASCII inputs for now; the tested general slug helper remains a later deliverable.
- Department writes use a transaction-scoped advisory lock, and reorder locks rows and normalizes order to consecutive numbers. This handles tied sort orders and serializes concurrent admin reorders/creates without changing schema.
- Each department action calls `requireAdmin()` before Zod validation or DB access. Successful mutations invalidate `departments`, `jobs`, all affected `job:<slug>` tags, and the admin path. Verified installed Next.js 15.5.27 uses the single-argument `revalidateTag` signature.
- The browser-test fixture uses a server-only dev-pinned Node child worker. Ephemeral account credentials travel only over IPC; setup allowlists the account, teardown deletes only rows under its randomly generated test slug prefix and deletes the Auth user. Traces are disabled for credential-entry tests. The login form clears the password field immediately after capturing submit data so browser failure snapshots do not retain passwords.
- First signed-in browser navigation compiles the protected route and takes longer than Playwright's default five-second assertion window. Its URL assertion allows 30 seconds while still requiring successful login; subsequent CRUD assertions keep standard timeouts. A strict-mode status selector was scoped to main content because the sidebar also has a logout status region.
- Department e2e passed: ephemeral admin login, create, move up/down, rename/deactivate and logout. Unit tests cover page/action denial, validation, normalization, generic DB failure and all required revalidation tags.

## 2026-10-05 — Brands and logo upload validation
- Brands use the same explicit-slug/edit/reorder pattern as departments, with a separate transaction advisory lock. Sector, description, http(s) website, six-digit hex accent and active/hidden status are validated server-side. Clients cannot submit a logo URL; only a validated upload can set it.
- SVG uploads are rejected unless they belong to a conservative passive SVG subset. Shape/gradient/mask/clip elements and known presentation attributes are allowlisted; style blocks/attributes, entities/DTDs, external resources, scripts/events, foreignObject, image/use/animation elements and unknown markup are rejected. This fails closed without adding an XML dependency. PNG/WebP signatures are checked against declared MIME/extension. The original filename never becomes a storage path.
- Brand logos are at most 1 MB and use authenticated server-action uploads; the Next.js body limit is 2 MB to allow multipart overhead. This is only for small admin logos; the candidate direct-to-Storage flow and its larger file limits remain as planned. SVGs reuse the existing `<img>`-only BrandLogo component without new lint suppressions.
- Storage uses a server-selected `brands/<brandId>/<uuid>.<extension>` path. A DB write failure removes the newly uploaded object. Replaced old logos are retained as non-sensitive assets to avoid breaking cached URLs; automated old-logo cleanup is not added in Phase 1.
- Browser fixtures now also remove their test-only logo objects through `src/lib/storage/test-logos.ts` after catalog cleanup. No owner assets are selected for deletion. Brand mutation/page tests independently prove anonymous/non-admin denial, validation, DB-failure cleanup and `brands`/`jobs`/affected `job:<slug>` invalidation.
- Brand e2e exposed unstable accessible names in wrapping labels for controlled select/textarea fields; explicit aria-labels now keep Sector/Status/Description names stable. The test passed after fixing those UI labels rather than relaxing selectors: create with all fields, reorder, reject unsafe SVG, upload/display passive SVG as IMG, edit and hide.

## Phase 1 handoff — 2026-10-05 (catalog checkpoint, latest)

This section supersedes the earlier foundation handoff's progress/next-command information. Its execution constraints and answer/auth contracts still apply.

### Done
- Foundation: date enum migration (already applied; never edit 0000–0002), strict question configs, Supabase Auth/allowlist/login/logout/admin:add/middleware, eleven-type buildSchema and protected shell. See the previous handoff and commits `9e2b858`, `8f3f30b`, `a22b492`, `f413051`.
- `a77d780`: Departments complete: page, create/edit/activation/up-down reorder, strict server validation, transactional DB queries, direct page/action denial tests and cache invalidation. Ephemeral dev-pinned IPC browser fixture added. Chromium flow verifies login/create/reorder/rename/deactivate/logout.
- `7b6222d`: Brands complete: page, fields/create/edit/hide/show/reorder, logo upload, strict SVG passive allowlist and PNG/WebP signature validation, server-selected paths, failed-DB-upload cleanup, img-only rendering, tests and revalidation. Browser fixture deletes test logo objects as well as temporary account/catalog rows.
- No dependencies added. All work remains on `phase-1-admin` and pushed to origin. No owner Auth credentials used or owner allowlist row added; owner command remains `pnpm admin:add <email>`.

### Remaining todos (resume in order)
1. **Jobs queries/list/actions**: filters (status, department, brand, search), transactional save with one-or-more brands/exactly one primary, publish/close/reopen/duplicate/copy questions/delete eligible drafts, DB-loaded ownership/archive/application/immutable-slug enforcement. Direct denial, validation and lifecycle tests.
2. **Job editor basics/content**: one page, editable auto-slug before publish, all specified basics/deadline/CV toggle, summary counter, safe markdown live preview. The owner explicitly allows a markdown renderer plus sanitizer; justify in one line before installing, all other new dependencies still need approval. Do not assume react-hook-form/nuqs/shadcn packages are installed.
3. **Question builder/live form preview**: eleven types, config/options/section/help/required/up-down/archive, copy from another job, shared buildSchema preview with radio/dropdown/Other/date controls.
4. **Standards and seed**: seven defaults in code, independent copies/button/editability tests; extend fresh demo questions and carefully upgrade unchanged deterministic existing demo rows without overwriting owner edits or application snapshots. Existing seed still has early-return behavior; no reset/reseed has been run in this continuation.
5. **Revalidation completeness**: department and brand mutations already invalidate their own tags, jobs and affected job details; ensure every job mutation does too and test all affected tags.
6. **Slug helper/tests**: ASCII lowercase, punctuation removal, collision suffixes, 19 explicit final slugs. Can introduce the minimal helper with job actions if needed, then complete the deliverable/tests.
7. **Exhaustive admin gating**: current direct page tests cover layout/dashboard/applications/departments/brands; action tests cover login-after-auth/logout/departments/brands/logo upload. Extend discovery/registry to every future protected surface and live HTTP gating. The live requireAdmin test alone does not prove every HTTP route/action is gated.
8. **Required job-create/publish Chromium e2e**: reuse guarded ephemeral admin fixture, add standard questions and every type, exercise radio/dropdown/Other/date preview, publish and see list. Never use owner credentials; keep credential traces off.
9. **Docs/walkthrough/final gates/report**: complete schema/architecture/setup/decisions updates and creation walkthrough. Run typecheck/lint/unit suite/live gating/e2e before final report. Include exact owner commands and security-relevant diff paths.

### Latest verification
- `pnpm typecheck`: passed.
- `pnpm lint`: passed; no new lint/type ignores added.
- `pnpm test`: **11 test files passed / 122 tests passed**, two live files / 15 tests skipped by default.
- `$env:RUN_SUPABASE_TESTS = '1'; node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/auth/requireAdmin.live.test.ts src/db/rls.test.ts` (remove env flag afterward): **two files / all 15 passed**, none skipped. Four real Auth/allowlist checks plus anon count-only RLS checks on all 11 tables.
- `pnpm exec playwright test tests/e2e/departments.spec.ts tests/e2e/brands.spec.ts`: **two passed**, including real guarded account setup and cleanup, actual dev DB mutations and Storage SVG upload/rejection. Playwright managed its background dev server.
- Initial browser failures were fixed: first protected-route compile needed a 30-second login URL wait; duplicate status elements needed a main-scoped selector; controlled select/textarea wrapping labels needed stable accessible names. Tests were not removed or skipped.
- Not verified: job authoring/publishing and preview (not implemented), exhaustive future surface live gating, production build, Bengali PDF shaping (still required before Phase 4), production behavior. No unresolved failing checks at this checkpoint.

### Known details / next command
- `src/lib/validation/brand-logo.ts` intentionally accepts only passive SVG; uploads with style blocks/attributes/external images must be exported as passive paths or PNG/WebP. Seeded static logos are unaffected. Old replaced logo objects are retained; newly failed writes and all test assets are cleaned up.
- `next.config.ts` permits 2 MB server-action bodies solely to fit a <=1 MB logo plus multipart overhead. Candidate files still need the planned direct Storage flow in Phase 2.
- DB access belongs in `src/db/queries/*`, storage in `src/lib/storage/*`. Existing query/action patterns are simple; do not introduce a generic CRUD framework. Job multi-row writes need transactions and DB reloads, not client-trusted definitions.
- Next command: **`git log --oneline -10`**, then **`git status --short --branch`**. Read this newest handoff and the required docs, rebuild the remaining todo list, inspect schema/validation/auth/tests, then start jobs queries and gated actions/list. Continue autonomously with small commits and pushes.
