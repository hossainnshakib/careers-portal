# Mock-up UI rebuild verification

Branch: `public-ui-from-mockup`. Local dev-backed verification only; production resources and main are untouched.

## Visual review

- Guarded local public preview confirmed APP_ENV=development and both database/API targets match the independently pinned dev project before starting.
- Full-page Home, Web Developer Job and Apply screenshots captured at 1440x900 and 390x844 into ignored `design/mockup-compare/` and viewed against mock references.
- All six renders: no horizontal overflow, one header/footer, zero forms on Home/Job and one form on Apply.
- Fixed reduced-motion marquee duplicate visibility and summary CTA width after actual rendering; recaptured after hydration.
- Expected real-data differences: 16 roles/7 hiring brands, first-catalog featured role, all real department results instead of the mock's abbreviated rows, demo content/options, absent optional vacancy/deadline/skills/benefits/nice-to-have where unset, configured eleven question types/sections, and omitted unset contact/brand placeholders.
- Reduced-motion captures use the intended static logo layout. Development captures may contain Next's dev indicator; it is absent from production mode.

## Full checks

The single broad full pass was attempted. Concrete browser failures remain unresolved; this is not completion/sign-off. Earlier focused tests are implementation checkpoints.

| Check | Result |
| --- | --- |
| Typecheck | Passed |
| Lint | Passed |
| All default tests | 544 passed; one existing PDF worker exceeded the unchanged 5-second test timeout during concurrent checks, then passed alone without changes. 85 gated live cases were subsequently executed separately. |
| Guarded live tests | All 85 passed: 83 main cases with maxWorkers=1, plus isolated account-recovery and demo-upgrade/preservation cases. |
| Production build + PDF trace guard | Passed, including Helvetica/chunks/ICC, both Bengali fonts and 8 logos. |
| Production e2e + sticky + Lighthouse | First run: 8 passed, 15 failed out of 23; zero skips with RUN_LIGHTHOUSE=1. Failures are being investigated. |
| Production dependency audit | Passed: no known production vulnerabilities. |
| Secret scan | Pending |
| Real local production HTTP smoke | Pending |

## Evidence still to collect

- Sticky measurements at both desktop sizes, viewport/internal-scroll fit, container release/footer separation, mobile/exact-900 behavior and any annotated post-footer test scroll room.
- Lighthouse Home/Job/Apply/Success scores and failed audits; Home/Job targets 85 performance, 95 accessibility/best practices.
- Hydrated salary initial-state assertions. SSR regressions pass; a reported discrepancy is not a confirmed/fixed bug without reproduction.
- Full test totals, fixes required by actual failures, final acceptance counts/deviations and unverified owner checks.

## First production browser failures / investigation

- Report: `C:\Users\Hossa\AppData\Local\Temp\opencode\ui-e2e.json`; error contexts are ignored under `test-results/`. Do not copy private browser artifacts into git.
- Passed: public keyboard/modal/header checks, anonymous admin shell, public privacy/404/reference safety, health/home basics, admin non-allowlist gating, cron and departments flow.
- Failed: brand logo upload, Job authoring/list, MFA, Home performance, both public-apply cases, four sticky cases, question builder, review and both persistent-session cases. Most admin cases stall during sign-in/MFA navigation; no security gate has been relaxed.
- Home Lighthouse: performance **76**, accessibility **100**, best practices **100**, SEO **92**, LCP **4,732ms**, CLS **0.0014**. Failed binary audit IDs: meta-description and bf-cache. The performance assertion stops the audit loop after Home, so Job/Apply/Success scores are not yet collected; preserve targets and collect all scores before final assertions when fixing this reporting issue.
- Home browser failure context unexpectedly contains zero public jobs and UUID-like/repeated department labels; the 1440px panel consequently overflows by 409px, and the 1280px grid has no long results to scroll. Work-from-home chip is absent. These are not valid proof failures to bypass by weakening assertions.
- A fresh independently guarded raw/typed DB probe found exactly six departments, zero UUID-shaped names and the correct canonical Technical department. Five concurrent public query batches also returned correct department shapes. No stored department corruption was found, and no records were normalised/reset. Investigate Next production cache/runtime and shared query handling before treating the response as real data.
- First browser command used an unquoted PowerShell comma argument and did not start tests; corrected to `pnpm test:e2e "--reporter=list,json"`. Actual run used PLAYWRIGHT_PRODUCTION=1, RUN_LIGHTHOUSE=1 and PLAYWRIGHT_JSON_OUTPUT_NAME pointing to the approved temporary directory.
- Full-suite repeats are not planned. Diagnose/fix concrete failures, rebuild runtime changes if needed and rerun affected cases only.

## Owner actions / external verification

Configure the actual contact/deletion email, confirm brand descriptions/websites and review the privacy/retention draft. Hosted Vercel preview, real-phone rendering and real production-key behavior require owner verification. No production credentials, migration or database operation are part of this work.
