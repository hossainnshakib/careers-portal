# Vercel deployment checklist

## Build and environment
- Next.js 15.5.27 / Node 24 / pnpm 12.9.1; install with frozen lockfile and build with `pnpm build`. No static export: admin, uploads, inline forms and PDFs require server runtime.
- Main `8072afe` includes cleanup PR #8 at the conversion baseline. Use the reviewed conversion release, not historical phase branches. Agent does not merge/deploy. Follow `PRODUCTION_CONVERSION_PLAN.md` and its Gate 1 approvals; successful packaging is not go-live approval.
- Set public variables before the build. NEXT_PUBLIC_SITE_URL is an optional explicit origin override. Otherwise, on Vercel, resolution prefers VERCEL_PROJECT_PRODUCTION_URL then VERCEL_URL with HTTPS; outside Vercel the default is http://localhost:3000. Enable Vercel's automatic System Environment Variables exposure. NEXT_PUBLIC_CONTACT_EMAIL is optional but required to finish owner contact/privacy review. Secrets stay server-only, without NEXT_PUBLIC prefixes. See VERCEL_ENV_TABLE.md.
- Next config bakes the resolved public origin into NEXT_PUBLIC_SITE_URL for browser/server consistency; client modules cannot directly read unprefixed platform variables. Prefer an explicit approved custom origin for the real production launch. The requested production-project-first precedence can make preview canonical URLs point at the project's production domain. Auth/relative redirects stay request-bound so a preview does not send login/submission navigation to another environment.
- The retained source-pinned Supabase project is production-designated and forbidden in Preview/Development/local DEV, even if variables are repinned. No isolated cloud DEV is configured. Remove target credentials from all non-production/branch scopes. Production only: APP_ENV=production, DEV pin absent, matching API/both DB targets, fresh secrets, final explicit canonical origin and real Turnstile. Vercel scope disagreement, missing/unknown APP_ENV and test keys fail startup.
- Database connections always verify certificates/hostnames; supply the owner-verified CA privately via DATABASE_SSL_CA when needed. Both live trust checks remain blocked by SELF_SIGNED_CERT_IN_CHAIN until the proper CA is provided and tested. Never suppress TLS verification.
- Sitemap is dynamic (runtime uses existing catalog cache). Credential-free builds with dummy public settings require no database/Auth secrets and must not query production.
- Disable hosted access-log recording of private search queries/authorization headers; do not log request bodies. Application incoming-request diagnostics are disabled, but provider configuration is separate.

## Region and cron
`vercel.json` uses bom1, matching the retained Mumbai project. Do not create another project or change region during conversion.

Exactly one daily cron calls `/api/cron/daily` at 0 0 UTC. Set CRON_SECRET; Vercel automatically supplies `Authorization: Bearer <secret>`. This app compares digests in constant time before I/O. Hobby supports daily scheduling only and timing is best effort within an hour; check plan suitability for commercial use. Cron is production deployment scheduling, not proof that a preview performed cleanup. Confirm configuration and failure monitoring after rollout.

