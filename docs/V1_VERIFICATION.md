# V1 verification — 2026-10-08

## Release state
V1 implementation is on **v1-complete**, based on published Phase 4. Main remains the foundation (`05cada9`); no merge, force-push or history rewrite occurred. All local phase branches have origin tracking. This is locally verified code and launch preparation, not a production deployment.

## Delivered by workstream
| Workstream | Delivered |
|---|---|
| A | Strict APP_ENV/startup/test-key checks retained; guarded browser account recovery and disabled-sign-up CI assertion retained; bucket MIME/size ceilings; constant-time authorized daily stale-pending/sidecar cleanup, keep-alive and one cron schedule |
| B | Real cached counts/title marquee, reduced motion/focus pause, one optical-size-adjusted brand strip, URL filter/count contracts, sticky sidebar/mobile sheet, department-grouped whole-card 3/2/1 results, applying steps/FAQ and public header/footer/contact setting |
| C | Same-page form with fresh questions/CV/current availability, tiny primary-first hiring marks, top/mobile apply anchors, lazy nonce-bearing Turnstile, unchanged upload/submit core and permanent legacy HTTP 308 |
| D | Clearly drafted owner-review privacy, useful public/root 404/error recovery, canonical/Open Graph basics, privacy sitemap, safe robots/reference-only noindex success |
| E | Bulk-loaded current-brand dots with conservative historical fallback, live tested readable-text contrast preview and owner-editable fresh accent defaults |
| F | Windows RUNBOOK, VERCEL_CHECKLIST, BRAND_LINKS; independent-target owner migration/base/bucket/admin setup; exact blank draft shells/no overwrite; public-only poster CSV/UTMs; Node PDF duration/tracing and current Mumbai dev-preview region |

No dependency, database schema or applied-migration change was required. Existing owner edits and application snapshots remain intact. Public visual originals stay untracked; optional poster-stack artwork is omitted.

## Final checks and actual results
| Check | Result |
|---|---|
| pnpm typecheck | Passed, including final verification fixes |
| pnpm lint | Passed, including final verification fixes |
| pnpm test | **55 files / 458 passed**; eight files / 83 opt-in cases gated in the default run |
| Main dev live run | **6 files / 81 passed**, none skipped (requireAdmin, surfaces, RLS, auth-config, review, jobs) |
| Isolated account-recovery live file | **1 passed**, none skipped |
| Isolated seed preservation/idempotence live file | **1 passed**, none skipped |
| All opt-in coverage | All **83** default-gated cases executed separately; no live skip claimed as a pass |
| pnpm build | Passed with dev credentials and production compilation; public origin overridden to localhost:3100 for the managed browser server |
| Production Chromium / Lighthouse-enabled suite | **17 passed**, none skipped, one serialized worker, approximately four minutes |
| pnpm audit --prod | **No known vulnerabilities found** |
| Tracked content / browser bundle scan | No actual local credentials, private browser credentials or excluded generated/original artifacts found; new additions also checked before staging |
| Local PDF tracing | Both Hind Siliguri static Regular/Bold TTFs present in the PDF route trace |

The full default run preceded the final public-catalog scheduling/accessibility fixes; four affected unit files / **17 cases** then passed, type/lint/build passed again, and the full final browser suite passed. No assertions or timeouts were weakened.

### Dev-only operational checks
- Guarded Storage bootstrap configured the expected private/public visibility, MIME allowlists and size ceilings. Server reservation JSON remains permitted; candidate JSON uploads remain rejected.
- Actual `jobs:seed-shells` on the explicitly approved existing dev pin: **0 created, 19 preserved**. No published job/content/assignment was overwritten. Fresh-draft contents and missing-department/target/no-overwrite behavior are also unit-tested.
- Actual `links:generate`: **16 public-role links**, written to ignored exports/job-links.csv. Only public job metadata is queried; no applicant export exists.
- Real cron HTTP case rejects missing/wrong bearer (401), then validates authorized count-only output through a dev-pinned child. The configured secret never enters a trace or console output. Dated stale/updated/boundary/invalid entries, recursion, pagination/deletion shifting and provider failures have unit coverage.
- Browser start/end sweeps reported **0 leftover allowlist rows / 0 Auth users**. All fixtures use dev guards, synthetic data, private file cleanup and credential-free reports.
- The isolated seed check preserves existing applicant/answer fingerprints and definition idempotence. No database reset or migration operation ran for V1.

## Failures found and fixed during the final pass
The initial browser attempt had a Lighthouse timeout and a stalled apply-test editor reload. Public layout/home cold requests could duplicate a catalog load whose queries still ran in parallel. Request-local React memoization around the unchanged tagged cache plus sequential reads resolved the affected cases; the focused rerun passed, followed by all 17 final browser tests.

Lighthouse also flagged an overridden accessible card name that did not match all visible card text. Removing the override lets visible content supply the name. Tests continue to assert all filtered-region links (not the intentionally unfiltered hero links) and use the unique fixture title for the positive card selection. The final label/name mismatch finding is gone.

