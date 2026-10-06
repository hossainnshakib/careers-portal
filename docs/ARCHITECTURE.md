# ARCHITECTURE — Careers Portal

## Overview
```
Browser ──> Vercel (Next.js app: public site + /admin + route handlers)
                 ├──> Supabase Postgres   (all data, via Drizzle, server-side only)
                 ├──> Supabase Storage    (private "applications" bucket; public "brand-assets" bucket)
                 └──> Supabase Auth       (admin login only)
Cloudflare Turnstile protects the apply form and the upload-URL endpoint.
```
No separate backend. Brand websites (WordPress, Laravel, Next.js, SaaS) are NOT coupled to this app; they only link to it.

## Hosting and environments
- Now: Vercel (Hobby) + Supabase (free). The existing DEV Supabase project is in Mumbai (`ap-south-1`). Only a DEV Supabase project exists. Production comes later (separate Supabase project, separate Vercel environment variables, custom domain `careers.fixenmedia.com` via a CNAME).
- Production region: Singapore or Mumbai, to be decided by measuring latency before the production project is created; the Vercel function region must match the Supabase region. Use `sin1` for Singapore or `bom1` for Mumbai, including Mumbai for previews connected to the dev project.
- Free-tier caveats the code must tolerate: Supabase free projects pause after about a week of inactivity, and there are no automatic backups. The daily cron route (below) makes a trivial DB query as a keep-alive, and the runbook documents a manual periodic export. Vercel Hobby cron can run at most once per day, so use ONE daily route.
- Local dev connects to the dev Supabase project. Vercel previews also use dev. Never point local or preview at production.

## Environment variables
See `.env.example`. Parse and validate them in `src/lib/env.ts` with Zod, split into server and public parts. The service-role key, `DATABASE_URL`, `UPLOAD_SESSION_SECRET`, `CRON_SECRET`, `TURNSTILE_SECRET_KEY` are server-only.
Two DB URLs: `DATABASE_URL` (runtime, pooler, `prepare: false`) and `DIRECT_URL` (drizzle-kit migrations). If the direct connection fails because the network has no IPv6, use the Supabase session-pooler connection string for `DIRECT_URL`.

## Folder structure
```
src/
  app/
    (public)/
      page.tsx                       # careers home + filters
      jobs/[slug]/page.tsx           # job detail
      jobs/[slug]/apply/page.tsx     # dynamic application form
      applied/[reference]/page.tsx   # success
    admin/
      login/page.tsx
      (protected)/                   # layout calls requireAdmin()
        page.tsx                     # dashboard
        applications/page.tsx
        applications/[id]/page.tsx
        jobs/ (list, new, [id]/edit)
        brands/
        departments/
    api/
      health/route.ts
      upload-url/route.ts            # signed upload URLs (public, Turnstile + session token)
      admin/applications/[id]/pdf/route.ts
      admin/attachments/[id]/route.ts  # requireAdmin -> 302 to short-lived signed URL
      cron/daily/route.ts            # CRON_SECRET; cleanup + keep-alive
    sitemap.ts, robots.ts
  db/ (schema.ts, index.ts, migrations/, queries/, seed/)
  lib/
    auth/requireAdmin.ts
    supabase/ (server.ts, admin.ts)  # admin.ts uses service role, server-only
    storage/                         # all storage calls live here
    validation/buildSchema.ts        # Zod schema from job questions
    pdf/ (CandidateProfile.tsx, fonts.ts)
    markdown/render.ts               # sanitising renderer, raw HTML off
    turnstile.ts, upload-session.ts, env.ts, slug.ts, reference.ts
  components/ (public/, admin/, form-renderer/, ui/)
public/brands/                       # static logos for seeded brands (slug.svg)
assets/fonts/                        # Bengali + Latin fonts (OFL licensed)
docs/  prompts/  design/
```

## Auth
- Supabase Auth, email + password, sign-ups disabled. Admins are created manually in the Supabase dashboard and then added to `admin_users` with `pnpm admin:add <email>`.
- `requireAdmin()`: create server Supabase client, `getUser()`, reject if no user, look up `admin_users`, reject if missing. Returns `{ userId, email }`. Call it at the top of every admin layout/page, server action, and route handler.
- Public `/admin/login` is the necessary authentication entry exception. Its login action verifies credentials, then calls `requireAdmin()` before returning success; non-allowlisted sessions are removed. Protected actions return typed generic denials; protected pages redirect expected denials to login. The discovery-backed surface tests cover each independently.
- `middleware.ts` only redirects unauthenticated requests for `/admin/*` to `/admin/login` as a convenience.
- TOTP MFA for admins is added in Phase 4.

