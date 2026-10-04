# 02 — Phase 1: Admin foundation and content management

**Owner checklist before running**
- Phase 0 merged (or at least reviewed) and working locally.
- In the Supabase dashboard (dev project) create your own admin user: Auth → Users → Add user (email + strong password, auto-confirm). Then run `pnpm admin:add you@example.com` after the agent builds that script.

---

## PROMPT (paste everything below)

Phase 1 of the Careers Portal: admin login and content management. Re-read `AGENTS.md`, `docs/` and `docs/DECISIONS.md`. Write a **plan** first and wait for my "go". After I say go, create branch `phase-1-admin` from the merged Phase 0 and build:

1. **Auth**: `/admin/login` (email + password via Supabase Auth, generic error messages, basic brute-force friendliness), logout, `requireAdmin()` exactly as specified in `docs/ARCHITECTURE.md` (uses `getUser()` and the `admin_users` allowlist), `middleware.ts` as a convenience redirect only, and `pnpm admin:add <email>` which looks up the existing Supabase auth user by email and inserts the allowlist row (idempotent). Sign-ups stay disabled.
2. **Admin shell**: protected layout (calls `requireAdmin()`), sidebar/nav (Dashboard placeholder, Applications placeholder, Jobs, Brands, Departments), signed-in email and logout, responsive.
3. **Departments**: list, create, edit, activate/deactivate, reorder (simple up/down is fine).
4. **Brands**: list, create, edit, hide/show, reorder; logo upload to the public `brand-assets` bucket with the validation in `docs/SCHEMA.md` (type, size, SVG sanitising checks); sector, accent colour, description, website.
5. **`buildSchema`**: implement `src/lib/validation/buildSchema.ts` for all ten question types with the `config` options in `docs/SCHEMA.md`. Heavily unit-tested (valid/invalid per type, required vs optional, option membership, number bounds, URL must be http/https, phone formats including `+8801XXXXXXXXX` and `01XXXXXXXXX`).
6. **Jobs**: list (filter by status/department/brand, search), create/edit as ONE page with four blocks: basics (title, auto slug editable until first publish, department, brands multi-select with a primary, employment type, work mode, level, location, deadline, `cv_required`), content (summary with counter, markdown fields for description/responsibilities/requirements with a live preview using the sanitising renderer), **question builder** (add/edit/archive, type, required, help text, options editor for choice types, config for number/text/file, section, reorder), and a **live preview of the candidate form** rendered from the same data with `buildSchema`. Actions: save draft, publish, close, reopen, duplicate job, copy questions from another job. Delete only allowed for drafts with no applications. Enforce slug immutability after first publish in the server action (the DB trigger is the backstop).
7. **Revalidation**: every mutation affecting public data calls `revalidateTag` for the right tags (`jobs`, `job:<slug>`, `brands`, `departments`).
8. **Slug helper** (`src/lib/slug.ts`): ASCII lowercase, `&` and punctuation removed, collisions get `-2`, `-3`; unit tests including the 19 titles in `docs/SEED_DATA.md` producing exactly the listed slugs when given their intended slug (the helper must not silently change the final slugs; they are entered/edited explicitly).

**Constraints**: no public pages yet, no applicant flow, no email. Keep the UI functional and tidy, not fancy. No new dependencies without asking (a drag-and-drop library is NOT needed; use up/down controls).

**Tests required**: unit tests for `buildSchema`, slug and brand-logo validation; integration/e2e tests proving that every `/admin` page and every admin server action/route rejects unauthenticated requests and rejects authenticated users who are not in `admin_users`; an e2e test that logs in, creates a job with questions of every type, publishes it, and sees it in the list.

**Verification you must run and show**: typecheck, lint, tests, and a manual walkthrough description of creating a job end to end. **Report** with the standard sections (done, files, verified, NOT verified, deviations, open questions) and stop.
