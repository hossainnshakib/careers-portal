# Admin fidelity acceptance

## Contract and evidence

Source: all 14 static boards in `design/mockup/careers-admin-mockups/`.
All boards' CSS was read and is identical (SHA256
`5f78756aa3f2f1d4bd29092fba8fc39753a5d5fda9ec7c61e9830f3f6e2da87b`).
Design-tool runtime scripts are excluded. `node scripts/render-admin-references.mjs`
renders their actual HTML/CSS using installed self-hosted fonts in Chromium at
1440x900 and 390x844. All 28 references were viewed in two contact sheets.
References: ignored `design/mockup-reference-admin/`. Real before/after/final
captures: ignored `design/mockup-compare-admin/`. No screenshots are committed.

Default: match the boards. Real values replace fictional sample values; this is
not permission to change layout. Preserve every field/filter/action, with compact
progressive disclosure for fields absent from a board. Existing tests must adapt
to approved interactions, not dictate visual deviations.

Statuses: **Pending** means not reconciled yet (not a completed implementation
claim); **Implemented** requires code and rendered evidence; **Deviation** needs
reason A (would break/remove a function), B (schema/migration/permission/dependency),
or C (security/accessibility). **Not implemented** records an actual remaining gap.
Final counts are reserved until the final audit. Every pending row below is an
explicit decision to reconcile, not approval of the previous restyle difference.

## Ordered todo (exactly one in progress)

- In progress: acceptance baseline and reference review.
- Pending: shell and mobile menu.
- Pending: dashboard.
- Pending: applications list.
- Pending: applicant profile and delete dialog.
- Pending: jobs list and row menu.
- Pending: job editor, question builder and all dialogs.
- Pending: brands list/editor.
- Pending: combined departments/options.
- Pending: login and MFA.
- Pending: mobile variants and cross-screen audit.
- Pending: final default/live/build/production-browser gates and final captures.

## 1. Shell, shared controls and glass (Main + all desktop boards + MobileMenu)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| S01 | Cool-white #F2F5FB canvas, #0B1220 ink; red/blue/green blurred ambient orbs in drawn positions, opacity .16 and blur 110px | Pending |
| S02 | Plus Jakarta Sans and Bengali Hind Siliguri; 14px base, 30px/800/-0.03em desktop titles, 12px eyebrows, 12px uppercase blue kickers | Pending |
| S03 | 248px sidebar, 12px margins, 20px 14px padding, 24px radius, hairline white border, inset highlight and soft shadow | Pending |
| S04 | Wordmark 18px/800 and blue 8px dot, 4px 10px 18px padding | Pending |
| S05 | Dashboard, Applications, Jobs, Brands, Departments, Options links in drawn order; actual destinations, selected dark pill, pale hover and focus states | Pending |
| S06 | Sidebar link padding 10px 12px/radius 14px; 4px gaps; footer pinned low with actual signed-in email and full-width Sign out | Pending |
| S07 | Main padding 16px 28px 40px; min-width 0; toolbar 12px gap and 22px bottom margin; eyebrow/title left, search/New job right | Pending |
| S08 | Toolbar search 260px, Name or email placeholder, real application-search navigation; New job link on every desktop screen | Pending |
| S09 | Glass opacity levels: data surfaces .76-white/14px blur; sidebar/topbar/action bar .58-white/24px blur/170% saturation; dialogs/nested dense cards .9-white | Pending; previous pass used .58/24px on ordinary data cards; correct it |
| S10 | No nested backdrop-filter; opaque unsupported-blur fallback, solid reduced-transparency surfaces and hidden decorative orbs | Pending; accessibility/performance requirement |
| S11 | Inputs .8-white, 11px 14px padding, 14px radius, .10-ink border; button 15px radius, 11px 18px, dark/white primary, translucent secondary | Pending |
| S12 | Visible 2px blue focus rings/2px offset; hover/disabled/pending/error/selected states, readable >=4.5:1 text on composited glass | Pending |
| S13 | Status badge colours: New blue, Under review amber, Shortlisted purple, Hired/Open/Active green, Rejected/Closed/Inactive red, Draft amber; 6px dot, 4px 11px pill | Pending; darker green allowed only if measured contrast requires it |
| S14 | Mobile topbar 10px outer padding, 12px 16px inner padding, 24px radius, light glass, wordmark and Menu control | Pending |
| S15 | Mobile slide-over navigation: 300px panel, .88-white, dark .35 backdrop, drawn wordmark and all six links | Pending |
| S16 | Mobile menu open/close, focus containment, Escape and backdrop close, trigger focus restoration, inert background, scroll lock and viewport-resize handling | Pending; explicit close control allowed for accessibility |
| S17 | Resolve MobileMenu board's row-wrapped stretched links/hidden footer at 390 without breaking navigation, touch or sign-out access; list every resulting deviation | Pending; do not claim literal parity |
| S18 | Mobile text/input legibility and Bengali rendering, no overlaps, horizontal page overflow or unreachable controls | Pending |

