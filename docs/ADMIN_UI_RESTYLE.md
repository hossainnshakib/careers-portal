# Admin UI restyle (mockup-driven)

Goal: replace the admin presentation layer with the design in
`design/mockup/careers-admin-mockups/` (all 14 boards share one `<helmet>` CSS,
sha256 `8e569735…`, which is the token/component source).

Business logic, routes, auth/MFA, server actions, validation and data access stay
as they are. Only presentation changes, plus additive read-only query columns
that the mockup tables need.

## Where the design lives

- `src/app/admin/admin.css` — `.admin-ui` token block + `admin-*` component
  classes (ported from the mockup helmet). Imported by `src/app/admin/layout.tsx`,
  which also imports the Plus Jakarta Sans / Hind Siliguri fontsource faces the
  public site already ships (no new dependency).
- Admin markup uses `admin-*` classes only. Tailwind text/size/border utilities
  are globally remapped by `@theme inline` in `globals.css` (for example
  `text-sm` is 1rem and `font-medium` is 700), so they cannot express the
  mockup tokens faithfully.
- Public site markup, tokens and `.public-ui` rules are untouched.

## Route → board map

| Route | Board |
| --- | --- |
| `/admin` | Main |
| `/admin/applications` | Applications + States (chips, empty state, pagination) |
| `/admin/applications/[id]` | Applicant + MobileApplicant |
| `/admin/jobs`, `/admin/jobs/new`, `/admin/jobs/[id]/edit` | Jobs + JobEditor |
| `/admin/brands` | Brands |
| `/admin/departments`, `/admin/options` | Settings (split across the two existing routes) |
| `/admin/login`, `/admin/mfa` | Login |
| shell | MobileMenu (top bar + slide-over below 800px) |

## Kept from the existing UI (test or security contracts)

- Every accessible name asserted by `tests/e2e/*` (labels, roles, headings,
  regions, dialog names, exact button texts).
- Live sanitised Markdown preview beside each editor (asserted by
  `job-editor.spec.ts`), so the mockup Write/Preview toggle is not used.
- `Add question` appends an editable question card immediately (asserted by
  `question-builder.spec.ts`), so the mockup "Add question" dialog is not used.
- `Publish job` acts immediately (specs assert the URL/status change on click),
  so the mockup publish dialog is not used.

## Reasonable decisions (no owner question asked)

1. Brands keeps row/cell semantics (tests) but is laid out as the mockup card
   grid: explicit `role="table"/"rowgroup"/"row"/"cell"` on divs.
2. MFA code entry uses six digit cells; cell 1 carries
   `aria-label="Authenticator code"` and the shared `fill()` distributes digits,
   so `mfa.spec.ts` and `tests/support/mfa-login.ts` keep working unchanged.
3. Toolbar search is `aria-label="Search applications"` (unique on every admin
   page, so it cannot collide with the filter labels `Search` / `Search name/email`)
   and really navigates to `/admin/applications?q=…`.
4. Additive read-only query columns for mockup data: job salary/updated/apps
   count, department job count, brand `logoUrl` in list marks, open roles per
   department for the dashboard. No behaviour, security or write path changes.
5. Tables become card stacks below 800px with explicit ARIA roles preserved, so
   the a11y tree stays correct at mobile widths.
6. Applicant header: the toolbar holds the single `<h1>` with the candidate
   name; the mockup's duplicate name inside the header card is dropped.

## Functional differences from the static boards

- All counts, dates, brands, questions and profile sections come from actual
  database rows; the boards' sample totals and names are not copied.
  The list board's sample "Applied before" pill is not added: existing list
  projections have no repeat-applicant flag. Real previous applications remain
  available on the applicant profile; no inference from names is made.
- Application filters retain every existing field, explicit submit button,
  inclusive From/To dates and timezone explanation. Removing a chip preserves
  the timezone of the remaining date filters.
- Settings remains two pages. Full create/edit forms retain slug, status and
  other supported fields rather than the boards' abbreviated add rows. Brand
  descriptions keep the validated 3000-character limit, not the mock's 280.
- Reorder, Edit, activation and upload actions remain explicit working buttons.
  The logo picker supports file selection and dropping one file into its native
  input; the existing multipart action and server SVG/MIME/size validation are
  unchanged.
- Question cards expose their full type-specific configuration, and explicit
  move buttons replace an inert drag handle. Standard questions remain the
  existing seven-definition shared constant.
- PDF note inclusion, consent time, Update status, password re-verification,
  setup key and recovery instructions remain visible. Login keeps the tested
  "Admin sign in" heading. The first MFA cell accepts a complete autofilled
  code as well as single digits; all six visible cells show one digit each.
- Job empty state keeps one Clear filters link in the filter form, not a second
  duplicate link. Mobile toolbar search is hidden to follow the Mobile boards;
  the Jobs page retains New job, while application search stays visible above
  the collapsible filters. Mobile tables omit their outer desktop glass wrapper.
- Status/kicker blue and green text are slightly darker for small-text contrast.
  Brand-initial fallback text uses the tested readable black/white helper.
- Mobile menu adds an explicit close control, focus containment, Escape focus
  restoration and inert background content. No new navigation route is added.
  The supplied shared helmet makes `.sb` row-wrapped and hides its footer at
  390px, even on the dedicated MobileMenu board; the implementation deliberately
  keeps a readable vertical slide-over and the working Sign out footer instead.

## Cleanup

- Removed `src/components/brand-dot.tsx` and `src/components/brand-logo.tsx`
  after confirming zero remaining imports. Public `PublicBrandLogo` is kept.
- Removed the old Tailwind admin presentation from pages/managers, including
  loading/error states. Public markup and `globals.css` remain unchanged.

## Verification

- `pnpm typecheck && pnpm lint && pnpm test`
- `pnpm build` and production e2e (`PLAYWRIGHT_PRODUCTION=1`)
- Screenshots of every admin route at 1440px and 390px, compared with the
  matching boards.
- Actual results, the serial live-test rerun and remaining verification limits
  are recorded in `UI_VERIFICATION.md` (the admin section, not the historical
  public report). Screenshots are outside the repository and include synthetic
  DEV fixtures; no applicant exports, MFA setup keys or credentials are staged.

## Remaining visual difference

The static list's "Applied before" badge is intentionally omitted as noted
above. Forms retain their complete working fields and therefore differ in
height/density from the abbreviated boards. These differences are not claims
of identical-data pixel parity. No existing admin workflow is intentionally
left unimplemented.
