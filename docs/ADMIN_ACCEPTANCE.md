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

- Complete: acceptance baseline and reference review (`5a32b0e`).
- Complete: shell and mobile menu (screen checkpoint; final production audit pending).
- Complete: dashboard (screen checkpoint; final production audit pending).
- Complete: applications list (screen checkpoint; final live/production audit pending).
- Complete: applicant profile and delete dialog (screen checkpoint; final workflows pending).
- Complete: jobs list and row menu (screen checkpoint; mutations queued for final e2e).
- In progress: job editor shell/sticky action bar and Publish confirmation.
- Editor blocks pending: Basics; Content/Write-Preview; question builder/Add-question/options; candidate preview. Commit each block separately.
- Pending: job editor, question builder and all dialogs.
- Pending: brands list/editor.
- Pending: combined departments/options.
- Pending: login and MFA.
- Pending: mobile variants and cross-screen audit.
- Pending: final default/live/build/production-browser gates and final captures.

## 1. Shell, shared controls and glass (Main + all desktop boards + MobileMenu)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| S01 | Cool-white #F2F5FB canvas, #0B1220 ink; red/blue/green blurred ambient orbs in drawn positions, opacity .16 and blur 110px | Implemented; desktop positions retained, dedicated mobile board's single 300px red orb used |
| S02 | Plus Jakarta Sans and Bengali Hind Siliguri; 14px base, 30px/800/-0.03em desktop titles, 12px eyebrows, 12px uppercase blue kickers | Implemented; corrected normal line height, before/after chrome captures |
| S03 | 248px sidebar, 12px margins, 20px 14px padding, 24px radius, hairline white border, inset highlight and soft shadow | Implemented; desktop chrome capture |
| S04 | Wordmark 18px/800 and blue 8px dot, 4px 10px 18px padding | Implemented; desktop/mobile captures |
| S05 | Dashboard, Applications, Jobs, Brands, Departments, Options links in drawn order; actual destinations, selected dark pill, pale hover and focus states | Implemented; active aria-current added, shell unit test and rendered navigation |
| S06 | Sidebar link padding 10px 12px/radius 14px; 4px gaps; footer pinned low with actual signed-in email and full-width Sign out | Implemented; added missing nav gaps and removed undersized footer-button variant |
| S07 | Main padding 16px 28px 40px; min-width 0; toolbar 12px gap and 22px bottom margin; eyebrow/title left, search/New job right | Implemented; 1440 chrome matches reference geometry |
| S08 | Toolbar search 260px, Name or email placeholder, real application-search navigation; New job link on every desktop screen | Implemented; existing real GET search/destinations retained |
| S09 | Glass opacity levels: data surfaces .76-white/14px blur; sidebar/topbar/action bar .58-white/24px blur/170% saturation; dialogs/nested dense cards .9-white | Implemented for shared surfaces; fixed prior .58/24px ordinary cards; editor/dialog-specific styles audited at their screen checkpoints |
| S10 | No nested backdrop-filter; opaque unsupported-blur fallback, solid reduced-transparency surfaces and hidden decorative orbs | Implemented; nested cards .9-white/no blur; CSS regression test; solid unsupported-blur/reduced-transparency fallback |
| S11 | Inputs .8-white, 11px 14px padding, 14px radius, .10-ink border; button 15px radius, 11px 18px, dark/white primary, translucent secondary | Implemented; normal inherited font metrics restore drawn control sizes |
| S12 | Visible 2px blue focus rings/2px offset; hover/disabled/pending/error/selected states, readable >=4.5:1 text on composited glass | Implemented for shared controls; CSS/state review and contrast tests; full per-screen manual audit remains V03 |
| S13 | Status badge colours: New blue, Under review amber, Shortlisted purple, Hired/Open/Active green, Rejected/Closed/Inactive red, Draft amber; 6px dot, 4px 11px pill | Deviation C: mock green #087A5B measures 4.45:1 on #dbefec composite; existing #08694F measures 5.59:1. Other badge families/shapes retained; contrast regression passes |
| S14 | Mobile topbar 10px outer padding, 12px 16px inner padding, 24px radius, light glass, wordmark and Menu control | Implemented; 390 chrome capture |
| S15 | Mobile slide-over navigation: 300px panel, .88-white, dark .35 backdrop, drawn wordmark and all six links | Implemented; 390 menu capture, see S17 for required functional/a11y changes |
| S16 | Mobile menu open/close, focus containment, Escape and backdrop close, trigger focus restoration, inert background, scroll lock and viewport-resize handling | Implemented; capture checks verified Tab/Shift+Tab, Escape, close/backdrop restoration and desktop-resize cleanup; permanent e2e extended, final production run pending |
| S17 | Resolve MobileMenu board's row-wrapped stretched links/hidden footer at 390 without breaking navigation, touch or sign-out access; list every resulting deviation | Deviation A/C: vertical non-stretched links and visible Sign out retain usable navigation/session termination; compact 44px close icon provides accessible dismissal instead of absent close control. Board's 390 CSS stretches selected link and hides footer; panel width/colour/backdrop preserved |
| S18 | Mobile text/input legibility and Bengali rendering, no overlaps, horizontal page overflow or unreachable controls | Pending |