## 2. Dashboard (Main + MobileDashboard)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| D01 | Overview eyebrow and Dashboard title; desktop search/New job; mobile title without desktop toolbar | Pending |
| D02 | Six count cards in order Total, New, Under review, Shortlisted, Rejected, Hired; 16px padding, 14px gaps, 30px counts | Pending |
| D03 | New count card has 2px blue outline; every card links to correctly filtered applications | Pending |
| D04 | Desktop latest-applications/open-roles grid 2fr:1fr, 14px gap, top margin 14px; mobile count grid two columns/12px padding | Pending |
| D05 | Latest applications kicker, semantic table columns Candidate, Position, Brands, Status, Applied (Dhaka), working candidate links, bold names and New dot | Pending |
| D06 | Accent initial brand circles overlap by 4px, 22px size/white border; real brands rather than fictional logos; previous restyle substituted logos | Pending; match initial-circle design |
| D07 | Dhaka timestamps and readable Bengali names; actual latest rows, no invented records | Pending |
| D08 | Open roles by department kicker, stored department names/counts, blue 10px rounded progress bars and 12px vertical spacing | Pending |
| D09 | Mobile latest-applications heading outside card wrapper; individual 14px cards: name/status top, role middle, marks/date bottom | Pending |
| D10 | Preserve access to department statistics absent from abbreviated mobile board through disclosure, not silent deletion | Pending |
| D11 | Empty latest applications and zero department counts; loading/error recovery styled consistently without sensitive diagnostics | Pending |

## 3. Applications (Applications + MobileApplications + States)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| A01 | Applications eyebrow/title and desktop toolbar; compact glass filter row with 14px padding/10px gaps | Pending |
| A02 | Inline name/email search with 200px minimum, Brand, Department, Job, Status and date control in drawn order | Pending |
| A03 | Preserve inclusive From/To, timezone, sort and explicit submit/clear controls via More filters; no existing filter removed | Pending; previous fully expanded grid is not approved |
| A04 | Active filter chips with removable cross and Clear all below filters, each removal preserves other filters and date timezone | Pending |
| A05 | .76-white table card, columns Candidate, Position, Brands, Status, Applied (Dhaka), 13.5px table, 12px headers and drawn cell padding | Pending |
| A06 | Bold clickable names and blue New dot; brand initial marks; sentence-case status colours and Dhaka date | Pending |
| A07 | Applied before indicator beside applied date, case-insensitive email, another earlier application; additive read-only lookup per listed email, no migration and no name inference | Pending; previously omitted without approval |
| A08 | Result total, 25 per page and previous/number/ellipsis/next pagination; selected page and disabled boundaries | Pending |
| A09 | Mobile search remains visible; Filters control with collapsed full filter set; active chip alongside it, result count above cards | Pending |
| A10 | Mobile card name/status row, role line, brands left/date right; repeat indicator remains reachable without overflow | Pending |
| A11 | Empty state exact title No applications match these filters, explanatory text, centred 48px padding, working Clear filters button | Pending |
| A12 | Unfiltered empty state, invalid filters, cleanup retry, pending/error states preserve working behaviour with compact presentation | Pending |

