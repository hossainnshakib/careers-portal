# Phase 4 — Candidate PDF and security hardening

## Delivered
- Independently authorized `/api/admin/applications/[id]/pdf` in the Node runtime, requiring verified admin identity/allowlist/AAL2 before applicant reads.
- Snapshot-based professional A4 PDF with primary branding, contact/answer sections, attachment names, generated date and visible page counters. Internal notes are not queried unless `notes=1`; the sidebar defaults to exclusion.
- Bengali static-font shaping check and English/Bengali/long/many-answer PDF samples, generated outside the repository.
- Mandatory TOTP setup/challenge under explicit owner approval; first-factor-only sessions cannot access protected pages/actions/downloads. Verified factors cannot be replaced through the password-only bootstrap.
- HttpOnly/SameSite auth cookies, enforced document CSP/nonces, nosniff/referrer/permissions/frame headers, private download caching/referrer controls.
- Bounded logo decoding/rasterization, retained candidate upload signature/ownership/MIME/size/quota checks, real anonymous RLS verification and no unproven IP-rate-limiter addition.
- Generic provider/DB failure boundaries, disabled private-query request logging, dependency audit/remediation, keyboard checks and mobile Lighthouse measurements.
- Full production-mode browser coverage including actual profile PDF download, and guarded CI cloud/browser wiring.

## Verification results
- `pnpm typecheck`, `pnpm lint`, default test suite and optimized build: final checkpoint below.
- Separate live auth/surface/review/jobs/RLS execution: five files / **80 passed**, none skipped.
- Separate dev seed preservation/idempotence test: **one passed**, none skipped. It reran the existing guarded demo seed and preserved applicant/answer fingerprints; no reset or applied migration edit was performed.
- Full production-mode Chromium suite: **14 passed**, one explicitly optional Lighthouse case skipped in that run. That Lighthouse case was executed separately and passed.
- Production mode uses a managed port 3100 with no dev-server reuse. A stale development server caused the first production attempt to use invalid build artifacts; subsequent checks rebuilt and ran an isolated production server. Private router/Flight stalls were corrected through fresh private-document navigation/refreshes. Assertions and covered behaviors were retained.
- Healthy-path checks use actual dev Supabase/Auth/Storage, temporary allowlisted accounts and real TOTP enrollment/challenges. Fixture credentials/codes travel only over IPC; traces are disabled. Temporary rows/accounts/objects are cleaned up. No owner credentials or production project was used.

## Bengali and PDF visual review
The credentials-free spike compared native Chromium PDF-viewer screenshots against same-font Chromium HTML, in Regular and Bold. Tested conjuncts include `ক্ষ`, `ঞ্জ`, `দ্ব`, `স্ত্র`, `ন্ধ`, `শ্রী`, vowel placement and mixed English/Bengali. No shaping mismatch was observed for those samples; react-pdf is retained instead of a Chromium runtime fallback.

Visual inspection caught and fixed header overlap, stranded question labels and missing dynamic footer paint. The final inspected first/last pages show readable text, no clipped labels, visible counters and URLs within their column. The 80-answer sample's intermediate pages were not all inspected manually; renderer tests check visible footer layout across every page. Owner visual review remains useful.