## 2. Dashboard (Main + MobileDashboard)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| D01 | Overview eyebrow and Dashboard title; desktop search/New job; mobile title without desktop toolbar | Implemented; before/after 1440/390 dashboard captures |
| D02 | Six count cards in order Total, New, Under review, Shortlisted, Rejected, Hired; 16px padding, 14px gaps, 30px counts | Implemented; actual counts, render test confirms ordered links and labels |
| D03 | New count card has 2px blue outline; every card links to correctly filtered applications | Implemented; render test and captures |
| D04 | Desktop latest-applications/open-roles grid 2fr:1fr, 14px gap, top margin 14px; mobile count grid two columns/12px padding | Implemented; shared line-height fix restores reference geometry |
| D05 | Latest applications kicker, semantic table columns Candidate, Position, Brands, Status, Applied (Dhaka), working candidate links, bold names and New dot | Deviation A: table matches six drawn desktop rows/three mobile rows initially; a compact Show all latest applications control retains access to the documented latest-ten dataset instead of deleting four/seven records from dashboard access. Table columns and link semantics match; captured expansion/collapse passes |
| D06 | Accent initial brand circles overlap by 4px, 22px size/white border; real brands rather than fictional logos; previous restyle substituted logos | Deviation C: initial-circle geometry restored; readable black/white helper replaces always-white mock initials. White is only 4.41:1 on Fixen red, 3.25:1 on Wiki green and 3.09:1 on Ghora orange; chosen black is 4.76/6.45/6.80:1 respectively. Logos remain available for real upload previews |
| D07 | Dhaka timestamps and readable Bengali names; actual latest rows, no invented records | Implemented; actual rows preserved and synthetic Bengali/semantic date tests pass. Repeated captures mask candidate names so screenshot inspection does not print applicant data |
| D08 | Open roles by department kicker, stored department names/counts, blue 10px rounded progress bars and 12px vertical spacing | Implemented; actual counts and proportional bars, synthetic render test; zero-row message |
| D09 | Mobile latest-applications heading outside card wrapper; individual 14px cards: name/status top, role middle, marks/date bottom | Implemented; first three cards match MobileDashboard; complete row-set access retained via D05 disclosure |
| D10 | Preserve access to department statistics absent from abbreviated mobile board through disclosure, not silent deletion | Deviation A: collapsed Open roles by department disclosure is added below mobile latest cards because omitting the panel entirely would remove access to existing dashboard statistics. Desktop panel is initially open. Capture verified disclosure opens/closes and re-adapts at breakpoint |
| D11 | Empty latest applications and zero department counts; loading/error recovery styled consistently without sensitive diagnostics | Implemented; new No applications yet state avoids inappropriate list-filter reset on dashboard; No open roles yet; generic query failure test, existing loading/error presentation retained (not forced into outage screenshot) |

