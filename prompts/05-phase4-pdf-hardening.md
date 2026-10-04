# 05 — Phase 4: Candidate PDF and hardening

**Owner checklist before running**
- Phase 3 merged. You have confirmed (from the Phase 0 spike) whether Bengali renders correctly with `@react-pdf/renderer`; the result and decision are in `docs/DECISIONS.md`. If Bengali failed, the agent will use the Chromium-based approach described in `ARCHITECTURE.md`.

---

## PROMPT (paste everything below)

Phase 4 of the Careers Portal: the Candidate Profile PDF and security hardening. Re-read `AGENTS.md`, `docs/` and `docs/DECISIONS.md`. Write a **plan** first and wait for my "go". After I say go, create branch `phase-4-pdf-hardening` from the merged Phase 3 and build:

**A. Candidate Profile PDF**
1. `GET /api/admin/applications/[id]/pdf?notes=0|1` per `docs/ARCHITECTURE.md`: `requireAdmin()`, Node runtime, generated on demand, good filename (`<reference>-<name>.pdf`), notes excluded unless `notes=1`. Add "Download Profile PDF" (and an "include notes" toggle) to the applicant profile sidebar.
2. Layout: header band in the primary brand's accent colour with its logo, candidate name, position, brand(s), department, applied date, status, reference; sections in the same order as the profile page; attachments listed by filename (not embedded); footer with generated date and page numbers. Professional, restrained, printable in black and white.
3. Must render Bengali names and answers correctly. Long answers must paginate cleanly; very long URLs must not overflow.
4. Test with the demo applicants (English, Bengali, very long answers, many answers). Report page count and any visual problems you find; I will review a few PDFs by eye.

**B. Hardening**
5. **Security headers** in `next.config`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame protection, and a CSP allowing only what is required (self, Turnstile, Supabase API/storage origins, fonts self-hosted). Test the apply flow and admin under the CSP; start with report-only if needed, then enforce.
6. **Admin MFA**: TOTP enrolment and challenge using Supabase Auth MFA. Provide an owner-friendly enrolment page. Decide with me (ask) whether to enforce MFA for all admins.
7. **Upload validation**: on submit, verify uploaded file signatures (magic bytes for PDF/DOC/DOCX/PNG/JPG/WEBP/ZIP) against the declared MIME type by reading only the first bytes from Storage.
8. **RLS verification test**: with the public anon key, every table returns nothing/denied. Add to CI.
9. **Abuse checks**: confirm Turnstile, honeypot, min fill time and upload-session limits work; add a lightweight IP-hash rate limit only if you can show a concrete need.
10. **Logging**: audit the codebase for PII in logs and error messages; fix.
11. **Dependency audit**: run `pnpm audit`, report findings, fix or explain.
12. **Accessibility and performance pass**: keyboard navigation and labels on the apply form and admin tables; Lighthouse on home, job detail, apply (mobile); fix the clear wins.
13. **Full e2e suite** in CI: browse + filter, apply with files, admin login, review, status change, note, CV download, PDF download.

**Constraints**: no new product features. Do not weaken any rule in `AGENTS.md`.

**Verification you must run and show**: typecheck, lint, all tests, a list of PDFs generated for the demo applicants and what each tested, Lighthouse numbers, the audit output. **Report** with the standard sections and stop.
