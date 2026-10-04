# 04 — Phase 3: Applications dashboard and review

**Owner checklist before running**
- Phase 2 merged. The dev database has demo applicants (`pnpm seed:demo`) including Bengali names.

---

## PROMPT (paste everything below)

Phase 3 of the Careers Portal: the admin review side. Re-read `AGENTS.md`, `docs/` and `docs/DECISIONS.md`. Write a **plan** first and wait for my "go". After I say go, create branch `phase-3-review` from the merged Phase 2 and build:

1. **Dashboard** (`/admin`): count cards for Total, New, Under review, Shortlisted, Rejected, Hired. Each card links to the applications list pre-filtered by that status. Also show the latest 10 applications.
2. **Applications list** (`/admin/applications`): server-rendered table with filters for brand, department, job, status, date range, and search by name/email (case-insensitive, Bengali-safe). All filter state in the URL (bookmarkable). Server-side pagination and sorting (default newest first). Clear status badges, a visible "New" indicator, and fast row click-through. Empty and loading states.
3. **Applicant profile** (`/admin/applications/[id]`): header (name, applied position, brand(s), applied date, status, reference), sections built from `section_snapshot` (personal & contact, professional, experience, skills, portfolio, role-specific answers), links rendered safely (`rel="noopener noreferrer nofollow"`, http/https only), attachments list, "previous applications from this email" flag with links. Desktop: two columns (main left; sidebar with status control, notes, downloads). Bengali text must render correctly.
4. **Status management**: a status dropdown that updates `status`, `status_changed_at`, and writes an `application_status_events` row (who, from, to, when). Show the history.
5. **Internal notes**: add notes (author email snapshot, timestamp), list newest first, delete own notes. Notes are never shown to candidates and are excluded from the PDF by default.
6. **Downloads**: `GET /api/admin/attachments/[id]` with `requireAdmin()` and a short-lived signed URL redirect with the original filename; download buttons for the CV and each attachment.
7. **Delete application**: admin can delete an application together with its files in Storage (confirmation dialog; transaction + storage cleanup; if storage deletion fails, report it and do not leave dangling DB references).

**Constraints**: no PDF in this phase (Phase 4), no bulk actions, no CSV export, no emails, no new roles/permissions. Keep queries efficient (indexes from `SCHEMA.md`); avoid N+1 queries.

**Tests required**: auth-gating tests for the new pages, actions and API routes; integration tests for status change (event row written), note creation/deletion, attachment download authorisation (non-admin gets nothing, admin gets a redirect to a signed URL), delete application removes files; e2e: log in, filter by brand and status, open a profile, change status, add a note, download the CV.

**Verification you must run and show**: typecheck, lint, tests, plus a walkthrough list of what to click. **Report** with the standard sections and stop.
