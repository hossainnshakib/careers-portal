# SEED DATA — Careers Portal

Two seed commands, both idempotent (upsert by slug):
- `pnpm seed:base` — departments + brands only. Safe for production.
- `pnpm seed:demo` — base + 19 jobs with demo content, demo questions, and demo applicants. **DEV ONLY**: must refuse to run when `APP_ENV=production` or when the database URL does not match the dev project; include a test for this guard. `pnpm db:reset:dev` drops, migrates and runs `seed:demo`, with the same guard.

Real job content (descriptions, requirements, questions, brand assignment, employment type) is entered later through the admin panel. The 19 titles, slugs and departments below are FINAL; do not change them.

## Departments (final; `sort_order` = number)
| # | Name | Slug |
|---|---|---|
| 1 | Web Development & Technical | `web-technical` |
| 2 | Design & Creative | `design-creative` |
| 3 | Video Editing, Motion & Production | `video-motion-production` |
| 4 | Content & Copywriting | `content-copywriting` |
| 5 | Marketing & Social Media | `marketing-social` |
| 6 | Presentation & Production Operations | `presentation-production-operations` |

## Jobs (final titles and slugs; `sort_order` = #)
| # | Title | Slug | Dept # |
|---|---|---|---|
| 1 | Web Developer | `web-developer` | 1 |
| 2 | WordPress Developer & Analyst | `wordpress-developer-analyst` | 1 |
| 3 | UI/UX Designer | `ui-ux-designer` | 1 |
| 4 | Web & Backend Security Analyst | `web-backend-security-analyst` | 1 |
| 5 | Brand Identity & Logo Designer | `brand-identity-logo-designer` | 2 |
| 6 | Advertising & Social Media Creative Designer | `ad-social-creative-designer` | 2 |
| 7 | Visual Communication Designer | `visual-communication-designer` | 2 |
| 8 | Commercial & Documentary Video Editor | `commercial-documentary-video-editor` | 3 |
| 9 | Short-Form & Social Media Video Editor | `short-form-video-editor` | 3 |
| 10 | Motion Graphics & Animation Artist | `motion-graphics-animation-artist` | 3 |
| 11 | Cinematographer | `cinematographer` | 3 |
| 12 | Product & Commercial Photographer | `product-commercial-photographer` | 3 |
| 13 | Creative Director & Production Lead | `creative-director-production-lead` | 3 |
| 14 | Script & Creative Content Writer | `script-creative-content-writer` | 4 |
| 15 | SEO, Website & Brand Content Writer | `seo-brand-content-writer` | 4 |
| 16 | Social Media & Community Manager | `social-media-community-manager` | 5 |
| 17 | Performance Marketing Specialist | `performance-marketing-specialist` | 5 |
| 18 | On-Camera Presenter & Content Host | `on-camera-presenter-host` | 6 |
| 19 | Production Coordinator | `production-coordinator` | 6 |

Poster "focus areas" (the sub-lists under each role on the posters) are NOT structure. They will become part of each job's description later. Ignore them for now.

## Brands (logos already in `design/logos/<slug>.svg`; copy to `public/brands/`)
Values marked **TBD** are placeholders the owner will confirm; they must be easy to edit in the admin panel. `description` placeholders come from the taglines inside the logos where available.

| Name | Slug | Sector | Accent | Website | Description (placeholder) |
|---|---|---|---|---|---|
| Fixen Media | `fixen-media` | creative_agency | `#EC1C24` | fixenmedia.com | TBD |
| Builtale | `builtale` | real_estate | `#565439` | (none yet) | TBD |
| Doshok | `doshok` | fashion | `#FE5C36` | doshok.com | TBD |
| Accoraze | `accoraze` | saas | `#1B2F6E` | TBD | Run your business, smarter. |
| Wiki Bangla | `wiki-bangla` | media | `#0AA278` | wikibangla.org | Connecting the world to Bangladesh |
| Ghora Fera | `ghora-fera` | other (TBD) | `#FE5C36` (TBD) | ghorafera.com | TBD |
| Mactie | `mactie` | other (TBD) | `#1E1E1E` | TBD | Smart. Sleek. Synced. |
| Avagata | `avagata` | other (TBD) | `#213F6E` | TBD | Affordable Elegance |

