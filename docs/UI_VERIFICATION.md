# Mock-up UI rebuild verification

Branch: `public-ui-from-mockup`. Local production-mode app connected only to the independently pinned DEV Supabase project. Main, production resources and applied migrations were not changed.

## Final result

All 23 browser cases have passing evidence: eight passed in the initial full run, and all 15 initially failing cases passed in affected-only reruns after fixes. No assertions were weakened, no test was deleted and Lighthouse ran with its opt-in enabled. Initial failures are retained below rather than presented as a clean first pass.

Acceptance: **49 Implemented / 10 Deviation / 1 Not implemented** across 60 checks in `UI_ACCEPTANCE.md`.

The sole nonimplemented fix is **F01, the reported salary-radio discrepancy**. Three actual editor SSR cases cover negotiable/range state, and hydrated browser negotiable-mode checks pass; the reported mismatch was not reproduced. No speculative state reset or database rewrite was made. The owner should provide the specific role, browser and steps to reproduce it.

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
