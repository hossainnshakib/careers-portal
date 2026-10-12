# Mock-up UI rebuild verification

## Admin fidelity — 2026-10-12 (in progress)

- Branch `admin-fidelity` starts at latest merged main `41e3768` under the owner's
  newer explicit branch instruction. No merge/force-push or main content update.
- Pre-code contract: `ADMIN_ACCEPTANCE.md`; 14 static boards committed (118,285
  bytes), all CSS read and all 28 width references rendered/viewed. Local-only
  images are in ignored `design/mockup-reference-admin/` and
  `design/mockup-compare-admin/`. Runtime design scripts are not executed.
- Shell: corrected typography/nav/control geometry, dense/shared glass layers,
  mobile ambient treatment and accessible slide-over. Acceptance records two
  allowed deviations (green contrast; usable mobile links/sign-out/close).
- Shell typecheck/lint passed; two touched unit files / 7 tests passed. Local dev
  capture passed including menu keyboard/close/resize checks. Permanent e2e
  updated but full production execution is reserved until the final checkpoint.
- Initial capture caught streamed loading markup; explicit Dashboard-heading
  wait corrected it. Initial lint/ref warning and a .tsx test-discovery mismatch
  were fixed without suppressions; the final targeted run actually ran 7 cases.
- Full default/live/build/PDF-trace/production e2e and final route captures have
  not run for this pass. Real phones/hosted Vercel are unverified. Unrelated
  `src/db/queries/test-accounts.ts` remains untouched and unstaged.

The sections below are historical evidence, not fidelity-pass completion claims.

## Admin presentation replacement — 2026-10-11

Branch remains `public-ui-finish`; main is untouched. Scope and deliberate
differences: `ADMIN_UI_RESTYLE.md`. Authorization, migrations, public markup and
global/public CSS are unchanged. The existing unrelated modification to
`src/db/queries/test-accounts.ts` is excluded from this change.

### Screen coverage

- Dashboard, Applications, Applicant, Jobs, new/edit Job editor, Brands,
  Departments and Options use the supplied glass/ink/blue admin system.
- Login, MFA enrollment/verification, mobile navigation, application deletion,
  empty results and loading/error markup use the same scoped system.
