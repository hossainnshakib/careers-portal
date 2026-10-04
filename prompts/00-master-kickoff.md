# 00 — Master kickoff

**Owner checklist before running**
- Unzip the kit so `AGENTS.md`, `docs/`, `prompts/`, `design/` sit directly inside `G:\career`.
- Open a terminal in `G:\career` and start your coding agent there (Claude Code: `claude`).
- Use a plan/ask mode if your agent has one. This prompt asks for NO code changes.

---

## PROMPT (paste everything below)

You are the lead engineer for the Careers Portal in this folder (`G:\career`). Before doing anything else, read these files completely and in this order:

1. `AGENTS.md`
2. `docs/PRODUCT.md`
3. `docs/ARCHITECTURE.md`
4. `docs/SCHEMA.md`
5. `docs/SEED_DATA.md`
6. `docs/DESIGN.md`
7. Skim `prompts/` to see the planned phases (do not execute any phase yet).
8. Look at `design/logos/` (list the files).

Then check the environment and report the results (read-only commands only): `node -v`, `pnpm -v`, `git --version`, and whether this folder is already a git repository. Confirm your working directory is `G:\career`.

**Do not write application code, install packages, scaffold the app, or change any files in this step.**

Reply with:
1. **Understanding**: the product, the architecture and the scope boundaries, in at most 15 bullets, in your own words. Include the key security rules and what is explicitly out of scope.
2. **Problems in the docs**: contradictions, gaps, risky assumptions, or anything that will be hard on a Windows machine with a free Supabase/Vercel setup. Be concrete and reference the file and section. If you find none, say so.
3. **Assumptions you would make** if I do not answer.
4. **Questions for me**: at most 8, most important first, each with your recommended default.
5. **Work plan**: confirm or propose changes to the phase order in `prompts/` (Phase 0 foundation, 1 admin, 2 public + apply, 3 review, 4 PDF + hardening, 5 launch prep), with the main risk of each phase.
6. **Owner actions you need from me** before Phase 0 can start (accounts, keys, tools), as a short checklist.

Keep the reply focused and skimmable. I will answer your questions, and then I will send the Phase 0 prompt.