## 3. Applications (Applications + MobileApplications + States)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| A01 | Applications eyebrow/title and desktop toolbar; compact glass filter row with 14px padding/10px gaps | Implemented; before/after 1440/390 captures; large expanded grid removed |
| A02 | Inline name/email search with 200px minimum, Brand, Department, Job, Status and date control in drawn order | Deviation A/C: drawn order retained, with two compact labelled icon controls appended (More filters and explicit submit). Removing pointer submission would leave no mouse/touch way to apply edits; omitting disclosure would make To date/sort unavailable. Labels/tooltips/keyboard states retained; not an automatic filter/navigation rewrite |
| A03 | Preserve inclusive From/To, timezone, sort and explicit submit/clear controls via More filters; no existing filter removed | Implemented; To date/sort/timezone guidance disclosed, From date in drawn row; all submitted names retained; unit and capture disclosure checks pass |
| A04 | Active filter chips with removable cross and Clear all below filters, each removal preserves other filters and date timezone | Implemented; chips moved below form; timezone/from/to/sort preservation unit test; mobile controls beside chips |
| A05 | .76-white table card, columns Candidate, Position, Brands, Status, Applied (Dhaka), 13.5px table, 12px headers and drawn cell padding | Implemented; reference column proportions fixed so long values wrap within the drawn layout; dashboard table unaffected |
| A06 | Bold clickable names and blue New dot; brand initial marks; sentence-case status colours and Dhaka date | Deviation C: shape/marks/date match; shared measured green/initial ink contrast corrections S13/D06 retained rather than unsafe mock colours. Candidate cells masked in screenshot inspection; synthetic render assertions retain names/links |
| A07 | Applied before indicator beside applied date, case-insensitive email, another earlier application; additive read-only lookup per listed email, no migration and no name inference | Implemented; correlated EXISTS within bounded list query, lower(email) index, strictly earlier timestamp (ties do not qualify), independent of list filters; unit SQL projection and real synthetic capture checks pass; additional live cases queued |
| A08 | Result total, 25 per page and previous/number/ellipsis/next pagination; selected page and disabled boundaries | Implemented; plain drawn pagination with aria-current and disabled end arrows; server pagination/URL semantics unchanged |
| A09 | Mobile search remains visible; Filters control with collapsed full filter set; active chip alongside it, result count above cards | Implemented; 390 capture and disclosure checks, desktop/mobile placeholders and legible controls |
| A10 | Mobile card name/status row, role line, brands left/date right; repeat indicator remains reachable without overflow | Implemented; Applied before wraps into a right-aligned pill beneath date; both width overflow checks passed |
| A11 | Empty state exact title No applications match these filters, explanatory text, centred 48px padding, working Clear filters button | Implemented; empty captures both widths and render test; no duplicate reset control in empty form |
| A12 | Unfiltered empty state, invalid filters, cleanup retry, pending/error states preserve working behaviour with compact presentation | Implemented; genuine empty state has No applications yet/New job, tested; invalid-filter message/cleanup control and generic read-error boundary remain directly gated; provider outage/cleanup failure not forced into screenshots |