## 4. Applicant profile (Applicant + MobileApplicant + Dialogs)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| P01 | Toolbar breadcrumb Applications / reference and candidate name; header card repeats candidate name at 26px/800 with inline status badge | Pending; previous pass dropped duplicate name without approval; only toolbar name is h1 |
| P02 | Role, department, reference, applied and consent date lines, brand initial circles at right, 16px gaps/wrapped header | Pending |
| P03 | Content + 340px review rail grid, 14px gaps, rail sticky top 16px and viewport-safe reachability | Pending |
| P04 | Personal & contact rows: actual email, phone, city/location; 150px label column and 9px vertical padding/hairline separators | Pending |
| P05 | Professional, Experience, Skills, Portfolio and Role-specific answers panels in order with blue uppercase labels; real answers render as text/Bengali and safe links | Pending |
| P06 | Previous applications from this email: dense nested cards with clickable job/profile, date and status; meaningful empty state | Pending |
| P07 | Status history: actual event dates, changes and actor; never fabricate the board's Viewed event | Pending |
| P08 | Rail Download Profile PDF, Include internal notes checkbox default off, status selector and Update status, internal-note input and Add note | Pending |
| P09 | Internal notes title, note text, author/time; retain author-only delete control with pending/error feedback | Pending |
| P10 | CV and other attachment names/sizes, Downloads heading and authenticated Download controls; Delete application at bottom | Pending |
| P11 | Mobile header simplified to status/role/reference/date/brands; review disclosure before content, Status, notes & downloads summary and open state | Pending |
| P12 | Mobile full PDF notes/status/note/download/delete functionality remains available within disclosure; personal rows remain two columns where they fit | Pending |
| P13 | Delete confirmation dialog: Delete kicker, 18px heading Delete this application?, actual name/reference, irreversible files/notes warning, Cancel + red Delete aligned right | Pending |
| P14 | Delete cancel/Escape restores focus and changes nothing; confirm/pending/error and cleanup retry retain original gated deletion/recovery | Pending |
| P15 | Empty answers/attachments/history/notes/previous applications; long text/Bengali/links and consent-absent states | Pending |

## 5. Jobs list and row menu (Jobs + States)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| J01 | Jobs eyebrow/title, desktop search/New job, compact glass filters Status, Department, Brand, Search jobs; preserve Apply/Clear affordances compactly | Pending |
| J02 | Data card 14px below filters; columns Title, Department, Brands, Options, Salary, Status, Apps, Updated, actions | Pending |
| J03 | Bold title links, verbatim options separated by dots, configured salary/Negotiable, brand initials, status colours, counts and short updated date | Pending |
| J04 | Ellipsis row actions trigger, 220px/.9-white menu with 8px padding, 12px item radius, hover on Duplicate | Pending |
| J05 | Working Edit, Duplicate, Close job/Reopen; eligible draft Delete preserved; focus/Escape/outside click, generic failures and mutation pending | Pending |
| J06 | Mobile card order name/status, department, marks/options/salary/count/date and reachable row actions; no overflow or obscured menu | Pending |
| J07 | No matching jobs and genuinely empty jobs states with Clear filters/New job; loading and error | Pending; prior single-clear-link choice must match States treatment |