- Full-page screenshots were captured at 1440×900 and 390×844 for every route,
  both MFA states, deletion and empty job/application results; mobile navigation
  was captured at 390. References/comparisons are local-only at
  `C:\Users\Hossa\AppData\Local\Temp\opencode\admin-restyle\`.
- Desktop references: Main, Applications, Applicant, Jobs, JobEditor, Brands,
  Settings, Login, Dialogs and States. Dedicated mobile references:
  MobileDashboard, MobileApplications, MobileApplicant and MobileMenu.
  Actual data/retained configuration fields change content height and density;
  these are visual comparisons, not identical-data pixel-diff assertions.
- Comparison fixes include a glass Applications wrapper, reduced mobile toolbar,
  mobile review rail before profile sections, question-card cascade, selected
  checkbox chips, mobile form width, rail spacing and native dialog centering.

### Checks

- `pnpm typecheck` and `pnpm lint`: passed.
- Default Vitest: **572 passed / 85 opt-in skipped** (81 files).
- Live DEV Supabase Vitest: **657 passed / 0 skipped** (81 files), including
  RLS, authentication gates, seed guards and persistence tests.
- Production build and PDF trace guard: passed (both Bengali fonts, eight
  logos and required renderer assets).
- First complete production Playwright run: **43 passed / 1 skipped** (8.0m),
  including a temporary screenshot spec and the new mobile focus/timezone case.
  Lighthouse was not enabled; all original flow assertions remain unchanged.
- Second complete production Playwright run: **43 passed / 1 skipped** (7.3m).
  Final mobile search/card refinements and placeholder contrast were built after
  this run and are checked by the final focused admin suite/capture rerun.
- Focused production admin suite: **13 passed / 0 skipped** (4.3m), including
  fresh route/state captures, auth/MFA, catalog CRUD, job lifecycle, all question
  types, application review/download/deletion and session invalidation.
- Final mobile Jobs row-order correction: rebuilt successfully, then **3/3**
  production cases passed (1.3m): all-route captures, the mobile focus/TOTP/
  timezone/dropzone/row-order assertions, and the unchanged Jobs list case.
  Final 1440/390 captures were inspected, including the corrected first mobile
  job card. The temporary capture spec was removed; its images remain outside
  git. The permanent suite now has 43 cases (42 runnable + opt-in Lighthouse).
- A subsequent live Vitest run overlapped the browser suite and reported one
  failure in `upgrade.live.test.ts`: its global question-row snapshots differed
  while Playwright's question-builder fixture was adding/removing rows. The
  preceding isolated live run passed. Live/browser suites must be run serially
  for this global snapshot assertion; the assertion has not been weakened.
  The final isolated rerun passed **657/657** (63.4s).

### Limits and owner review

- No production credentials/resources, hosted Vercel preview or physical
  phones/GPU combinations were used. Screenshot checks use Chromium only.
- Loading/error states were restyled and code-reviewed, not forced into live
  screenshot captures. Actual empty, deletion and MFA states were captured.
- Small-text status tokens measure 5.50–5.92:1 on their composited base fills;
  muted text measures 5.68:1 on glass. Tests guard the 4.5:1 floor, and fallback
  brand initials use the tested readable black/white helper. These token checks
  are not a complete manual WCAG audit of every ambient-orb/interaction state.
- Review the retained full-form differences in `ADMIN_UI_RESTYLE.md`. Publish
  and Add question are immediate actions, not new confirmation dialogs.
- No schema, dependency or public-design change. No open security/data/scope
  decision is required.
- Removed unused `src/components/brand-dot.tsx` and
  `src/components/brand-logo.tsx`. The only intentionally absent board detail is
  the list's sample "Applied before" badge; real previous-application history
  remains on the profile. No existing admin flow is intentionally unfinished.

Branch: `public-ui-from-mockup`. Local production-mode app connected only to the independently pinned DEV Supabase project. Main, production resources and applied migrations were not changed.

## Finishing pass (branch `public-ui-finish`) — final result

Items 4–8 of `prompts/09-public-ui-finish.md` are complete on `public-ui-finish`, branched from `public-ui-from-mockup`. This section is the current report; the sections below it are the historical first-pass record and are kept unchanged.

- **Item 4 — SEO/sharing/branding:** JSON-LD `JobPosting` (pure builder + 10 unit tests), per-job and Home OG images (brand-initials fallback: satori cannot rasterise SVG logos), SVG icon + apple-touch PNG + web manifest, Twitter `summary_large_image` cards, robots/sitemap re-audit (apply/success/admin excluded, Apply/Success `noindex`).
- **Item 5 — accessibility/motion:** `prefers-reduced-motion` handling, a real marquee Pause/Play control (WCAG 2.2.2), documented focus-ring tokens; contrast corrections already documented below were re-measured and hold.
- **Item 6 — long/Bengali stress:** new `tests/e2e/public-content-stress.spec.ts` using temporary dev-only fixture jobs (cleaned up after the run). Found and fixed one real defect: a 99-char unbroken URL in job Markdown overflowed 107px at 390px → `.ui-job-markdown { overflow-wrap: anywhere }`. Glyph check via CDP: every rendered font is a self-hosted face (`isCustomFont: true`) and Hind Siliguri renders with glyphs > 0 — no missing glyphs.
- **Item 7 — acceptance re-audit:** all 60 rows re-verified; **57 Implemented / 3 Deviation / 0 Not implemented** (was 49/10/1). F01 closed by the owner fix pass (migration `0006_fix_salary_mode_text.sql`); seven rows reclassified to Implemented with evidence. The three remaining deviations (S05, H10, J01) are deliberate and documented in `UI_ACCEPTANCE.md`.
- **Item 8 — cleanup:** removed dead `brand-accent.tsx` and unused `hasGroup`/`fresherWelcome`/`filterGroup` exports; logo-only brand-mark audit passed with no changes; `DESIGN.md`, `UI_ACCEPTANCE.md`, `DECISIONS.md` updated.

Final validation (run once, after all changes):

| Check | Result |
| --- | --- |
| `pnpm typecheck` / `pnpm lint` | Passed. |
| Unit tests (default) | 563 passed / 85 skipped (80 files). |
| Live tests `RUN_SUPABASE_TESTS=1` | 648 passed / 648 (80 files, 68.7s). |
| `pnpm build` | Passed, incl. PDF trace guard: Helvetica/chunks/ICC, both Bengali fonts, 8 logos. |
| Production e2e `PLAYWRIGHT_PRODUCTION=1 RUN_LIGHTHOUSE=1` | **42 passed / 0 failed / 0 skipped** (7.2m), including the new stress spec (18.8s) and sticky/header/mobile suites. |

Lighthouse mobile (same run, targets unchanged: performance ≥85, accessibility/best-practices ≥95 — all met):

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| Home | 97 | 100 | 100 | 92* | 2,521ms | 0.00344 |
| Job | 94 | 100 | 100 | 100 | 2,403ms | 0.01684 |
| Apply | 93 | 100 | 100 | 58 | 2,734ms | 0.02470 |
| Success | 97 | 100 | 100 | 54 | 2,069ms | 0.00202 |

\* Home's 92 is a single failing audit, `meta-description`, from a **Lighthouse flake**: the full run reported "Document does not have a meta description", but SSR HTML was curl-verified to contain exactly one correct `<meta name="description">`, `document-title` (axe) passed in the same run, the failure carried no explanation (artifact-level miss by the `MetaElements` gatherer), and direct reruns against the same build alternated pass/fail (1 pass, 1 fail). `tests/e2e/public-pages.spec.ts` asserts rendered meta descriptions in production mode. SEO is not an asserted target; no code change was made to chase the flake. Apply/Success SEO 58/54 remain the intentional `noindex` findings documented below.

**Not verified (finishing pass):** real physical phones/GPUs, a hosted Vercel preview, production keys/resources. Contact/deletion email, brand descriptions/websites and privacy/retention approval remain owner actions. Owner: review `docs/DESIGN.md` additions and the three remaining deviations.

## Final result

All 23 browser cases have passing evidence: eight passed in the initial full run, and all 15 initially failing cases passed in affected-only reruns after fixes. No assertions were weakened, no test was deleted and Lighthouse ran with its opt-in enabled. Initial failures are retained below rather than presented as a clean first pass.

Acceptance: **49 Implemented / 10 Deviation / 1 Not implemented** across 60 checks in `UI_ACCEPTANCE.md`. *(Superseded by the finishing-pass re-audit below: **57 / 3 / 0**.)*

The sole nonimplemented fix was **F01, the reported salary-radio discrepancy**. Three actual editor SSR cases cover negotiable/range state, and hydrated browser negotiable-mode checks pass; the reported mismatch was not reproduced. No speculative state reset or database rewrite was made. *(Closed in the owner fix pass by migration `0006_fix_salary_mode_text.sql`; see below.)*

## Checks executed

| Check | Result |
| --- | --- |
| Typecheck / lint | Passed initially and after the runtime/font/markup fixes. |
| Default tests | 544 passed in the broad run; one existing PDF-worker test exceeded its unchanged 5-second timeout under concurrent check load, then passed alone without changes. All 545 original default cases therefore have passing evidence. |
| New driver-adapter tests | 5 passed; affected Job tests also passed (14 combined cases). This adds five new default cases to the 545-case baseline. |
| Dev-gated live tests | All 85 passed: 83 main cases with maxWorkers=1, isolated account recovery and seed preservation. Rechecked all 85 after the shared driver fix. |
| Production build / PDF trace | Passed initially and rebuilt after runtime/font changes; guard confirms Helvetica/chunks/ICC, both Bengali fonts and 8 logos. |
| Production browser suite | Initial run 8 passed / 15 failed / 23 total / zero skips. Affected reruns: 6 public/apply/sticky passed; 8 admin passed; Lighthouse and the two modified Job sticky cases passed after font/markup fixes. |
| Production dependency audit | No known vulnerabilities. No dependency change after this audit. |
| Secret scan | 407 tracked/nonignored working files checked: zero exact configured-private-value matches and zero credential-signature file matches. Documented Turnstile development test keys, an explicit synthetic negative-test marker and public anon JWTs are classified exceptions. Temporary scanners were subsequently removed. |
| Real local production HTTP smoke | All 16 checks passed against the production-mode local server. Includes no Job form/Turnstile, Apply 200/noindex/form, sitemap Job inclusion/Apply exclusion, strict headers/CSP, anonymous admin/API/cron denials and response-leak detection. |

The broad full pass ran once. Rebuilds and reruns followed concrete failures or runtime changes; the whole suite was not repeatedly rerun without a reason.

## Sticky proof

`tests/e2e/public-sticky.spec.ts` verifies all ancestors have no vertical overflow clipping, panels fit viewport height, main content moves while panel tops remain fixed, container release/footer separation, mobile static behavior and exact-900px desktop behavior.

| Panel / viewport | Top at two scroll positions | Content movement | Panel height | Top after container release | Additional scroll room |
| --- | --- | --- | --- | --- | --- |
| Home 1440x900 | 24px / 24px | 350px | 748px | -149.53px | No |
| Home 1280x720 | 24px / 24px | 350px | 672px (viewport cap) | -149.53px | No |
| Job 1440x900 | 24px / 24px | 350px | 561px | -157.61px | Yes, after footer |
| Job 1280x720 | 24px / 24px | 350px | 561px | -157.61px | Yes, after footer |

The normal 1440x900 Home panel has no internal overflow; shorter/dense panels scroll internally. Job test documents conditionally append temporary room **after** a short footer when natural scrolling cannot expose full release, then remove it. Panel/container geometry is not altered. This setup is explicitly annotated, not concealed.

## Lighthouse mobile simulation

Latest production results, with unchanged Home/Job targets of performance >=85 and accessibility/best practices >=95:

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| Home | 95 | 100 | 100 | 100 | 2,789ms | 0.00344 |
| Job | 95 | 100 | 100 | 100 | 2,517ms | 0.01876 |
| Apply | 93 | 100 | 100 | 58 | 2,828ms | 0.02566 |
| Success | 97 | 100 | 100 | 54 | 2,435ms | 0.00202 |

Apply/Success are intentionally noindex; their crawlability/metadata SEO audit findings are not relaxed by indexing private acknowledgement/form routes. The remaining binary audit on Home/Job is bf-cache; it does not reduce these category targets. Back/forward-cache behavior and real mobile GPU performance are not claimed verified by Lighthouse.

Initial Home performance was 76; after data recovery it was 73 and Job 69. Network evidence identified a wasted **469,777-byte Inter TTF preload** on public pages, with zero blocking JS time. Disabling that preload and giving the root skip link a system font removed the unused request; admin still uses the same Inter face on demand. CSS-drawn checklist ticks also avoid loading a Bengali fallback font just for a symbol. The approved glass design was retained.

Measured nav/salary contrast failures were fixed with slightly darker existing-family ink/green. Invalid nested dl markup was corrected to direct dt/dd row children. Final accessibility is 100 on all four audited pages.

## Visual review and real-data differences

- Guarded dev and final production full-page Home/Web Developer/Apply captures at 1440x900 and 390x844 are in ignored `design/mockup-compare/`, alongside ignored references. Viewed all three desktop/mobile layouts; all six captures have no horizontal overflow. Shared chrome appears once; Home/Job have no form, Apply has one.
- Production captures replace earlier dev captures and have no Next dev indicator. Reduced motion makes the logo marquee static for repeatability.
- A controlled synthetic Bengali full-name field was captured and viewed separately, including conjuncts; no application was submitted by that visual check. Apply/review browser flows also verify Bengali preservation and private attachments/PDF downloads.
- Actual data has 16 open roles and seven hiring brands, first-catalog Web Developer as the featured card, all real department results rather than the mock's abbreviated rows, real demo descriptions/options/salaries and configured eleven question types/sections.
- Unset vacancy/deadline/skills/benefits/nice-to-have and brand/contact placeholders are omitted rather than fabricated. Conditional populated sections/range/option labels have focused unit coverage. Configured Portfolio/extra contact questions retain their stored grouping instead of copying sample form questions.
- Intentional presentation deviations: compact collapsible desktop filters for viewport fit, bounded dark hero tint for arbitrary accent contrast, slightly darker small text, real upload-limit/restart guidance and usable mobile adaptation instead of the mock's squeezed desktop layout. Detailed per-item statuses are in UI_ACCEPTANCE.md.
- Five generated local public catalog cache entries referencing already-cleaned test fixtures were cleared before final production captures. No database reset or record normalisation occurred.

## Runtime failure found and fixed

The initial production run showed a malformed cached catalog (zero jobs and 22 UUID-like department labels), authentication/MFA stalls and downstream UI failures. Fresh guarded database probes showed the six correct departments. A 240-query mixed standalone stress run with the old unreserved driver hung beyond 120 seconds; documented connection reservation completed the same work with zero shape mismatches.

`src/db/reserved-client.ts` now reserves one pool connection per standalone Drizzle statement, preserves object/array mode and once-only execution, and releases on success/failure. Native transactions, `prepare: false`, the five-connection pool and authorization rules are unchanged. No internal pipeline option, new dependency or migration was introduced. The actual adapter passed the stress run, all 85 live cases and all affected browser workflows.

This is a necessary runtime reliability deviation discovered during verification, not a change to the accepted data model/admin workflow.

## Reproducibility and artifacts

- Production tests: set `PLAYWRIGHT_PRODUCTION=1` and `RUN_LIGHTHOUSE=1`, then use pnpm test:e2e. Quote `"--reporter=list,json"` in PowerShell; an unquoted comma was parsed as `list json` and failed before any tests started.
- Reports in `C:\Users\Hossa\AppData\Local\Temp\opencode\`: initial `ui-e2e.json`, runtime `ui-e2e-runtime-fix.json`, admin `ui-e2e-admin-fix.json`, final audit/Job geometry `ui-e2e-font-fix.json`, and `lighthouse-{home,job,apply,success}.json`.
- Browser/error reports and screenshots are ignored/outside git. Temporary diagnostic, screenshot and scanner scripts were removed. No secrets, real applicant records or raw cache/provider payloads are included in this report.

## Not verified / owner actions

- Real Vercel/Linux deployment, real phones, production resources/keys, backups/restores and a real 30-day session rollover were not exercised here. Existing persistence tests use controlled dev fixtures and simulated expiry.
- Public generic error styling is implemented; an actual provider outage was not deliberately induced for a screenshot. No new visual PDF shaping spike was needed for unchanged PDF fonts; current browser review/download and trace checks passed.
- The salary discrepancy remains unreproduced, with no speculative fix. Provide the exact role/browser/steps if it persists.
- Configure the real contact/deletion email, confirm brand descriptions/websites and approve the privacy/retention draft before release.

## Vercel preview check

Deploy this branch as a preview using the DEV project and normal documented environment settings. Browse/filter/share a URL on desktop and phone; inspect a Job and its separate Apply route; scroll both sticky panels; apply using synthetic test details/files and consent; verify the reference and admin review/download flow. Confirm Bengali text, logos and the PDF on the hosted platform. Run `pnpm smoke -- <preview-origin>` for anonymous HTTP checks. Production setup/migrations remain owner-only; this branch is not merged.
