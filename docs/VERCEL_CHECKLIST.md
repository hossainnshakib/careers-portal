# Vercel deployment checklist

## Build and environment
- Next.js 15.5.27 / Node 24 / pnpm 12.9.1; install with frozen lockfile and build with `pnpm build`. No static export: admin, uploads, inline forms and PDFs require server runtime.
- Preview the actual **v1-complete** branch; main is not consolidated yet. Only the owner selects/merges the final production release branch.
- Set public variables before the build. NEXT_PUBLIC_SITE_URL must be the deployment's real origin; NEXT_PUBLIC_CONTACT_EMAIL is optional but required to finish owner contact/privacy review. Secrets stay server-only, without NEXT_PUBLIC prefixes.
- Preview uses dev Supabase only, APP_ENV=development and its independent dev pin. Production uses a distinct project and explicit APP_ENV=production, with real Turnstile keys. Missing/unknown APP_ENV and production test-key values fail build/start.
- Disable hosted access-log recording of private search queries/authorization headers; do not log request bodies. Application incoming-request diagnostics are disabled, but provider configuration is separate.

## Region and cron
`vercel.json` uses bom1 for the current Mumbai dev-backed preview. Production must match the chosen Supabase region: bom1/Mumbai or sin1/Singapore after measuring latency. Change the regions entry before a Singapore production deployment.

Exactly one daily cron calls `/api/cron/daily` at 0 0 UTC. Set CRON_SECRET; Vercel automatically supplies `Authorization: Bearer <secret>`. This app compares digests in constant time before I/O. Hobby supports daily scheduling only and timing is best effort within an hour; check plan suitability for commercial use. Cron is production deployment scheduling, not proof that a preview performed cleanup. Confirm configuration and failure monitoring after rollout.

## Candidate PDF packaging
- `src/app/api/admin/applications/[id]/pdf/route.ts` explicitly uses **nodejs**, not Edge, with **maxDuration=60**. The renderer request timeout is 30 seconds; answer budget remains the primary bound. Confirm your plan's effective duration and memory limits.
- `serverExternalPackages` includes @react-pdf/renderer and sharp. The Linux build must install the correct optional sharp prebuilt binaries; do not deploy Windows node_modules.
- `outputFileTracingIncludes` explicitly covers `assets/fonts/*.ttf` and `public/brands/*` for `/api/admin/applications/*/pdf`. Check deployed bundle files, not only local compilation. Hind Siliguri static Regular/Bold are the PDF fonts; Inter variable is website-only.
- Fonts/assets resolve from the function's application working directory. First real download must confirm the trace paths survive Vercel packaging, no remote font fetch occurs, and SVG logo bytes rasterize into bounded PNGs.
- PDF response is private/no-store, generated in memory and downloadable with safe UTF-8 filename. Notes are not queried unless explicitly included. No filesystem persistence is assumed in serverless runtime.

## Test first on a dev-backed preview (owner)
1. **MFA login**: fresh ephemeral/test admin, password re-verification for enrollment, TOTP challenge and password-only denial. Verify HttpOnly/Secure cookies over HTTPS and CSP without unsafe-eval.
2. **PDF download**: English and Bengali profiles, notes off/on, long text/URL pagination, correct visible footers/logos and fonts. Check first cold invocation and a subsequent warm one.
3. **Logo upload**: small passive SVG/PNG/WebP succeeds and displays via img; active/malformed/oversized content fails. Confirm sharp works on Linux/serverless.
4. **Apply with CV**: same-page anchor, lazy nonce-bearing CAPTCHA, direct private PDF upload, required question files, server validation, success reference and actual review rows. Check the old apply HTTP 308.
5. **Privacy/public**: real counts/filter SSR, reduced motion, mobile sheet/focus, 404/error recovery, canonical URLs/sitemap/robots and no applicant disclosure by references. Check on a physical phone too.
6. **Authorization/maintenance**: anonymous/non-admin downloads denied; private signed links short-lived; missing/wrong cron bearer denied; authorized response contains only counts.

Preview deployment, Linux bundle contents, real production widget keys, production database/bucket settings, provider logs and physical-device behavior are not verified by local tests. Record owner results before launch and resolve packaging errors rather than increasing timeouts or weakening gates.
