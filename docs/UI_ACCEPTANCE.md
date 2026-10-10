# Mock-up public UI acceptance

Reference sources: `design/mockup/Home-html`, `design/mockup/Job detail-html`, and `design/mockup/Apply-html`. Rendered reference images live in the ignored `design/mockup-reference/` directory.

Final statuses reflect local implementation, production browser checks and visual review. Evidence and unverified external checks are in `docs/UI_VERIFICATION.md`.

## Content and behaviour rules

- Mock job titles, descriptions, counts, brands, options, salaries and deadlines are sample data. Render actual catalog/job/question data instead.
- Render managed option labels verbatim. Keep existing URL filter contracts and matching/count semantics.
- Omit unset optional values and square-bracket placeholders. Do not invent brand descriptions, contact addresses, benefits or application questions.
- Keep sanitised Markdown, existing submission validation, upload restrictions, consent and Turnstile verification.
- Desktop reference width is 1440px. Also verify 390px, intermediate widths, keyboard navigation and reduced motion. The mocks' narrow screenshots are not a usable mobile layout specification.
- Preserve the v2 data model and admin security gates.

## Extracted design tokens

These values govern the public theme; scope them to the public layout when implementing so admin retains its existing styling.

| Token | Reference value |
| --- | --- |
| Canvas | `#F2F5FB` |
| Ink / dark button | `#0B1220` |
| Muted text | `#5B6577` |
| Body text | `#2B364B` |
| Chip text | `#26324A` |
| Blue | `#2F6BFF` |
| Blue text | `#1E4FD8` |
| Success / check | `#12B76A` |
| Required marker | `#E5484D` |
| Neutral pill | `rgba(15,23,42,.06)` |
| Selected / fresher pill | `rgba(47,107,255,.12)` with `#1E4FD8` |
| Salary pill | `rgba(10,162,120,.13)` with `#087A5B` |
| Hairline / input borders | `rgba(15,23,42,.08)` to `.12` |
| Input surface | `rgba(255,255,255,.85)` |
| Glass surface | `rgba(255,255,255,.58)` |
| Glass border | `1px solid rgba(255,255,255,.78)` |
| Glass backdrop | `blur(24px) saturate(170%)` |
| Glass shadow | `0 10px 40px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.85)` |

| Geometry / typography | Reference value |
| --- | --- |
| Public Latin / Bengali fonts | Plus Jakarta Sans (400–800) / Hind Siliguri (400–600) |
| Home headline | 68px, 800, line-height 1.04, tracking -0.035em; secondary line 44px |
| Job / Apply headline | 60px / 38px, 800, tight tracking |
| Major section headings | 36px / 32px; job section headings 26px |
| Department heading | 22px, 800 |
| Section labels | 12–13px, 800, uppercase, tracking .08–.12em |
| Content / header maximum | 1200px, including 24px side padding |
| Home hero maximum | 1360px |
| Apply maximum | 820px, including side padding |
| Home columns | 270px + flexible results, 32px gap |
| Job columns | Flexible content + 340px summary, 44px gap |
| Desktop sticky offset | 24px, `align-self: start` |
| Pills / header | 999px radius |
| Panels | 24px / 26px / 28px radius |
| Job cards / floating cards | 20px / 22px radius |
| Search / inputs / buttons | 18px / 14px / 16px radius |
| Job hero band | 36px radius |
| Floating-card breakpoint | Hidden at widths <=1180px |
| Two-column breakpoint | Single column and sticky disabled below 900px; 900px is desktop |

Glass requires both standard and WebKit backdrop-filter declarations. Brand-coloured decorative orbs use 90–110px blur and approximately .18–.55 opacity. Contain decorative overflow locally without breaking page-level sticky positioning. Correct the mock's inline-display override so floating cards actually hide at the breakpoint.

## Shared chrome

| ID | Acceptance check | Status |
| --- | --- | --- |
| S01 | Floating glass pill header, centred 1200px container, 20px top spacing, Careers wordmark and blue dot. | Implemented |
| S02 | Roles, How it works and FAQ navigation targets the Home sections from every public page. Dark Browse roles pill is functional. | Implemented |
| S03 | Header wraps cleanly on mobile with no horizontal page overflow. | Implemented |
| S04 | Light footer with hairline separator, Careers name, conversation tagline, configured contact only, safe brand website links and Privacy link. | Implemented |
| S05 | Public typography, glass surfaces, focus indicators and spacing match the token reference. Bengali text renders correctly. | Deviation — slightly darker nav/salary text passes measured contrast; Bengali synthetic field visually checked. |

## Home

