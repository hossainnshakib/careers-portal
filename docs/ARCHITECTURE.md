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
`APP_ENV` is required explicitly; it has no development default. `next.config.ts` validates it before production build/start and rejects documented Turnstile test site keys and secrets unless `APP_ENV=development`. Request verification independently checks both key values and fails closed for invalid environments.

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
- Supabase Auth, email + password, sign-ups disabled (asserted by the opt-in `src/db/auth-config.live.test.ts`). Admins are created manually in the Supabase dashboard and then added to `admin_users` with `pnpm admin:add <email>`.
- `requireAdmin()`: create server Supabase client, `getUser()`, reject if no user, look up `admin_users`, reject if missing, then require cryptographically verified JWT claims with the same subject and `aal2`. Returns `{ userId, email }`. Call it at the top of every admin layout/page, server action, and route handler. The SDK's session-derived assurance metadata is not used for authorization.
- Public `/admin/login` is the necessary authentication entry exception. Login verifies credentials and then calls `requireAdmin({ allowMfaSetup: true })` before success; non-allowlisted sessions are removed. That narrow first-factor exception is used only by login/logout and `/admin/mfa` enrollment/challenge surfaces, which still verify getUser and the DB allowlist, and enrollment additionally re-verifies the administrator password against the verified session subject so a stolen first-factor cookie cannot install an authenticator. Discovery tests forbid it elsewhere. Protected pages redirect MFA denials to `/admin/mfa`, other expected denials to login; actions/API handlers fail closed with generic responses.
- Phase 3 adds the applicant profile, four review actions and the attachment handler to that discovery registry. Middleware redirects anonymous admin pages but lets admin API requests reach their own authorization gate; the attachment handler returns a generic 403 rather than a login redirect for denied callers.
- `middleware.ts` only redirects unauthenticated requests for `/admin/*` to `/admin/login` as a convenience.
- TOTP MFA is mandatory for every admin under explicit owner approval. Setup first re-verifies the administrator password, then reloads owned factors and never replaces a verified factor, and verifies AAL2 after a successful challenge. There is no application MFA bypass or self-service verified-factor removal/recovery endpoint. Auth cookies are HttpOnly/SameSite=Lax and Secure when the configured site uses HTTPS.

## Data access
- All reads/writes through Drizzle in `src/db/queries/*`, server-side only. RLS is enabled on every table with no policies, so the browser-exposed anon key cannot read anything even if misused.
- Job pages and review/PDF loaders serialize their small bounded read sets to avoid the observed concurrent-read transaction-pooler stall under production-mode browser tests; the runtime driver's five-connection pool and `prepare: false` remain unchanged.
- Phase 1 catalog/job mutations use transaction advisory locks for shared ordering/slug writes. Job saves lock/reload the existing row, questions and application existence before applying ownership, immutable slug and archive rules.
- Use transactions for multi-row writes (application submit, job save with brands + questions).

## Caching
- The public job list and job detail pages are cached with tags (`jobs`, `job:<slug>`, `brands`, `departments`). Every admin mutation that affects public data calls `revalidateTag` for the affected tags. Use the caching API of the installed Next.js version (check its docs; do not rely on memory).
- Careers home: the server loads ALL open jobs (with brands, department, type, mode, level) once from cache; a client component filters them in memory and syncs filters to the URL with nuqs. Counts per option are computed from the same data. The initial HTML is already filtered according to the URL so links and crawlers work. If open jobs ever exceed a few hundred, move filtering to the server behind the same UI.
- Phase 2 catalog/detail caches use JSON-safe public projections and a five-minute fallback TTL alongside the existing mutation tags. Expired deadlines are excluded when refreshing the catalog. Hidden brands are omitted from public branding; a job with no active brand is unavailable publicly. If its primary brand is hidden, the first visible linked brand supplies the card logo, while application snapshots retain the actual database primary.
- Facet counts apply every other selected filter and replace the counted facet with the individual option. This preserves OR semantics when adding options. The homepage has no streaming loading boundary that would hide its filtered HTML without JavaScript; the application page retains its own loading state.
- Job pages combine cached public content with an uncached authoritative form definition/status/CV policy; submissions still reload under the job/session locks. Admin pages are dynamic (no shared cache). Legacy apply URLs redirect to the job anchor with HTTP 308.
- Phase 4 private navigation uses fresh document loads for admin links, authentication transitions and job/review mutation refreshes. This renews the document CSP nonce, rechecks authorization and avoids stale private router-cache/production Flight navigation behavior. Nuqs is scoped to the public careers hub. Successful mutations still perform server cache/path invalidation.

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
Phase 4 adds bounded sharp decoding (20-million input pixel limit) before publishing a logo, rejecting malformed header-shaped rasters and huge SVG canvases. Candidate files retain bounded first-byte signature checks and download-only access; no antivirus/full Office/archive parsing is claimed.