## 6. Job editor (JobEditor + Dialogs)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| E01 | Jobs / actual title eyebrow; Edit job/New job heading; desktop toolbar search/New job | Pending |
| E02 | Sticky action bar top 8px, padding 12px 16px, 24px radius, .58 glass, status left and Duplicate/Save draft/Publish right | Pending |
| E03 | Sticky action bar remains visible while content scrolls, container release and mobile viewport safety; save existing open/closed, close/reopen/delete retained without crowding | Pending |
| E04 | Four blocks in 1.4fr:1fr grid: 1 Basics/2 Content left; 3 Questions/4 Candidate form preview right; 14px gaps and margins | Pending |
| E05 | Basics title/slug/department/primary brand two-column fields, locked published slug and editable draft/auto slug; brand chips and one primary | Pending |
| E06 | Work arrangement, Engagement type, Experience chip groups in stored order; correct selected blue states, inactive linked options preserved | Pending |
| E07 | Salary Negotiable/Show a range pills with dark selected range; one-line range text and 80-character guidance | Pending |
| E08 | Vacancies/location/deadline three-column row; CV required checkbox and missing-publication-group amber guidance | Pending |
| E09 | Experience text/engagement note/order and all real fields absent from abbreviated mock remain compactly accessible via additional-settings disclosure | Pending |
| E10 | Summary textarea two rows and live 0/200 counter; Description, Responsibilities, Requirements, Nice to have fields | Pending |
| E11 | Write/Preview toggle for every markdown field, dark selected pill; no simultaneous side-by-side preview; switching preserves edits | Pending; previous live-preview-only decision is superseded |
| E12 | Preview uses existing sanitised Markdown, raw HTML disabled, links/text wrap and empty preview feedback | Pending |
| E13 | Benefits and Skills Add item, press Enter inputs and pill items; keyboard add/remove and validated limits preserved (not multiline textareas) | Pending |
| E14 | Questions compact .9-white cards, padding 12px 16px, 8px spacing, label/type/Required/Archive; full type-specific edit controls through disclosure/dialog | Pending |
| E15 | Question ordering control exactly drawn drag-handle affordance, working native drag and drop plus keyboard/arrow alternatives, announcements and boundary states | Pending; no library; arrow-only alternative requires recorded deviation |
| E16 | Add question, Add standard questions and Copy from another job actions below cards; seven independent defaults, copy source selector and feedback | Pending |
| E17 | Existing question remove/archive semantics and archived information; section/help/options/config edits remain possible; never lose unsaved state | Pending |
| E18 | Candidate form preview .9 scale/top origin desktop, correct title/contacts/configured sections/CV/consent, local validation without upload or persistence | Pending; abbreviated preview cannot remove functionality |
| E19 | Publish confirmation dialog: Publish kicker, 18px Publish [title]?, actual public path and slug-lock warning, Requirements met or actual blockers, Cancel/Publish | Pending; previous immediate Publish is superseded |
| E20 | Publish cancel/Escape retains draft; confirm invokes unchanged server validation; pending/failed publish does not fabricate success; successful publish locks slug | Pending |
| E21 | Add-question dialog: Add question kicker, New question heading, type chooser with all eleven types in drawn order | Pending; previous immediate append is superseded |
| E22 | Dialog Label, Help text, Required, Allow Other for choices, Radio/Dropdown selected pills for single choice | Pending |
| E23 | Dialog min/max length/value pair and options editor Add option, press Enter; label/value editing/removal retains strict unique option values | Pending |
| E24 | Date absolute/today bounds, number integer/min/max, text lengths, multichoice selection limits and file accept/size/count fields remain reachable and validated | Pending |
| E25 | Dialog Cancel/Add question, keyboard focus/Escape, invalid feedback, cancel creates nothing and confirm inserts one independently editable definition | Pending |
| E26 | Empty questions/add controls, max 100 limit, invalid save/publish, draft/new/existing open/closed/archived states | Pending |
| E27 | Mobile four blocks stack with readable controls, unscaled preview, compact persistent action bar and viewport-fitting dialogs | Pending; desktop-board 390 overflow requires accessibility fix |