## 4. Applicant profile (Applicant + MobileApplicant + Dialogs)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| P01 | Toolbar breadcrumb Applications / reference and candidate name; header card repeats candidate name at 26px/800 with inline status badge | Implemented; one h1, repeated header name restored; render assertion and 1440 capture |
| P02 | Role, department, reference, applied and consent date lines, brand initial circles at right, 16px gaps/wrapped header | Deviation C: layout restored with shared readable black/white initial ink correction D06 rather than always-white mock letters; consent present/absent render checks |
| P03 | Content + 340px review rail grid, 14px gaps, rail sticky top 16px and viewport-safe reachability | Implemented; one glass review panel instead of separate cards; viewport-limited scroll on desktop, normal mobile flow |
| P04 | Personal & contact rows: actual email, phone, city/location; 150px label column and 9px vertical padding/hairline separators | Implemented; Location accurately labels the existing unrestricted location field; redundant name row removed, name retained twice above; two columns at 390 and stacking below 360 |
| P05 | Professional, Experience, Skills, Portfolio and Role-specific answers panels in order with blue uppercase labels; real answers render as text/Bengali and safe links | Implemented; stored section order retained, exact Role-specific answers title; absent sections not fabricated; escaping/order/Bengali/unsafe URL render checks |
| P06 | Previous applications from this email: dense nested cards with clickable job/profile, date and status; meaningful empty state | Deviation A: drawn nested shape/status restored but existing reference and precise submitted time retained in its small date line, rather than removing useful review fields. Link remains visibly blue/keyboard reachable; genuine empty state added |
| P07 | Status history: actual event dates, changes and actor; never fabricate the board's Viewed event | Implemented; glass panel restored; existing actual events/actor retained, no fabricated Viewed activity; empty history message |
| P08 | Rail Download Profile PDF, Include internal notes checkbox default off, status selector and Update status, internal-note input and Add note | Deviation A: drawn unboxed/full-width controls restored; existing private-note guidance and precise Include internal notes in PDF label retained so admins do not confuse PDF inclusion with candidate visibility. Hidden labels preserve programmatic names; SSR checks |
| P09 | Internal notes title, note text, author/time; retain author-only delete control with pending/error feedback | Implemented; drawn separated bold notes, actual author/time, unchanged own-note deletion/result handling |
| P10 | CV and other attachment names/sizes, Downloads heading and authenticated Download controls; Delete application at bottom | Implemented; Downloads after notes with actual filenames/KB, compact Download links retain accessible CV/file-specific names; no storage URL or gate changes |
| P11 | Mobile header simplified to status/role/reference/date/brands; review disclosure before content, Status, notes & downloads summary and open state | Deviation A: duplicate header name hidden as drawn, but real department and consent metadata remain available instead of disappearing on mobile. Initially open one-card disclosure restored and reopens when resizing to desktop to avoid inaccessible controls |
| P12 | Mobile full PDF notes/status/note/download/delete functionality remains available within disclosure; personal rows remain two columns where they fit | Implemented; 390 captures and disclosure/resize checks; downloads/status/note/PDF DOM retained |
| P13 | Delete confirmation dialog: Delete kicker, 18px heading Delete this application?, actual name/reference, irreversible files/notes warning, Cancel + red Delete aligned right | Deviation C: matches geometry/copy structure with full irreversible-data warning; filled red darkened from #E5484D (white 3.91:1) to #B42318 (6.57:1). Existing Confirm deletion accessible name retained; actual name escaped; 1440/390 dialog captures |
| P14 | Delete cancel/Escape restores focus and changes nothing; confirm/pending/error and cleanup retry retain original gated deletion/recovery | Implemented; capture verified Cancel/Escape focus and synthetic row unchanged. Escape blocked while deletion is pending; existing confirmed action/retry/error flow unchanged. Full destructive workflow remains queued for final production e2e |
| P15 | Empty answers/attachments/history/notes/previous applications; long text/Bengali/links and consent-absent states | Implemented; render cases for genuine empties/ordered sections/consent/escaped text; synthetic Bengali/long-email captures and overflow checks. Provider failures and cleanup failures not forced into screenshots |

## 5. Jobs list and row menu (Jobs + States)

| ID | Visible element/state/interaction | Status / evidence / decision |
| --- | --- | --- |
| J01 | Jobs eyebrow/title, desktop search/New job, compact glass filters Status, Department, Brand, Search jobs; preserve Apply/Clear affordances compactly | Deviation A: drawn compact order/padding restored, with labelled 42px submit/reset icons to preserve pointer submission and direct reset (neither is drawn). Removing them breaks existing filter actions; no filter parameter deleted |
| J02 | Data card 14px below filters; columns Title, Department, Brands, Options, Salary, Status, Apps, Updated, actions | Implemented; fixed reference column proportions/padding; before/after 1440 capture, all columns retained |
| J03 | Bold title links, verbatim options separated by dots, configured salary/Negotiable, brand initials, status colours, counts and short updated date | Deviation C: drawn initials and all stored labels/salary/count/date restored; shared green/initial contrast corrections S13/D06 retained for readable text, not logo substitution |
| J04 | Ellipsis row actions trigger, 220px/.9-white menu with 8px padding, 12px item radius, hover on Duplicate | Implemented; drawn panel dimensions/styles, Escape focus return, first-link focus and above-trigger placement near viewport bottom; mobile menu capture inspected |
| J05 | Working Edit, Duplicate, Close job/Reopen; eligible draft Delete preserved; focus/Escape/outside click, generic failures and mutation pending | Implemented; independently gated server commands unchanged; eligible zero-application draft Delete has irreversible confirmation. Tab-away/outside pointer closes; pending commands keep feedback and disable competing actions. Capture passed draft Cancel/focus with no deletion; destructive command coverage remains final-only |
| J06 | Mobile card order name/status, department, marks/options/salary/count/date and reachable row actions; no overflow or obscured menu | Deviation C: Jobs board at 390 clips columns/actions horizontally. Semantic cards preserve every field and keep menu within viewport instead; filters wrap with drawn three-select order; both-width overflow/menu checks passed |
| J07 | No matching jobs and genuinely empty jobs states with Clear filters/New job; loading and error | Implemented; empty result/create controls added, no duplicate reset action; render cases distinguish genuinely empty from filtered. Existing invalid-filter notice/read boundary retained; provider failure not injected |

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

