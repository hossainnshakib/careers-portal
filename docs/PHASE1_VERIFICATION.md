# Phase 1 verification — 2026-10-06

## Results
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: 19 files / 175 tests passed; 5 opt-in live files / 55 cases skipped in the credential-free default run.
- Explicit live auth/surface/RLS/job run: 4 files / 54 passed, none skipped.
- Separate guarded seed-upgrade run: 1 passed; seeding twice preserved all existing application/answer fingerprints and was idempotent. Do not run this fingerprint check concurrently with application-writing tests.
- `pnpm test:e2e`: all 9 Chromium tests passed using one worker (approximately 2 minutes). Test accounts/data/assets were dev-pinned and removed by teardown; no owner credentials were used.

## Prompt acceptance matrix
| Requirement in `prompts/02-phase1-admin.md` | Verification |
|---|---|
| Auth/login/logout/admin:add | `requireAdmin.test.ts`, `admin-add.test.ts`, login `actions.test.ts`; real `requireAdmin.live.test.ts` and `surfaces.live.test.ts`; browser `admin-gating.spec.ts` and department login/logout flow |
| Responsive protected shell/email/logout | `admin-pages.test.ts` tests layout independently; `admin-shell.spec.ts`, signed-in catalog/editor browser flows |
| Departments create/edit/activation/reorder | department action validation/denial/cache tests and `departments.spec.ts` (rename, deactivate, up/down) |
| Brands fields/hide/reorder/logo validation | brand action tests, `brand-logo.test.ts`, `brands.spec.ts` (all fields, up/down, reject active SVG, upload/display passive SVG as IMG, edit/hide) |
| Eleven-type buildSchema/date migration/config | `definition.test.ts`, 36 `buildSchema.test.ts` cases, new applied 0002 enum migration; leap/invalid dates, inclusive/fixed-clock UTC today, Other, bounds, phone/http(s), required/optional; opaque file tokens require Phase 2 Storage authorization |
| One-page job basics/content/editor | `job-editor.spec.ts` authors safe Markdown, saves/publishes, verifies locked slug, closes/reopens, duplicates/deletes and sees list; all basics persist through strict JobInput/actions |
| Question builder/shared preview | `question-builder.spec.ts` saves all eleven types, radio/dropdown Other, mixed multiple-choice Other, blank Other rejection, UTC date rejection/acceptance, Bengali text and preview file selection |
| Seven standards/independent copies | `defaults.test.ts`; same browser test adds all seven, edits a copy, fills required standards, publishes and finds the open job |
| Job lifecycle/question ownership/archive rules | `job-policy.test.ts`, job action tests, actual transactional `jobs.live.test.ts`: immutable slug, first publication timestamp, close/reopen, independent duplicate, cross-job ID rejection/rollback, archive with applications/restoration denial |
| Demo extension preserves edits/snapshots | `question-upgrade.test.ts`, fresh-template `questions.test.ts`, actual `upgrade.live.test.ts`; 269 total questions after conservative upgrade including 57 archived legacy definitions, 30 applications preserved |
| Cache revalidation | department/brand/job action tests verify own tags, jobs, affected detail slugs and admin paths; job lifecycle parameterized tests cover close/reopen/duplicate/delete and old/new slug tags |
| ASCII slug/collisions/final 19 slugs | `slug.test.ts`: punctuation/ampersands, ASCII, collision suffixes and exact intended slugs for every seeded title |
| Every admin page/action/handler denies both identities | discovery `surface-coverage.test.ts`, direct page/action tests, 35 real Auth/allowlist surface checks; `admin-gating.spec.ts` visits all 7 protected pages over HTTP as anonymous/non-admin. There are no Phase 1 admin API handlers; discovery fails if one is added without coverage. Public login verifies authorization after password authentication. |

## End-to-end authoring walkthrough
This sequence is exercised by browser automation (`job-editor.spec.ts` and `question-builder.spec.ts`); it is also the owner walkthrough. It was not a separate human visual sign-off.
1. Add your existing dev Auth user using `pnpm admin:add <email>`. Run `pnpm dev`; open `http://localhost:3000/admin/login` and sign in.
2. Open Jobs → Create job. Enter title and confirm/edit the ASCII slug. Choose department, one or more brands and one primary. Set employment/work mode, optional level/location/deadline and CV requirement.
3. Write a summary (counter capped at 200), description/responsibilities/requirements in Markdown; check the live sanitized previews. Raw HTML is discarded.
4. Add standard questions. Edit the copies, then add role-specific questions. Choice options use one `value | label` per line. Configure radio/dropdown/Other, bounds, file extensions/size, section and required status. Use up/down controls; copy another job's active questions if needed.
5. Fill local candidate preview contacts/answers. Check blank Other, invalid dates and valid answers. Files remain local; no application is submitted.
6. Save draft, then publish. The edit page shows a read-only slug. Check the open job in Jobs using status/brand/department/search filters.
7. Close and reopen without changing the URL. Duplicate into an independent draft; edit/remove its questions and delete the draft if it has no applications. Jobs with applications archive removed questions; old answer snapshots remain intact.

## Deviations and unverified items
- Native accessible controls/Tailwind are used rather than adding react-hook-form/nuqs/shadcn support packages solely for this small editor. URL state uses native GET filters. The only added direct dependencies are the approved Markdown renderer and sanitizer.
- UTC is the explicit date-only today convention; deadlines display/input in the viewer's local timezone.
- Old replaced non-sensitive logos are retained to protect cached URLs; failed uploads and test assets are cleaned up.
- No production build/deployment or production database behavior was verified. Supabase dashboard signup settings were not independently inspected (owner checklist supplied as complete).
- Bengali browser text was exercised; Bengali PDF shaping remains unverified and must be tested before Phase 4. Candidate submit/upload/review/PDF flows belong to later phases and were not verified here.
- Responsive classes and accessible controls are present; no separate human visual review on physical mobile devices or assistive technology was performed.

## Owner commands
```powershell
pnpm install --frozen-lockfile
pnpm admin:add <email>
pnpm dev
```
Replace `<email>` with the existing Auth user's email. Migration 0002 and conservative demo upgrade are already applied on this pinned dev project; do not edit applied migrations. For another fresh dev checkout/database, follow DEV_SETUP migration/storage/seed commands under the dev guard.