## 7. Brands (Brands)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| B01 | Brands heading/toolbar and 2fr:1fr cards/editor grid; three-column card list, 14px gaps, 16px padding/24px radii | Pending |
| B02 | 40px brand initial accent circle, name, /slug and actual sector; Active/Hidden and No description pills | Pending; previous logo substitution is superseded for list marks |
| B03 | Select/Edit brand, create brand, hide/show, reorder remain compact working controls with selected/focus states and no invented sample sectors | Pending |
| B04 | Edit brand kicker; dashed 20px-radius drop zone, real logo preview/picker/drop, SVG/PNG/WebP <=1MB guidance and original server validation | Pending; WebP retention is required existing function |
| B05 | Name/description, live description count; preserve validated 3000 limit rather than mock's 280 using compact additional settings | Pending; record A deviation if 280 would truncate supported content |
| B06 | Slug/sector/website/accent/status/order stay reachable in additional settings, not permanently expanded wall of fields | Pending |
| B07 | Sample text on accent preview and actual contrast measurement; readable >=4.5:1 text instead of unsafe mock 4.3 white | Pending; C deviation requires measured reason |
| B08 | Save brand, upload/save pending/error, invalid file feedback, empty brands/create and mobile one-column card/editor | Pending |

## 8. Departments and options (Settings)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| O01 | Settings eyebrow and Departments & options title; combined screen with departments left/options right in equal columns | Pending; previous separate-page presentation is superseded; retain existing route access |
| O02 | Departments glass panel/kicker and Name, Slug, Active, Roles, Order columns; bold names, muted slugs, green/red state pills and actual counts | Pending |
| O03 | Compact up/down/Edit controls; New department input + Add row; retain slug/status/order via compact edit/add disclosure | Pending |
| O04 | Work arrangement, Engagement type and Experience glass panels stacked on right, 14px spacing | Pending |
| O05 | Option Label, Slug, Status, Jobs, Actions columns; verbatim labels, actual counts, Edit/Deactivate-or-Activate/up/down/Delete | Pending |
| O06 | Linked options have visibly disabled Delete with Used by jobs explanation; unlinked deletion remains confirmed and server enforced | Pending |
| O07 | Create option panel: Group/Label/Slug three-column row, Active checkbox + Create; edit/cancel/errors/pending preserve group rules | Pending |
| O08 | Mobile combined sections stack; dense rows/card adaptations preserve names/slugs/counts/actions and do not overflow | Pending |
| O09 | Empty departments and empty option groups/create feedback, inactive states and reorder boundaries | Pending |

## 9. Login and MFA (Login)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| L01 | Centred 380px/.72-white/24px-radius card, 20px padding, 12px gaps; blue/red orbs and Careers admin wordmark | Pending |
| L02 | Sign in blue kicker, Email and Password labelled fields, primary Sign in; incorrect credentials red message and pending/disabled/hydration safety | Pending; prior Admin sign in heading must match visual hierarchy without redundant visible heading |
| L03 | MFA enrolment Set up two-step kicker, password re-verification before setup, actual QR, six 44x52px cells, 8px gap and Verify | Pending; password gate cannot be removed |
| L04 | Setup key and recovery instructions preserved through compact disclosure; no setup secrets in screenshots/logs/git | Pending; explicit owner-only recovery wording |
| L05 | MFA challenge Enter code kicker, six-cell TOTP and Continue; paste/autofill/single-digit/backspace/arrows/focus/error handling | Pending |
| L06 | Invalid/expired code, password denial, pending verification, already-AAL2 redirect and sign-out preserve unchanged auth checks | Pending |
| L07 | Mobile cards fit 390 width; six cells remain usable, fields text readable and no clipped QR/input/button | Pending |