`sort_order` follows the table order. Never write group/hierarchy wording in descriptions.

## Standard questions (Phase 1)
Define this set as a constant in `src/lib/questions/defaults.ts`; do not create a DB table. The question builder's **"Add standard questions"** button copies the definitions into a job as ordinary editable questions with their own IDs. The copies follow the same edit/order/archive rules as all other questions; they are not live-linked to the constant.

| Label | Type | Required | Section | Config |
|---|---|---|---|---|
| LinkedIn profile | `url` | No | `professional` | — |
| Portfolio or website | `url` | No | `portfolio` | — |
| Years of relevant experience | `number` | Yes | `experience` | `{ integer: true, min: 0, max: 50 }` |
| Current or most recent job title and company | `short_text` | No | `experience` | — |
| Earliest date you can join | `date` | No | `professional` | `{ min: "today" }` |
| Expected monthly salary (BDT) | `number` | No | `professional` | — |
| Why do you want to work with us? | `long_text` | Yes | `professional` | `{ maxLength: 1500 }` |

Do not ask for age, religion, marital status, or photos. Demo jobs must include this set plus role-specific questions after the new `date` migration is applied in Phase 1. This docs-only decision does not change the already-applied Phase 0 schema or its existing demo seed.

## Demo jobs (for `seed:demo` only)
Use the real 19 titles/slugs above but assign DEMO values chosen to exercise every feature. Mark nothing in the UI as "demo" (the database is dev-only), but make the text obviously placeholder-ish (for example "Demo description for ...").
- Status mix: 16 `open`, 2 `draft`, 1 `closed`.
- Employment types: at least 3 `part_time`, 2 `freelance`, 1 `internship`, 1 `contract`, the rest `full_time`.
- Work modes: mix of `onsite`, `remote`, `hybrid`.
- Brands: spread across all 8 brands; at least 3 jobs belong to 2+ brands (one primary each); at least one brand has no open jobs (tests the empty state/hidden option).
- Levels: set `experience_level` on about half; `creative-director-production-lead` is `senior`.
- Content: summary (≤ 200 chars), markdown description with a list, responsibilities, requirements. Include a few markdown edge cases (links, bold, a list) and one attempted raw HTML snippet to prove it is NOT rendered.
- Questions (Phase 1 onward): the seven standard questions above plus 4–8 role-specific questions per job from sensible templates per department (for example Web: GitHub URL, best live projects (long text), React/Next.js experience (single choice)). `web-developer` must exercise ALL eleven question types overall, required and optional mixed, including a file_upload question. Each question has a section. Include radio/dropdown choice presentation and "Other" examples across the demo jobs.
- Existing Phase 0 demo questions are upgraded only when the job timestamps and every deterministic question field still match the original seed. Three overlapping legacy questions are archived, never removed from historical answers; standard copies and a role question are inserted, and unchanged choice configs are extended. Edited or already-upgraded jobs are preserved. A fresh Phase 1 seed has 212 active questions; an untouched upgraded Phase 0 database has 269 total questions including 57 archived legacy definitions.

## Demo applicants (for `seed:demo` only)
- About 30 applications across open and closed jobs, spread over several weeks, statuses covering all five values.
- At least 6 Bengali names and 2 Bengali long-text answers (include conjunct-heavy words such as ক্ষ, স্ত্র, দ্ব, ঞ্জ, শ্রী); the rest English.
- A few emails repeated across jobs (to test the "previous applications" flag).
- Each has a tiny generated placeholder PDF as its CV in the private bucket (generate on the fly; do not commit binary files), and a few have a second attachment.
- Some admin notes and status events.

## Real data later
When the owner moves to real data: run `seed:base` on production, then create the 19 jobs through the admin panel (or a one-off script that creates them as `draft` shells with the final titles/slugs/departments and no demo content). Keep slugs exactly as above.
