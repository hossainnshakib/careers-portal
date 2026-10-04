# 06 — Phase 5: Launch preparation

**Owner checklist before running**
- Phase 4 merged and reviewed.
- Decide the brand details still marked TBD in `docs/SEED_DATA.md` (sectors for Ghora Fera, Mactie, Avagata; descriptions; websites) and tell the agent.
- You will do these yourself (the agent writes the runbook, you execute): create the production Supabase project (Singapore), create the Vercel production project from the repo, set production environment variables, run production migrations, create the production admin user, add the `careers` CNAME in the DNS zone.

---

## PROMPT (paste everything below)

Phase 5 of the Careers Portal: launch preparation. Re-read `AGENTS.md`, `docs/` and `docs/DECISIONS.md`. Write a **plan** first and wait for my "go". After I say go, create branch `phase-5-launch-prep` from the merged Phase 4. You never receive production credentials: you prepare code, scripts and documentation, and I run the production steps.

1. **`docs/RUNBOOK.md`** (clear, step by step, for a non-expert owner on Windows): creating the production Supabase project and buckets; environment variables for Vercel (which are secret, which are public); running production migrations manually; `seed:base` on production; creating the first production admin user and `pnpm admin:add`; Turnstile production keys; adding the custom domain `careers.fixenmedia.com` (CNAME in the existing DNS zone; do not change nameservers; do not use cPanel's Subdomains tool; how to check DNS; certificate expectations); smoke-test checklist after deploy; rollback notes.
2. **Cron**: `vercel.json` with ONE daily schedule calling `/api/cron/daily`, protected by `CRON_SECRET`, doing stale-upload cleanup plus a trivial DB keep-alive. Test the auth on the route. Document that Vercel Hobby cron frequency is limited and what to change on a paid plan.
3. **Backups**: document a simple manual database + Storage export routine for the free Supabase plan (frequency, where to keep it, how to restore), using tools that exist on Windows (Supabase CLI or dashboard). Add a reminder in the runbook.
4. **Plan awareness**: document in the runbook that the free tiers have limits (Supabase pausing after inactivity and no automatic backups; Vercel Hobby is intended for non-commercial use) and what to upgrade first if the portal becomes business-critical.
5. **Real-data switch**: provide a one-off script `pnpm jobs:seed-shells` that creates the 19 jobs as `draft` shells with the final titles, slugs and departments (no demo content, no applicants) for production, with a guard so it never runs against the dev project by mistake and never overwrites existing jobs. Document the order: `seed:base` → `jobs:seed-shells` → fill each job in the admin panel (brands, type, mode, content, questions) → publish.
6. **Link kit**: `docs/BRAND_LINKS.md` with the exact link patterns per brand (`/?brand=<slug>`), per-stack snippets (WordPress menu item or footer link, Next.js footer link, Laravel footer link or `/careers` redirect, SaaS site footer link), and UTM conventions (`utm_source=website|poster|social&utm_campaign=...`).
7. **Poster links**: `pnpm links:generate` that reads jobs from the database and writes a CSV (job title, department, brand slugs, public URL with UTM for poster use) and, if I approve one small QR dependency, QR PNGs per job into an `exports/` folder (git-ignored).
8. **Final review**: run through `AGENTS.md` security rules and report any rule not fully met. Update `docs/*` so they match the final code. List known limitations (no antivirus scan, no email notifications, free-tier caveats).

**Constraints**: no new product features. No production credentials in the repo or in chat.

**Verification you must run and show**: typecheck, lint, all tests, `pnpm build` success, the cron route auth test, the shell-seed guard test. **Report** with the standard sections and stop.