## Data access
- All reads/writes through Drizzle in `src/db/queries/*`, server-side only. RLS is enabled on every table with no policies, so the browser-exposed anon key cannot read anything even if misused.
- Phase 1 catalog/job mutations use transaction advisory locks for shared ordering/slug writes. Job saves lock/reload the existing row, questions and application existence before applying ownership, immutable slug and archive rules.
- Use transactions for multi-row writes (application submit, job save with brands + questions).

## Caching
- The public job list and job detail pages are cached with tags (`jobs`, `job:<slug>`, `brands`, `departments`). Every admin mutation that affects public data calls `revalidateTag` for the affected tags. Use the caching API of the installed Next.js version (check its docs; do not rely on memory).
- Careers home: the server loads ALL open jobs (with brands, department, type, mode, level) once from cache; a client component filters them in memory and syncs filters to the URL with nuqs. Counts per option are computed from the same data. The initial HTML is already filtered according to the URL so links and crawlers work. If open jobs ever exceed a few hundred, move filtering to the server behind the same UI.
- Phase 2 catalog/detail caches use JSON-safe public projections and a five-minute fallback TTL alongside the existing mutation tags. Expired deadlines are excluded when refreshing the catalog. Hidden brands are omitted from public branding; a job with no active brand is unavailable publicly. If its primary brand is hidden, the first visible linked brand supplies the card logo, while application snapshots retain the actual database primary.
- Facet counts apply every other selected filter and replace the counted facet with the individual option. This preserves OR semantics when adding options. The homepage has no streaming loading boundary that would hide its filtered HTML without JavaScript; the application page retains its own loading state.
- Apply form pages and all admin pages are dynamic (no shared cache).

## Dynamic form
- The apply page loads the job and its non-archived questions on the server and renders the form from that data.
- `buildSchema(questions)` produces the Zod schema. The SAME function validates on the client and on the server. Question `type` maps to validation: short_text/long_text (trim, max length), single_choice (value ∈ options), multiple_choice (subset of options, min/max if configured), yes_no (boolean), number (min/max/integer), url (http/https only), email, phone (Bangladesh-friendly: allow +880 and local 01XXXXXXXXX plus general international), file_upload (references uploaded file tokens, see below).
- Fixed fields on every application: full name, email, phone, location (city/country). A CV upload is fixed and required unless the job sets `cv_required = false`.
- `date` answers are Gregorian ISO calendar strings with inclusive absolute or UTC-`today` bounds resolved when validating. Single choice supports radio/dropdown; permitted Other is plain text (one free-text value in a multiple-choice array). Phase 1's shared field renderer and local preview exercise these without submitting applicants/files.

## File upload flow
Files never pass through the Next.js server (Vercel body limits).
1. Candidate solves Turnstile on the apply form. The first `POST /api/upload-url` verifies the token server-side and returns an **upload session token**: HMAC-signed (`UPLOAD_SESSION_SECRET`), contains a random session id and an expiry (2 hours). Later calls send this token instead of a new Turnstile solve.
2. For each file the client sends `{ sessionToken, jobSlug, slot: "cv" | questionId, fileName, mime, size }`. The server verifies: token valid, job is open, slot is valid for the job, MIME/extension in the allowlist for that slot, size within the limit, and the session has fewer than 8 files (count objects under `pending/<sessionId>/`). It returns a signed upload URL for `pending/<sessionId>/<uuid>-<sanitisedName>`.
3. The browser uploads directly to Storage.
4. On submit the server re-verifies every referenced path starts with `pending/<sessionId>/`, the object exists, and its size/MIME match what is allowed. It generates the `applicationId`, **moves** the objects to `applications/<applicationId>/...`, then inserts rows in one transaction. If the transaction fails, it deletes the moved objects.
5. The daily cron deletes anything under `pending/` older than 24 hours.
Limits to start with: CV pdf/doc/docx ≤ 5 MB; other files pdf/png/jpg/webp/zip ≤ 10 MB; max 8 files per application. No antivirus scanning in V1 (admins download files rather than previewing them in untrusted apps).