## Candidate PDF packaging
- Current [Vercel duration](https://vercel.com/docs/functions/configuring-functions/duration) and [limits](https://vercel.com/docs/functions/limitations) docs, checked 2026-10-08, give **Hobby Fluid Compute 300 seconds default/maximum**, with Fluid enabled by default for new projects. PDF, upload-url and the job/legacy-apply pages explicitly use **nodejs / maxDuration=60**. [Next 15 documentation](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config#maxduration) confirms page-level maxDuration also governs Server Actions rendered there, including submitApplication. Do not export a duration constant from a use-server action module.
- The existing PDF render timeout remains **30 seconds**, below the explicit 60-second platform budget, leaving margin for authorization/data/model work. No reduction is needed against the documented Hobby Fluid limit; the answer budget remains primary. Actual project Fluid settings/effective limits cannot be verified from repository code; verify Fluid is enabled in the first deployment. Current referenced docs do not establish the effective limit of a legacy project with Fluid disabled.
- `serverExternalPackages` includes @react-pdf/renderer and sharp. The Linux build must install the correct optional sharp prebuilt binaries; do not deploy Windows node_modules.
- Installed sharp 0.35.5 declares Linux x64 sharp/libvips optional packages and both are in the frozen pnpm lockfile; the workspace has no optional-dependency exclusion. [Sharp installation docs](https://sharp.pixelplumbing.com/install/) require optional packages, Node-API v9 (Node >=20.9) and a compatible Linux runtime; Node 24 meets the Node requirement. Install on Vercel Linux with optional dependencies enabled, not with no-optional/omit-optional flags. Current logo SVGs contain paths rather than text, so sharp does not need extra system fonts for them; PDF uses its traced static fonts separately. Installed sharp has no install lifecycle script to add to the existing build-permission list.
- `outputFileTracingIncludes` explicitly covers `assets/fonts/*.ttf` and `public/brands/*` for `/api/admin/applications/*/pdf`. Check deployed bundle files, not only local compilation. Hind Siliguri static Regular/Bold are the PDF fonts; Inter variable is website-only.
- PDF runtime data is explicitly included with `./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/**` for that same PDF route. pdfkit 0.20.1 is transitive through react-pdf and lazily uses `createRequire('#standard-fonts/Helvetica')`; its package-import modules/chunks were not discovered automatically. Existing renderer/sharp externalization is sufficient with this include; no dependency or PDF layout change is required.
- Fonts/assets resolve from the function's application working directory. First real download must confirm the trace paths survive Vercel packaging, no remote font fetch occurs, and SVG logo bytes rasterize into bounded PNGs.
- PDF response is private/no-store, generated in memory and downloadable with safe UTF-8 filename. Notes are not queried unless explicitly included. No filesystem persistence is assumed in serverless runtime.

### Post-build PDF trace regression guard
`pnpm build` automatically runs `scripts/check-pdf-trace.ts --require-build`. It parses `.next/server/app/api/admin/applications/[id]/pdf/route.js.nft.json` and fails if lazy Helvetica CJS, its chunks, ICC data, either static Bengali font or any current static brand logo is absent. Run `pnpm test:pdf-trace` manually to recheck; it skips cleanly without any build output, but a missing route trace after a build is a failure.

Verified local before/after evidence (2026-10-09, main-derived branch):
| Asset/package | Before | After |
|---|---|---|
| pdfkit traced files | 3 (Node entry, package.json, ICC) | 76, including its complete installed package |
| Helvetica.cjs | Missing | Present |
| Standard font CJS/MJS modules | 0 | 28 |
| Standard font dependency chunks | 0 | 2 |
| AFM files | 0 | 14 (legacy data also covered) |
| sRGB ICC profile | Present | Present |
| Hind Siliguri Regular/Bold | Both present | Both present |
| Static brand logos | All 8 present | All 8 present |

fontkit, linebreak, png-js, restructure, unicode-properties and unicode-trie runtime entry files were already present and remain so. Their installed compiled Unicode/shaper data is embedded in distributed code; fontkit source-only trie/JSON files not listed are not additional missing runtime assets. No unsupported broad dependency externals or extra package copies were added.

Local renderer tests can find every installed node_modules file and therefore cannot expose a stripped-serverless-package failure like this. The trace guard catches omissions in the local Next build manifest, not whether Vercel copied/loaded that manifest correctly on Linux. Confirm cold and warm Profile PDF downloads on the branch preview with MFA, including Bengali text, before promotion.

## Final approved production smoke (owner; no production-DB preview)
1. **MFA login**: fresh ephemeral/test admin, password re-verification for enrollment, TOTP challenge and password-only denial. Verify HttpOnly/Secure cookies over HTTPS and CSP without unsafe-eval.
2. **PDF download**: English and Bengali profiles, notes off/on, long text/URL pagination, correct visible footers/logos and fonts. Check first cold invocation and a subsequent warm one.
3. **Logo upload**: small passive SVG/PNG/WebP succeeds and displays via img; active/malformed/oversized content fails. Confirm sharp works on Linux/serverless.
4. **Apply with CV**: independent `/jobs/<slug>/apply` 200/noindex page, lazy nonce-bearing CAPTCHA, private direct upload, required files, consent, validation, reference and actual review rows. No inline form/308. This synthetic write requires separate approval; publish no real roles before final go-live permission.
5. **Privacy/public**: real counts/filter SSR, reduced motion, mobile sheet/focus, 404/error recovery, canonical URLs/sitemap/robots and no applicant disclosure by references. Check on a physical phone too.
6. **Authorization/maintenance**: anonymous/non-admin downloads denied; private signed links short-lived; missing/wrong cron bearer denied; authorized response contains only counts.

Preview deployment, Linux bundle contents, real production widget keys, production database/bucket settings, provider logs and physical-device behavior are not verified by local tests. Record owner results before launch and resolve packaging errors rather than increasing timeouts or weakening gates.

## Read-only post-deploy smoke
Run `pnpm smoke -- https://<public-deployment-hostname>` from the repo root. It needs no env file, secrets or account; it makes GET requests only and creates no records/uploads. Publish at least one public role first. For local production-header checks use pnpm build/start, then `pnpm smoke -- http://localhost:3000` (next dev deliberately permits development CSP allowances and will fail the production-header check).

Checks cover health, public Job/independent Apply, unknown role, CSP/headers, anonymous admin/API denial, unauthorized cron, sitemap/robots and recognizable leak signatures. This populated-catalog tool intentionally fails without an open role; **do not publish a role just to make it pass**. Use the existing cleanup read-only browser checks for the empty state. No credentials/automatic redirects are sent. Authenticated production smoke and Linux packaging still require owner approval and verification; signature scans do not prove absence of unknown secrets.
