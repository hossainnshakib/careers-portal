# Prompt 13 - authorized shared-DEV DEMO validation

## Authorization and target

The owner approved the existing DEV project `xmtoccukridshadnxrlc` and temporary
public DEMO visibility at https://careers-portal-sigma.vercel.app. This supersedes
the earlier separate-project requirement in `DEMO_VALIDATION_STATUS.md`.
There is no production authorization, new database/project, migration or policy
change. Candidates/files in agent-driven testing are synthetic only.

The command checks `APP_ENV=development`, the independent DEV project pin, the
Supabase API origin and **both** DB connection targets (`/postgres`) before I/O,
then independently requires the owner-approved reference. The live login CSP
names the same API origin; all five newly seeded Apply slugs were independently
read from the deployment with HTTP 200 and the disclaimer. This is evidence of
the shared dataset, not direct access to Vercel's private connection settings.

Every seeded title and summary contains **DEMO / TEST ONLY — Not a real job
opening**. The description repeats it and the exact ownership marker
`Validation dataset: prompt-13-demo-v1.`. Keeping the warning in data makes it
visible even on the existing deployed app before this branch's UI is deployed.
This branch additionally renders a high-contrast notice on role cards, featured
cards, Job and Apply pages; demo detail metadata is noindex and has no JobPosting
JSON-LD, and the sitemap excludes demo and ephemeral E2E jobs. Those code-level
SEO safeguards are not claimed live until the branch is deployed.

## Exactly five roles

Titles also contain the complete disclaimer; the short labels below are not
real vacancies or offers. Primary brand is first. All brand/department/option
rows are looked up, never seeded or modified by these commands.

| Slug | Fictional role / department | Brands | Options | Salary / vacancies / CV |
|---|---|---|---|---|
| `demo-platform-developer` | Platform Developer / Web Development & Technical | Fixen Media, Accoraze | Work from home; Full-time; Mid-level | Sample BDT 45,000–65,000/month; 1; required |
| `demo-visual-designer` | Visual Designer / Design & Creative | Doshok, Avagata | Hybrid; Freelance; Entry-level | Negotiable (fictional); 2; required |
| `demo-video-producer` | Video Producer / Video Editing, Motion & Production | Builtale, Ghora Fera | On-site; Project-based, Duration-based; Senior | Sample BDT 70,000–90,000/project; 3; required |
| `demo-bengali-editor` | Bengali Editor / Content & Copywriting | Wiki Bangla | Work from home; Part-time; Entry-level | Negotiable (fictional); 4; optional |
| `demo-campaign-coordinator` | Campaign Coordinator / Marketing & Social Media | Mactie, Fixen Media | Hybrid; Internship; Fresher welcome | Sample BDT 12,000–18,000/month; 5; required |

Across five jobs: all eight existing brands and all 13 existing options. Five
single-department jobs cannot span six departments: Presentation & Production
Operations remains preserved, not artificially linked through unsupported data.
Each job has distinct sample duties, requirements, skills, experience text,
engagement note, location, nice-to-have and three benefits explicitly marked
“not an offer”. All editable supported fields are populated where representable;
negotiable salary correctly has no range text. Deadline is the deterministic
fictional horizon `2099-12-31T17:59:00Z`, not a soon-expiring real hiring deadline.

## Question coverage (52 questions)

Every job independently copies all seven standard questions with stable IDs:
LinkedIn, portfolio URL, years of experience, current role/company, earliest
joining date, expected salary and motivation. IDs are deterministic per slug and
label, preserving references on reruns.

| Role | Total | Additional questions/configuration |
|---|---:|---|
| Platform | 15 | Radio + dropdown, both Other-enabled; multi-choice min 1/max 2 + Other; yes/no; email; phone; required PDF/PNG upload max 2 MB; fractional number min 0.5/max 40 |
| Design | 10 | Required short text min 5/max 120; optional JPG/WebP upload max 3 MB; long text min 10/max 800 |
| Video | 9 | Optional ZIP upload max 5 MB; required date min today/max 2099-12-31 |
| Bengali | 9 | Required Bengali long text min 10/max 1000; date min 2000-01-01/max today |
| Campaign | 9 | Optional multi-choice min 0/max 3, Other disabled; dropdown, Other disabled |