## Mobile Lighthouse 13.5.0 — final local simulation
| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Home | 78 | 100 | 100 | 100 | 4.353 s | 0.039856 |
| Job | 96 | 100 | 100 | 100 | 2.326 s | 0.000525 |
| Success | 80 | 100 | 100 | 54 | 4.207 s | 0.000452 |

Reports are lighthouse-home.json, lighthouse-job.json and lighthouse-success.json in the approved temporary directory, never git. Job measurement uses an ephemeral public role; success uses a valid synthetic reference and performs no applicant lookup. These are simulated mobile results on localhost, not deployed field measurements or a worst-case 100-question form.

Remaining reported audits are back-forward-cache eligibility on all pages and success crawlability/meta-description. Success is deliberately noindex/nofollow and robots-excluded. Its generic description is verified in the actual browser DOM, but Lighthouse still reports the meta-description finding; it is recorded, not suppressed. Home/success LCP and metadata/head collection are later polish/deployment measurements. No score threshold was weakened to get a green test.

## Security/scope review
- Admin pages/actions/API handlers still gate independently with getUser, the allowlist and verified same-subject AAL2 claims. Password re-verification protects enrollment; only documented bootstrap surfaces permit first-factor setup.
- Sign-ups are disabled on dev, verified live; assertion/CI wiring remains. Production setting is an owner action, not assumed from dev.
- APP_ENV has no development fallback. Documented Cloudflare site/secret values are checked directly and allowed only in explicit development; unknown/missing production configuration fails clearly.
- Every application table denies anon reads; candidate files are private, uploads remain session/slot/definition/type/size/signature bounded, and downloads are independently authorized/short-lived.
- Text/Markdown/SVG handling, document nonce CSP, private caching/logging boundaries, answer/render limits and dev/demo/reset guards remain enforced. Maintenance owner pins do not relax default dev-only/demo commands.
- Public success discloses only reference syntax, never a record lookup. CSV export reads no applicant fields. Real local secrets, applicant export files and reference/poster originals were not staged.
- No candidate accounts, notifications/email, assessments/ranking, scheduling, extra roles/tenancy, HR management or CMS feature was added.

## Commits and publishing
Implementation commits on v1-complete:
- f5c114b — Set Storage bucket MIME limits and guard dev bootstrap
- 5021b17 — Add authorized daily pending-upload cleanup and database keep-alive
- 320999c — Build department-grouped careers home with restrained public navigation
- 0f21d50 — Compose applications into job pages with lazy Turnstile and legacy redirects
- 2e1c264 — Add draft privacy and public recovery pages with safe metadata
- 7cb7fb9 — Add conservative admin brand marks and readable accent previews
- 5d6fe86 — Add explicitly pinned owner setup and public draft-shell link tools
- a1670e3 — Document owner rollout, backups and brand links with serverless settings
- ddb0a6b — Resolve public catalog contention and verify safe cron HTTP behavior

Published handoff checkpoints: 766c721 and 6fbef6a. The final verification-document commit follows this inventory; see git log. Earlier phase branches are published/upstream-tracked but not merged into main. The owner can review a v1-complete -> main PR; the agent creates no merge.

## Exactly what was NOT verified / owner actions
- No production project/credentials, production migrations/seeding, production Auth/bucket/RLS settings, actual production Turnstile pair, CNAME/certificate provisioning or production region benchmark.
- No Vercel preview/production deployment, Linux/serverless sharp packaging, effective hosted PDF/cron duration/memory, provider access-log configuration or real scheduled cron delivery.
- No hosted CI/PR inspection (gh is unavailable), real phone, Safari/Firefox, assistive-technology reading test or mobile field-performance data.
- No manual backup/export of real applicant data, experimental Storage CLI execution or isolated restore rehearsal; runbook steps are prepared and must be tested by the owner.
- No fresh all-pages visual PDF spike/sample review: prior static Bengali shaping/visual verification is retained; V1 browser verifies an actual authenticated profile PDF download and local font traces, not every stress-PDF page by eye.
- Production positivity of the owner setup commands cannot be verified without production credentials. Pure target/no-overwrite/CLI-refusal tests and dev shell/export/bootstrap execution were verified.

Owner must confirm public contact/deletion address and privacy/retention draft, TBD brand details/websites/sectors and existing colours, real role content/assignments/questions/type/mode, Mumbai/Singapore by latency and suitable hosting plans. Deploy the actual reviewed V1 branch to a dev-backed preview first, check PDF/logo/apply/MFA on serverless and a real phone, then personally perform the RUNBOOK production steps.

## Local commands (PowerShell, project root)
```powershell
pnpm install --frozen-lockfile
pnpm dev
```
Open http://localhost:3000 (configured dev .env.local required). For a phone on the same private network use `pnpm dev --hostname 0.0.0.0` and the PC IPv4 address. Stop dev before a production build:
```powershell
pnpm build
pnpm start
```
For the managed production browser check, build with NEXT_PUBLIC_SITE_URL=http://localhost:3100, then set PLAYWRIGHT_PRODUCTION=1 and RUN_LIGHTHOUSE=1 and run pnpm test:e2e. See DEV_SETUP for opt-in live commands; isolate account recovery and seed preservation. Generated CSV stays ignored; never place production credentials in this workspace or chat.