| ID | Acceptance check | Status |
| --- | --- | --- |
| H01 | Multicolour blurred hero orbs sit behind the centred content without obstructing interaction. | Implemented |
| H02 | Glass hiring pill shows a green dot, actual open-role count and actual hiring-brand count. | Implemented |
| H03 | Headline reads “Good work starts here.” with muted “Find your place across our brands.” secondary line; explanatory copy and two CTAs match the mock. | Implemented |
| H04 | Browse roles and How applying works CTAs navigate to their sections. | Implemented |
| H05 | Rotated left glass card shows a deterministically selected real role, department, options and brand. Selection rule is documented; zero roles has a sensible state. | Deviation — first catalog role is Web Developer, not the sample Cinematographer; zero roles omit the card. |
| H06 | Rotated right card shows live role/brand counts and overlapping real-brand marks using readable foreground colours. | Deviation — actual data has 16 roles and 7 hiring brands, not 8; all active brands remain in the marquee. |
| H07 | Floating cards hide at <=1180px. Hero type and spacing adapt on narrow screens. | Implemented |
| H08 | Hiring across our brands logo marquee uses actual brand assets, grayscale/opacity treatment and faded edges. Duplicates are hidden from assistive technology; focus/hover pause motion and reduced motion is static. | Implemented |
| H09 | Find your role heading and grouped-by-department subtitle precede the 270px/flexible results grid. | Implemented |
| H10 | Glass filter panel has Filters heading, functional Clear all, department checkboxes with counts, and Brand, Work arrangement, Engagement type and Experience pill groups. Sector is absent from the UI. | Deviation — compact desktop rows/chips and collapsible groups meet the viewport-fit requirement; filtering is unchanged. |
| H11 | Active filter pills have dark selected treatment; query state survives reload, browser history and shared URLs. Preserve OR within facets and AND across facets. | Implemented |
| H12 | Desktop filter panel stays 24px from the viewport top while scrolling results and stops at the end of its grid container. Verify with browser bounding boxes at multiple scroll positions. | Implemented |
| H13 | Below 900px has usable single-column filtering with sticky disabled; controls remain keyboard accessible. | Implemented |
| H14 | Glass 56px search field has search icon and accessible label; result count and individually removable blue selected chips appear below. | Implemented |
| H15 | Only nonempty department groups render in database order, with stable blue numbering, heading, accurate role count and hairline divider. | Implemented |
| H16 | Glass whole-card links have 20px radii, primary-brand accent top border, primary-first brand marks/names, title, verbatim options, salary pill, optional summary and View role arrow. | Implemented |
| H17 | Salary pills show Negotiable or actual configured range; fresher-welcome has blue treatment, other options neutral. No sample data is copied into jobs. | Deviation — current dev jobs retain actual negotiable modes/options, not the sample salaries/fresher selections; configured range/highlight rendering is tested. |
| H18 | Card grid adapts from desktop columns to mobile; long titles, salaries and Bengali text fit without clipping. Hover lift respects reduced motion. | Implemented |
| H19 | Empty search/filter and empty catalog states are clear and offer an appropriate reset. Existing no-JavaScript search/filter behaviour remains usable. | Implemented |
| H20 | How applying works has three glass cards: Find your role, Tell us about yourself, Keep your reference; blue 01–03 numbers and mock explanatory copy. | Implemented |
| H21 | Five accessible FAQ disclosures cover accounts, files, Bengali, multiple roles and data use. File guidance reflects actual enforced limits and privacy links work. | Deviation — upload answer also explains actual per-role limits and eight-file policy instead of copying incomplete sample guidance. |
| H22 | Shared footer and metadata are present. Screenshot comparisons cover desktop and mobile with data differences explained. | Implemented |

## Job detail

| ID | Acceptance check | Status |
| --- | --- | --- |
| J01 | Rounded dark gradient hero band has brand-coloured blurred orbs, All roles link, department label, actual title and optional summary. | Deviation — bounded accent/orb opacity keeps supporting white text readable even for bright owner accents. |
| J02 | White/translucent hero pills show real options, optional location and deadline. Hiring for badges use actual primary-first brand assets/names. | Implemented |
| J03 | Content and summary use flexible/340px columns with a 44px gap. Below 900px is single column with static summary. | Implemented |
| J04 | Description renders under About the role / Why this role exists with sanitised Markdown. | Implemented |
| J05 | Responsibilities render under What you will do / Key responsibilities with blue numbered list styling where the content is a list. Preserve other valid Markdown structure. | Implemented |
| J06 | Requirements and optional nice-to-have sections use mock headings and green check list styling without flattening valid Markdown. | Implemented |
| J07 | Nonempty skills render as glass pills; nonempty benefits render as glass tiles with blue check badges. Empty optional sections are omitted. | Deviation — captured dev role has no configured skills/benefits/nice-to-have; conditional sections are implemented and tested, not filled with sample text. |
| J08 | Hiring-brand cards use real logos/names, optional descriptions and validated website links. Placeholder descriptions are absent. | Implemented |
| J09 | Glass Ready to apply panel links to `/jobs/<slug>/apply`; job detail contains no application form or Turnstile widget. | Implemented |
| J10 | Glass Job summary has icon tiles and real Salary, optional Vacancy, Experience, Work arrangement, Engagement, Location and Deadline rows. Unset optional rows are absent. | Implemented |
| J11 | Summary Apply now button links to the separate Apply page. All selected active option labels and relevant engagement note remain visible. | Implemented |
| J12 | Desktop summary stays 24px from the viewport top and stops at the content container boundary; prove with bounding boxes at multiple scroll positions. | Implemented |
| J13 | Closed/expired jobs expose a clear closed state without an active application CTA; drafts and hidden-only jobs remain 404. | Implemented |
| J14 | Shared chrome, canonical metadata and mobile layout work; browser tests assert navigation rather than legacy `#apply` anchors. | Implemented |