All 11 types are present across the dataset (and on Platform alone): short/long
text, single/multiple choice, yes/no, number, URL, email, phone, date, file upload.
All five sections and required/optional combinations are present. Both integer
and fractional numbers, radio/dropdown, Other true/false, text limits, selection
limits, absolute/relative date bounds, accept lists and upload size limits are
represented using the actual definition schema. No invented question options.
The global 8-file cap and server MIME/signature/size checks remain unchanged;
CV supports PDF/DOC/DOCX while questions cover PDF/PNG/JPG/WebP/ZIP only.

## Safe repeatable commands (PowerShell)

Run in `G:\career-mr` with the privately configured `.env.local`. Never print it.
Each command defaults to **dry-run**. No generic `seed:demo`/reset/wipe/import is
needed or authorized for this task.

```powershell
pnpm demo:seed
pnpm demo:seed --write --confirm=xmtoccukridshadnxrlc
pnpm demo:seed

pnpm demo:publish
pnpm demo:publish --write --confirm=xmtoccukridshadnxrlc
pnpm demo:publish

pnpm db:counts
pnpm demo:cleanup
# Only after confirming the dry-run reports zero applications:
pnpm demo:cleanup --write --confirm=xmtoccukridshadnxrlc
pnpm demo:cleanup
```

Stop on a nonzero exit (`if ($LASTEXITCODE -ne 0) { throw 'Command refused.' }`).
Seed creates drafts through `jobInput`/`saveJob`, never opens real jobs, and never
silently updates or reopens published/closed demos. Draft reruns compare full
content and retain stable question IDs. Saves check the previously read version
under the row lock so a concurrent edit causes refusal rather than overwrite.
Writes are transactional per job, not one atomic five-job batch; a failed seed
can safely be inspected and repeated. Publish requires all five seeded drafts;
already-open jobs are no-ops and closed jobs require deliberate admin controls.
No owner-content import or mass-publish feature was added.

Cleanup requires **exact five-slug membership, DEMO title/disclaimer and dataset
marker**, not `demo-%` or a broad wildcard. An unrelated collision causes refusal.
It reports only project/operation/counts, never candidate data. Any application,
including synthetic, blocks the entire cleanup with nonzero exit and zero
deletions. Do not bypass this by deleting application rows in SQL. Review and
delete only identified synthetic applications through the existing authorized
admin deletion workflow (which cleans private files), then repeat the dry-run.
If an unknown/real application appears, stop for owner review instead.

Under the lifecycle advisory lock and row locks, cleanup reloads ownership and
checks applications again immediately before deleting. The restrictive FK is a
concurrent-apply backstop. Brands, option links and questions cascade; jobs with
zero applications own no submitted files. No structural records or unrelated
jobs/applications are eligible. Cleanup never touches Storage or Auth directly.
CLI writes cannot call Next.js cache invalidation: allow up to 300 seconds for
each deployment's catalog cache to refresh. Do not infer cleanup/live state from
an immediately cached home page; Apply reloads visibility directly.

## Verification commands and limits

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
$env:PLAYWRIGHT_PRODUCTION = '1'
pnpm test:e2e
Remove-Item Env:PLAYWRIGHT_PRODUCTION
```

The production-mode server runs locally on port 3100 against the approved shared
DEV services, not an isolated project. Browser accounts, jobs and files created
by existing tests use their own strictly validated ephemeral E2E namespaces and
are synthetic; they are separate from the five persistent demo roles. The new
DEMO application test resolves its own application through authorized admin
deletion and verifies that cleanup refuses while it exists. Any failed run that
leaves an application must be resolved through that same safe flow.

Full runtime totals, any failures, cleanup execution and final live read-only
checks are recorded in the completion report and DECISIONS checkpoint. Do not
interpret earlier partial-delivery totals as current full acceptance.