Provisional handoff counts (not a final acceptance result): **122 numbered rows:
47 Implemented / 15 Deviation / 60 Pending / 0 classified Not implemented**.
Pending screens are unfinished; zero classified Not implemented is NOT a claim
that the pass is complete. Current deviations are S13 (green contrast),
S17 (usable mobile menu/close/sign-out), D05 (latest-ten disclosure), D06 (readable
brand initials), D10 (mobile statistics access), A02 (retained accessible submission/
extra-filter access), A06 (shared measured contrast corrections), P02 (initial ink),
P06 (prior reference/time), P08 (privacy/PDF guidance), P11 (mobile metadata),
P13 (red button contrast), J01 (submit/reset function), J03 (shared contrast),
J06 (mobile column/action accessibility). All reasons are on their rows.

Shell checkpoint: typecheck/lint and two touched unit files / 7 tests passed.
Temporary dev-only screenshot capture passed, including menu focus/close checks;
all final production gates remain reserved. The initial capture hit the streaming
loading screen; a heading wait fixed the capture rather than weakening an assertion.
Before and after shell/dashboard captures exist at both widths, plus the menu.
Viewed chrome crops and the menu panel; final per-screen captures remain pending.
An initial lint error/warning was corrected. A renamed .tsx unit test was initially
excluded by the existing .test.ts discovery pattern; it is now .test.ts and all 7
cases actually ran. No test skip or discovery change was introduced.

Dashboard checkpoint: typecheck/lint and touched dashboard/presentation unit
files / 10 tests passed. Initially the new unit imported a server-only marker;
the established test-only marker mock fixed the harness import (runtime marker
unchanged). Dev capture verified six desktop/three mobile initial rows, all ten
on expansion, mobile statistics disclosure and menu checks. Viewed both masked
full-page widths; fixed a visible mid-word status wrap with normal pill wrapping,
then recaptured. Permanent browser assertions are queued for the final run.
No query, auth gate, mutation, dependency or migration changed in this checkpoint.
Applications checkpoint: typecheck/lint and three touched unit files / 12 tests
passed. Before/after/empty captures at both widths are ignored and candidate cells
are masked. Capture checks passed for More filters/mobile Filters, page overflow,
and synthetic first/earlier application flags. SQL unit initially caught alias-only
FROM rendering; corrected real-table AS alias without weakening the assertion.
New live equal-timestamp/case-insensitive/filter-independent flags and permanent
browser assertions are queued, not executed as broad verification. No migration,
dependency, validation, storage or authorization changes.
Profile checkpoint: typecheck/lint and four touched unit files / 17 tests passed.
Jobs checkpoint: typecheck/lint, two touched unit files / 10 tests, guarded
before/after/menu/empty captures and focus/overflow/draft Cancel checks passed.
Permanent browser menu coverage queued. Full command execution remains final-only.
Synthetic before/after/dialog captures at both widths inspected. Capture checked
overflow, Cancel/Escape focus return, no deletion and mobile-to-desktop disclosure
reachability. Initial render-test name count included the toolbar data attribute;
replaced with exact visible toolbar/header assertions (both required). New e2e
focus/disclosure cases queued; broad/default/live/build/production gates still
NOT executed for this pass. Hosted Vercel, real physical phones and non-dev
resources are not verified.