Generated files in `C:\Users\Hossa\AppData\Local\Temp\opencode\`:
| PDF | Pages | What it tests |
|---|---:|---|
| `bengali-spike.pdf` | 1 | Required conjuncts/vowels, regular/bold and mixed text |
| `candidate-sample-english.pdf` | 1 | Seeded English profile, branding, grouping and attachment list |
| `candidate-sample-bengali.pdf` | 1 | Seeded Bengali name/profile, static fonts and footer |
| `candidate-sample-long-answers.pdf` | 3 | Long Bengali paragraph, very long clickable URL and explicitly included synthetic note |
| `candidate-sample-many-answers.pdf` | 11 | 80 synthetic answers based on a demo profile; pagination and label grouping |

Samples are drawn only from deterministic demo IDs with expected demo names/emails; expanded stress answers are in-memory and never written to the database. PDF files/screenshots are outside git. Reproduce:
```powershell
node --import tsx scripts/pdf-bengali-spike.tsx
node --import tsx scripts/pdf-visual-spike.ts
node --env-file=.env.local --conditions=react-server --import tsx scripts/pdf-samples.ts
node --import tsx scripts/pdf-sample-visuals.ts
```

## Lighthouse 13.5.0 — final local simulated-mobile run
| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Home | 100 | 100 | 100 | 100 | 1.819 s | 0.0334 |
| Job detail | 81 | 100 | 100 | 100 | 4.058 s | 0.0191 |
| Apply | 78 | 100 | 100 | 63 | 4.508 s | 0 |

Reports: `lighthouse-home.json`, `lighthouse-job.json`, `lighthouse-apply.json` in the same temporary directory. Job/apply use an ephemeral role with two dynamic questions; these are not worst-case 100-question measurements. Local mobile simulation is not deployed/mobile field performance. Scores varied across cold/warm runs. The apply SEO penalty is intentional noindex/robots exclusion. Dynamic/private no-store pages do not aim to satisfy the back-forward-cache audit. Job/apply LCP remains an optimization opportunity for launch measurement.

Keyboard checks cover skip-link focus, native modal opening/Escape/focus restoration and applicant-table link activation. Lighthouse found no remaining application-page ARIA/CSP inspector failures in the final run. Zod interpreter mode removed eval probes without permitting unsafe-eval in production.

## Dependency audit
Initial full audit: **six** advisories (three high, three moderate). PostCSS override `8.5.23` fixes:
- `GHSA-6g55-p6wh-862q`
- `GHSA-r28c-9q8g-f849`
- `GHSA-qx2v-qp2m-jg93`
- `GHSA-fxqj-rqcc-2cmp`

`pnpm audit --prod`: **No known vulnerabilities found.** Full `pnpm audit` still exits nonzero for:
| Severity | Advisory | Path / disposition |
|---|---|---|
| High | `GHSA-vfj7-8cjw-p6xm` (braces, no patched version) | ESLint Next plugin → fast-glob → micromatch. Build/lint-only, trusted repository patterns; no candidate-controlled globs. Await upstream fix. |
| Moderate | `GHSA-67mh-4wv8-2f99` (legacy esbuild) | drizzle-kit → legacy esm-loader/core-utils. That esbuild HTTP server is not used; tsx uses its separately patched compiler. Explain existing tooling exposure rather than force an unverified loader replacement. |

No findings were suppressed to claim a clean full audit. Next stays on approved 15.x. The owner approved sharp 0.35.5 directly; no other project dependency was added. Lighthouse is transient pnpm dlx tooling.

## Owner walkthrough and CI
See `docs/DEV_SETUP.md` for mandatory MFA enrollment/manual owner recovery, notes toggle/PDF download, production suite and performance commands, and exact dev-only CI secret names. The CI cloud/browser job is enabled only with `DEV_TESTS_ENABLED=true` on push events, not fork PRs. No GitHub run was triggered here.

## Decisions / remaining verification
- No schema change, reset, new role/permission model, bulk/CSV export, email or other product feature.
- Notes excluded by default; PDFs returned in memory/on demand. Original private attachments remain separate downloads.
- Snapshot-name branding ambiguity uses neutral fallback, never a different current primary logo.
- Native private-document navigation and two narrowly documented Next link-lint exceptions intentionally renew auth/nonces and avoid prefetching private profiles. Public URL filtering retains nuqs.
- Inline styles are permitted for existing React/Tailwind branding; script policies remain nonce-based. Development-only eval/WebSockets are excluded in production. Data/Flight fetches do not alter the active document's CSP.
- Not verified: physical-phone PDF/enrollment, Vercel packaging/deployment, production credentials/real production Turnstile keys, hosted CI execution, provider access-log settings, all 11 stress-PDF pages by eye, or field performance.
- Phase 5 still owns abandoned upload cleanup/cron, production rollout/runbook and reconciliation of persistent provider failures.

## Final checkpoint
- `pnpm typecheck`: passed.
- `pnpm lint`: passed, no warnings.
- `pnpm test`: 37 files / **268 passed**; six opt-in live files / 81 cases explicitly skipped in the default run.
- All 81 opt-in cases were executed separately: five live files / 80 passed, then the isolated seed preservation/idempotence case passed. No skipped live case remains unverified at this checkpoint.
- Optimized `pnpm build`: passed with the pinned dev configuration; new protected PDF/MFA routes are dynamic. This does not verify a Vercel deployment or production credentials.
- Production-mode Chromium: **14 passed**, one optional performance case skipped in that suite; the performance case passed separately and produced the final Lighthouse table above.
- Runtime dependency audit: clean. Full dependency audit retains the two documented development-tool advisories.
- PDF sample generation/visual comparison succeeded; final sample counts are **1 / 1 / 3 / 11** for English, Bengali, long and many-answer profiles.
- No unresolved failing checks or Phase 4 implementation blockers remain. Phase 3 was committed locally as `5745e29` under owner approval. The owner subsequently requested a Phase 4 commit and pushes of both phase branches; no main merge was requested.