## Submit flow (`submitApplication` server action)
Verify Turnstile → load job (must be `open`) and its non-archived questions → validate with `buildSchema` and reject submissions whose written answers exceed the shared 50,000-character budget (`validateApplicationAnswers`, which bounds storage, list reads and PDF rendering together) → verify uploads (above) → generate unique `reference` (`APP-` + 6 chars from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`, retry on collision) → transaction: insert `applications` (with job title, slug, brand names, department name snapshots), `application_answers` (with label/type/section snapshots), `attachments` → redirect to `/applied/<reference>`. Honeypot field and a minimum fill time are checked as well.

The public acknowledgement validates and displays only the reference syntax. It performs no applicant lookup and exposes no applicant details or confirmation that a reference exists; it is excluded from indexing. Actual receipt is established by the successful submission redirect.

## Admin file downloads
`GET /api/admin/attachments/[id]` → `requireAdmin()` → load attachment → create a signed URL (≈60 s, with download filename) → 302. No public URLs ever.

The handler validates the attachment UUID, uses private/no-store and no-referrer headers, and serializes authorization with deletion under the application's advisory/row lock. Before signing, it restores any files from an interrupted deletion while the application still exists. Storage metadata JSON distinguishes `NoSuchKey` from permission/infrastructure failures; a missing quarantine object is normal, but other errors fail closed.

## Admin application review (Phase 3)
- The dashboard groups counts by status and loads the latest ten rows. The application list uses validated URL filters (`brand`, `department`, `job`, `status`, `q`, `from`, `to`, `tz`, `sort`, `page`) and 25-row server pagination. Default order is newest first with a stable UUID tie-breaker. Name/email search is case-insensitive with LIKE wildcard escaping; all SQL values are bound parameters.
- Brand/department/job filters use current job assignments, while displayed titles, brands, department and answers use submission snapshots. Date bounds are inclusive calendar days in a validated IANA timezone; the form supplies the viewer's timezone, and saved links retain it. Dates/times display in the viewer's locale/timezone after hydration, with a consistent UTC server fallback.
- Profile reads use a fixed set of queries rather than per-answer/note queries. Answers are plain text except validated HTTP(S) URL links and authorized attachment links. Up to 50 other applications with the same case-insensitive email are shown. Status history joins the allowlist for readable actor emails, with the recorded UUID as fallback when an admin has been removed.
- Status updates lock/reload the application, preserve the actual previous status, update `status_changed_at` and insert the event in one transaction. A no-op status selection does not create an event. Notes record trusted Auth identity/email; only their author can delete them, enforced in the database mutation predicate.
- Confirmed deletion uses the same per-application advisory lock as submission/downloads. It moves attached objects into private `deleting/<applicationId>/<attachmentId>` quarantine paths before deleting the application transactionally (answers, attachments, notes and events cascade). No candidate file bytes pass through Next.js.
- If preparation/DB commit fails and the row remains, moved objects are restored to the original DB paths. Recovery first checks whether commit actually succeeded, so a lost acknowledgement cannot resurrect a deleted application's files. Already absent original objects do not block reference cleanup; permission/network errors do.
- After a committed deletion, quarantine objects are removed. Cleanup failure is reported as a typed error; repeating deletion for the same UUID finishes cleanup even when the row is already gone. The profile error links to the authorized list's `?cleanup=<uuid>` retry control. Interrupted pre-commit deletion also recovers on the next download or deletion attempt. No automatic quarantine reconciliation/cleanup is claimed; persistent Storage failures require an admin retry.

## Candidate PDF
- `GET /api/admin/applications/[id]/pdf?notes=0|1&tz=<IANA>&locale=<locale>` → `requireAdmin()` including AAL2 → load snapshots, answers, attachment metadata and notes only when `notes=1` → render with `@react-pdf/renderer` in Node → private/no-store PDF download with safe ASCII fallback and RFC 5987 UTF-8 filename. Generated on demand, returned as an in-memory binary response, never stored by the application. Query keys, duplicate flags, UUID, locale and timezone are validated.
- Layout: header band with the primary brand's accent colour and logo, candidate name, position, brand(s), department, applied date, status, reference; then sections in order (personal & contact, professional, experience, skills, portfolio links, role-specific answers, attachments list). Footer with generated-at date and page numbers. Notes only when explicitly included.
- **Bengali verification:** the deferred spike passed visual comparison with same-font Chromium HTML in Phase 4, using static Hind Siliguri Regular/Bold for the required conjuncts, vowel placement and mixed text. The renderer is retained. Reproducible spike, sample and visual scripts are in `scripts/`; sample PDFs stay in the approved temporary directory, outside git. Sample inspection caught and fixed header overlap, orphan labels and an invisible dynamic footer caused by repeated numeric line-height scaling in the installed layout engine.
- PDF branding resolves the stored primary-brand name only when it matches exactly one current brand. A renamed/ambiguous historic brand gets its snapshot name and neutral accent instead of another brand's logo. Uploaded logos are read only from the configured public brand-assets bucket; static logos come only from the local brands directory. sharp converts trusted/validated logos to bounded PNGs; SVG markup is never inlined.
- A "Profile + CV" package can be added later (merge with `pdf-lib` when the CV is a PDF, otherwise ZIP).

## Cron (`/api/cron/daily`)
`vercel.json` schedules exactly one daily call at `0 0 * * *` (UTC). The Node handler compares fixed-length SHA-256 digests of the bearer header and configured secret with `timingSafeEqual`, before Storage or database access. It recursively enumerates only the private bucket's `pending/` prefix, including reservation sidecars, then removes objects whose creation and last-update timestamps are both older than 24 hours. Invalid dates and recently touched files are retained conservatively. Listing finishes before batch deletion so offset pagination cannot skip objects. Committed `applications/` and deletion-quarantine objects are not visited. The keep-alive is `select 1`; successful responses contain only scanned/removed object counts, with private/no-store caching. Failures return a generic 503 without provider details. Local behavior is unit-tested; hosted execution remains owner deployment verification.

Storage bootstrap sets a 10 MB ceiling and the supported candidate MIME union plus `application/json` on private `applications`; JSON is required for server-written reservations and is not accepted by candidate upload validation. Public `brand-assets` is limited to 1 MB and SVG/PNG/WebP. Existing visibility mismatches fail rather than being silently changed. The current bootstrap CLI is dev-pinned; launch preparation will add an explicit owner-run allowed-target path for production.

## Security model summary
- Public surface: careers pages, apply page, success page, `POST /api/upload-url`, health, sitemap. Admin surfaces require `requireAdmin()`; `/api/cron/daily` instead requires the exact `CRON_SECRET` bearer header.
- Anti-abuse on public endpoints: Turnstile, honeypot, min fill time, upload-session limits. Add an IP-hash rate limit only if abuse actually appears.
- Security headers are implemented: nosniff, referrer policy, DENY/frame-ancestors, permissions restrictions and enforced document CSP with 128-bit random script nonces. Self, Turnstile and the configured Supabase origins are allowed; fonts are self-hosted. Inline styles remain permitted for existing React/Tailwind branding styles. Unsafe-eval and development WebSocket allowances are development-only, not enabled in production. Flight/action fetches do not replace an existing document's CSP; the client nonce provider retains that document's initial nonce.
- Zod uses its supported interpreter mode before shared client schemas are constructed, avoiding CSP-violating JIT/eval probes. Direct imports retain tree-shaking. Bengali website fonts remain available on demand without unnecessary preload on English-first pages.
- Admin accounts use strong passwords and mandatory MFA. The admin allowlist is separate from Supabase auth users.
- Logs never include applicant data. Auth/read boundaries discard raw provider/DB exceptions rather than logging query parameters; expected action/API errors are generic. Next incoming-request logging is disabled so private name/email URL filters are not printed. Production hosting access-log/query redaction must also be checked during launch.
- Data retention: admin can delete an application together with its files.

## Testing strategy
- Unit: `buildSchema` (each question type, valid + invalid), slug and reference helpers, seed production guard.
- Integration: auth gating (every `/admin` page, action and API route rejects unauthenticated requests), RLS (anon key reads nothing from any table), submit action rejects tampered payloads (wrong job, closed job, unknown question, bad file path).
- E2E (Playwright): browse + filter, apply with files, admin login, review, status change, note, download CV, download PDF.
- CI runs credential-free checks by default. The `DEV_TESTS_ENABLED=true` opt-in push-only job uses dev-pinned secrets for real authorization/RLS/review checks and the full production-mode browser suite, with serialized shared-dev concurrency. Fork PRs do not receive these secrets. GitHub execution is not verified until the owner enables/configures the job.