Phase 2 implementation details:
- `POST /api/upload-url` also accepts `{ jobSlug, turnstileToken }` to initialize a session for applications with no attachments. The signed session is bound to that job and expires after two hours. Submit requires a fresh Turnstile verification and at least three seconds since server-issued session creation. Live Turnstile checks require the configured site hostname and `careers` action; documented Cloudflare test secrets are accepted only with `APP_ENV=development`.
- Private `pending/<sessionId>/reservations/<uploadId>.json` sidecars store server-validated slot, filename, MIME and size. A transaction advisory lock keyed by session serializes reservation creation and submission. At most eight reservations are issued, including unfinished/removed files; this prevents simultaneous signed-URL requests bypassing the limit. No database table or migration is added.
- Browser forms submit opaque upload UUIDs. Only server-owned reservations determine paths and metadata. Signed uploads cannot overwrite existing objects. Retries reuse reservations; a completed upload with matching metadata is recognized after a lost browser response. The form offers **Start fresh uploads** to renew an expired/exhausted session while preserving written answers.
- Submit checks the current job/questions under a shared job-row lock, verifies reservation ownership/slot, actual Storage size/MIME, and a bounded 512-byte content signature. Only this small prefix passes through Next.js; full candidate files upload directly to Storage. Signature checks are not antivirus or full document parsing.
- The session UUID becomes the application UUID. The session lock and existing-application lookup make retries idempotent; reference collisions retry using a unique-index-safe insert. Questions and linked brands are snapshotted transactionally, and file answers contain attachment UUIDs.
- On persistence failure, the server reacquires the session lock and checks whether the transaction actually committed before attempting recovery. Uncommitted moved files are restored to their original pending paths so the candidate can retry. This deliberately replaces the original delete-on-failure behavior; committed attachments are never restored merely because a commit acknowledgement was lost. Recovery failures return a generic message to restart uploads.
- Abandoned reservation/file cleanup remains the Phase 5 daily cron deliverable. That cleanup must recurse into reservation sidecars. Phase 2 browser fixtures explicitly remove all their tracked pending/final test objects.

Small admin logos are separate: authenticated server actions accept SVG/PNG/WebP <=1 MB, validate bytes/extension/MIME and passive SVG markup, and upload behind `src/lib/storage/`. A 2 MB Next server-action body limit accommodates multipart overhead; candidate files still follow the direct Storage flow above.

## Submit flow (`submitApplication` server action)
Verify Turnstile → load job (must be `open`) and its non-archived questions → validate with `buildSchema` → verify uploads (above) → generate unique `reference` (`APP-` + 6 chars from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`, retry on collision) → transaction: insert `applications` (with job title, slug, brand names, department name snapshots), `application_answers` (with label/type/section snapshots), `attachments` → redirect to `/applied/<reference>`. Honeypot field and a minimum fill time are checked as well.

The public acknowledgement validates and displays only the reference syntax. It performs no applicant lookup and exposes no applicant details or confirmation that a reference exists; it is excluded from indexing. Actual receipt is established by the successful submission redirect.

## Admin file downloads
`GET /api/admin/attachments/[id]` → `requireAdmin()` → load attachment → create a signed URL (≈60 s, with download filename) → 302. No public URLs ever.

## Candidate PDF
- `GET /api/admin/applications/[id]/pdf?notes=0|1` → `requireAdmin()` → load application, answers, attachments list, notes (only if requested) → render with `@react-pdf/renderer` in the Node runtime → stream with a good filename (`<reference>-<name>.pdf`). Generated on demand; not stored.
- Layout: header band with the primary brand's accent colour and logo, candidate name, position, brand(s), department, applied date, status, reference; then sections in order (personal & contact, professional, experience, skills, portfolio links, role-specific answers, attachments list). Footer with generated-at date and page numbers. Notes only when explicitly included.
- **Bengali risk:** `@react-pdf/renderer` has historically had trouble shaping Bengali conjuncts. Test in Phase 0 (`/dev/pdf-test`) with a Bengali font (Noto Sans Bengali / Hind Siliguri) and tricky strings. If shaping is wrong, fall back to rendering an HTML template to PDF with a serverless-compatible Chromium build; record the decision in `docs/DECISIONS.md` before building more PDF code.
- A "Profile + CV" package can be added later (merge with `pdf-lib` when the CV is a PDF, otherwise ZIP).

## Cron (`/api/cron/daily`)
`vercel.json` schedules one daily call. The route requires `Authorization: Bearer ${CRON_SECRET}`. It (1) deletes stale `pending/` uploads, (2) runs a trivial DB query as keep-alive. Returns counts only, no PII.

## Security model summary
- Public surface: careers pages, apply page, success page, `POST /api/upload-url`, health, sitemap. Everything else requires `requireAdmin()` or `CRON_SECRET`.
- Anti-abuse on public endpoints: Turnstile, honeypot, min fill time, upload-session limits. Add an IP-hash rate limit only if abuse actually appears.
- Security headers (Phase 4): `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`), `Permissions-Policy`, and a CSP that allows only what is needed (self, Turnstile, Supabase storage/API origins).
- Admin accounts: strong passwords, MFA (Phase 4). The admin allowlist is separate from Supabase auth users.
- Logs never include applicant data. Errors shown to users are generic.
- Data retention: admin can delete an application together with its files.

## Testing strategy
- Unit: `buildSchema` (each question type, valid + invalid), slug and reference helpers, seed production guard.
- Integration: auth gating (every `/admin` page, action and API route rejects unauthenticated requests), RLS (anon key reads nothing from any table), submit action rejects tampered payloads (wrong job, closed job, unknown question, bad file path).
- E2E (Playwright): browse + filter, apply with files, admin login, review, status change, note, download CV, download PDF.
- CI (GitHub Actions): install, typecheck, lint, unit/integration tests; e2e where feasible against a local/dev setup.