## Apply

| ID | Acceptance check | Status |
| --- | --- | --- |
| A01 | Independent `/jobs/<slug>/apply` page returns 200 for an applicable role and has noindex metadata. It is excluded from sitemap. | Implemented |
| A02 | 820px centred layout has subtle decorative orbs and functional Back to job link. | Implemented |
| A03 | Glass 28px introduction card shows department, Apply for actual job title, real hiring brands, options, salary and optional location/deadline. | Implemented |
| A04 | Separate glass form panel uses mock spacing, blue uppercase section labels and a responsive two-column field grid. | Implemented |
| A05 | Personal & contact fields preserve existing labels, requiredness, autocomplete and server validation. CV requiredness follows the actual job. | Implemented |
| A06 | Configured question sections render from database definitions, in their existing order. Mock Professional/Experience/Skills/Role-specific questions are examples, not mandatory new fields. | Deviation — actual sections include Portfolio and extra configured contact questions; labels/types/order are retained exactly. |
| A07 | Text, email, URL, number, date and select controls use 50px height, 14px radius and pale input surface; textareas span the grid with usable vertical resizing. | Implemented |
| A08 | Single-choice cards and multiple-choice pills have blue selected border/surface styling, accessible grouping and working Other answers where configured. Boolean controls retain correct answer values. | Implemented |
| A09 | Dashed upload panels have upload icon, actual type/size guidance and Choose file control. Any advertised drop interaction works; progress, failure, removal and replacement states remain usable. | Deviation — real reservation-limit explanation/restart controls are retained in addition to mock styling; actual picker/drop upload passes. |
| A10 | Red required markers, help text and inline validation errors are associated with fields. Failed submission focuses or identifies invalid fields without losing entered answers. | Implemented |
| A11 | Consent checkbox and Privacy notice link are functional; unchecked consent is rejected server-side. | Implemented |
| A12 | Submit application is a real submit button, with pending/error state and existing duplicate-submit protection. Internal-team/reference explanatory text matches actual behaviour. | Implemented |
| A13 | Turnstile and existing private upload/submit flow remain functional; definitions and open/deadline state reload on the server. | Implemented |
| A14 | Successful submission reaches the reference confirmation page; Bengali name/answer and configured question types survive the apply/review happy path. | Implemented |
| A15 | Closed/expired roles have no usable form; invalid/draft/hidden-only jobs remain denied. | Implemented |
| A16 | Shared footer, keyboard flow and mobile single-column form have no overflow or obscured controls. Desktop/mobile screenshots are compared against the reference. | Implemented |

## Final evidence

### Supporting flows and fixes

| ID | Acceptance check | Status |
| --- | --- | --- |
| F01 | Diagnose the reported salary-radio initial-state discrepancy, fix a confirmed cause and verify stored negotiable/range modes in the editor. Record unreproduced behavior explicitly rather than claiming a speculative fix. | Not implemented — no confirmed cause/fix: SSR and hydrated stored-mode checks pass. Specific role/browser/reproduction steps are needed; no speculative state/data rewrite. |
| F02 | Success, privacy, 404 and public error recovery use shared public chrome/glass while retaining reference-only acknowledgement and the privacy draft/actual policy text. | Implemented |
| F03 | GET-only deployment smoke proves Job has no form/Turnstile, Apply is 200/noindex with a form, and sitemap includes Jobs but excludes Apply/private/success routes. | Implemented |

Record typecheck, lint, unit tests, relevant Playwright flows, sticky-position measurements and screenshot review in `docs/UI_VERIFICATION.md`. Document confirmed fixes, deviations from the mock, unverified checks and remaining owner questions explicitly. Do not mark this checklist passed based solely on source inspection.