## 10. Cross-screen/mobile/final audit

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| V01 | Inspect every before/after/final full-page screen at 1440 and 390, include empty states, dialogs, menu and auth states (mask setup secrets) | Pending |
| V02 | Dense panels remain more opaque than chrome, no stacked blur, unsupported/reduced-transparency fallback | Pending |
| V03 | >=4.5:1 text, hover/focus/selected/disabled states, long strings/Bengali, no overlaps/overflow, keyboard interaction/focus restoration | Pending |
| V04 | Every protected page/action/handler retains direct requireAdmin and mandatory MFA; no validation/storage/auth/schema/dependency changes | Pending |
| V05 | Tests cover publish cancel/confirm, Add-question dialog, Write/Preview, slide-over focus/Escape, ordering and Applied before without weakening previous cases | Pending |
| V06 | Per-screen typecheck/lint/touched unit tests; final once-only default/live/build+PDF trace/complete production e2e run, live/browser serialized | Pending |
| V07 | Record all actual results/failures and final counts, every allowed deviation/reason and every nonimplemented row; no pixel-identical claim without evidence | Pending |
| V08 | Commits/pushes per completed screen, context handoff around 60%, no merge/force-push/non-dev access; unrelated test-accounts diff unstaged | Pending |

## Previous-pass differences: explicit disposition

The following inventory supersedes the unapproved decisions in
`ADMIN_UI_RESTYLE.md` and the previous admin report in `UI_VERIFICATION.md`.

| Previous difference | Required disposition / checklist |
| --- | --- |
| Accessible names preserved solely for old tests | Adapt tests to correct board interactions, preserve meaningful labels; S12/V05 |
| Side-by-side live Markdown, no toggle | Implement toggles; E11/E12 |
| Immediate Add question, no dialog | Implement dialog/type/options flow; E21–E25 |
| Immediate Publish, no confirmation | Implement confirmation with cancel/confirm coverage; E19/E20 |
| Brands fake table/cell semantics for tests | Use appropriate card semantics and update tests; B01–B03 |
| Six-cell MFA first-cell full-code fill | Preserve autofill accessibility, no visual deviation needed; L05 |
| Toolbar application search renamed for uniqueness | Meaningful name can differ without visible copy change; S08 |
| Additive job/brand/department projection fields | Preserve real data with exact board presentation; D08/J03/O02 |
| Mobile table-to-card semantics | Preserve accessibility with exact mobile geometry; D09/A10/J06 |
| Duplicate applicant name dropped | Restore header name, only one h1; P01 |
| Applied before omitted | Add bounded read-only prior-email flag; A07 |
| Expanded full filter grid/timezone paragraph | Compact row + More filters, preserve semantics; A02/A03 |
| Settings split across pages | Combined Settings presentation, preserve both routes; O01 |
| Full catalog forms made taller by real fields | Progressive disclosure in board layout; B05/B06/O03/O07 |
| Description max kept at 3000 rather than 280 | Preserve supported data, record permitted A reason; B05 |
| Explicit full reorder/edit/upload controls | Retain compact drawn affordances with real operation; B03/O03/O05 |
| All question config always exposed; arrows replace drag handle | Compact cards/disclosure, working handle + keyboard alternative; E14/E15/E24 |
| Standard questions stay seven code constants | Required existing function, independent copies; E16 |
| PDF notes/consent/status/password/key/recovery instructions all expanded | Keep security/functionality, present compactly; P02/P08/L03/L04 |
| Login Admin sign in heading retained for tests | Match board hierarchy, update test heading assertion; L02 |
| Only one jobs Clear filters control | Reconcile actual empty-state CTA, not test-driven omission; J07 |
| Mobile toolbar search hidden, Jobs New job retained | Dedicated mobile boards govern; preserve create access; D01/A09/J06 |
| Darker badge/kicker/initial ink | Retain only when contrast measurement requires C deviation; S13/B07 |
| Vertical menu/close/footer instead of broken board CSS | Accessibility and sign-out retention only, document exact changes; S16/S17 |
| Actual data claimed as blanket reason for density differences | Not allowed; use actual values with board layout, no invented totals; V01/V07 |

## Verification and counts

Baseline only: references rendered/viewed; implementation reconciliation and
checks have not run yet. No row is marked Implemented based on the previous pass.
Hosted Vercel, real physical phones and non-dev resources are not verified.
