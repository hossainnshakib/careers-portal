# 03 — Phase 2: Public careers site and application flow

**Owner checklist before running**
- Phase 1 merged and working; at least a few demo jobs exist in the dev database (`pnpm seed:demo`).
- Turnstile keys are in `.env.local` (Cloudflare's test keys are fine for dev).

---

## PROMPT (paste everything below)

Phase 2 of the Careers Portal: the public careers hub and the application flow. Re-read `AGENTS.md`, `docs/` (especially the filter rules in `PRODUCT.md`, the upload and submit flows in `ARCHITECTURE.md`, and `DESIGN.md`) and `docs/DECISIONS.md`. Write a **plan** first and wait for my "go". After I say go, create branch `phase-2-public-apply` from the merged Phase 1 and build:

1. **Careers home** (`/`): brand logo tiles acting as the brand filter, filter bar (Brand, Department, Employment type visible; Work mode, Sector, Level under "More filters"), search over job titles, active filter chips with "Clear all", counts per option, zero-count options hidden or greyed, job cards, empty state. Server loads all open jobs from the tagged cache; a client component filters in memory and syncs the URL with nuqs using the parameter names in `PRODUCT.md` (`brand`, `dept`, `type`, `mode`, `sector`, `level`, `q`, comma-separated multi-values). The initial HTML must already reflect the URL filters. When exactly one brand is selected via URL, show that brand's logo and description header with "See all brands". Mobile uses a bottom sheet for filters. No group/hierarchy wording about brands anywhere.
2. **Job detail** (`/jobs/[slug]`): brand header, title, badges, sections (About, Responsibilities, Requirements) rendered via the sanitising markdown renderer, Apply button (sticky on mobile). Closed jobs show a clear "no longer accepting applications" state with a link back; draft jobs return 404 to the public. Proper metadata (title, description, Open Graph basics).
3. **Apply page** (`/jobs/[slug]/apply`): generated from the job's non-archived questions. Fixed fields (name, email, phone, location, CV) plus dynamic questions grouped by section. Use `buildSchema` with react-hook-form on the client; the server action re-validates with the same schema. Privacy note near submit. Turnstile widget, honeypot, minimum fill time. Never trust client-sent job or question data.
4. **Uploads**: implement `POST /api/upload-url` and the upload-session token exactly as in `docs/ARCHITECTURE.md` (Turnstile verification, HMAC session token with 2-hour expiry, allowlists, size limits, max 8 files per session, server-chosen `pending/<sessionId>/...` paths, direct-to-Storage upload from the browser). Upload widget UX: progress, file name/size, remove, per-file error messages, retry.
5. **Submit**: `submitApplication` server action exactly as in `docs/ARCHITECTURE.md` (verify Turnstile, job open, validate, verify uploads, generate `applicationId`, move objects to final path, transaction with snapshots, cleanup on failure, unique `reference`). Redirect to `/applied/[reference]` showing the reference and plain next-steps wording.
6. **SEO/utility**: `sitemap.ts` listing open job URLs and the home page, `robots.ts` (allow public pages, disallow `/admin` and `/api`).

**Constraints**: no admin applicant review yet (Phase 3), no email, no accounts, no PDF. Keep the design clean and on-brand per `DESIGN.md`; avoid a generic template look. Bengali input must work in every field. No new dependencies beyond `nuqs`/Turnstile helpers already planned without asking.

**Tests required**: unit tests for the filter logic (OR within a filter, AND across filters, counts); integration tests that `submitApplication` rejects: closed job, draft job, unknown question id, missing required answer, tampered file path (wrong session), wrong MIME/size, expired session token, failed Turnstile; e2e (Playwright) that browses with URL filters, applies with a PDF CV plus a file-upload question, reaches the success page, and verifies the application, answers and attachments rows exist.

**Verification you must run and show**: typecheck, lint, tests, and a short description (with commands) for me to try on my phone via the local network or a Vercel preview. **Report** with the standard sections and stop.
