# DESIGN — Careers Portal

## Feel
A confident, calm careers hub for a group of brands. Cool-white canvas, dark ink, blue accents, generous rounded glass panels and restrained brand-colour orbs. Not a Google Form, not a generic HR SaaS, not a job marketplace. Mobile first: most candidates arrive from a phone.

## Logos
- Source files: `design/logos/<slug>.svg` (Illustrator exports, viewBox 1000×398, text already outlined, no embedded images or scripts). Copy to `public/brands/<slug>.svg`.
- Show logos only via `<img>` (never inline SVG). Put every logo in a fixed-size box with `object-fit: contain` so different logos look balanced. Fixen Media's artwork fills its canvas while the others have padding, so tune per-brand scale via a small optional `logoScale` map if needed.
- Several logos contain taglines that are unreadable at small sizes. Brand marks on job cards, hero floating cards, Job/Apply "Hiring for" chips and "Who you would work with" cards show the logo only (no visible name), with meaningful alt text and a title tooltip for accessibility. Per-brand optical `logoScale` tuning lives in `PublicBrandLogo`. In filter chips and small UI use the brand NAME as text, optionally with a small accent dot.
- Logos are dark or colourful. Always place them on a light panel, even in dark mode, so Mactie and Builtale never disappear.
- Admin-uploaded logos: png/webp/svg, ≤ 1 MB, SVG sanitised (see SCHEMA.md).

## Brand accents
Each brand has an `accent_color` (see SEED_DATA.md). Use it sparingly: a thin top border or dot on job cards, the PDF header band, the brand header on `?brand=` views. Check contrast; never put light text on the lime-ish Wiki Bangla green without checking.

## Typography
- Bengali: Hind Siliguri or Noto Sans Bengali (self-host; OFL). Latin: one clean sans (for example Inter or Geist). Define a font stack with Bengali fallbacks so mixed text renders well. Body 16px minimum on mobile.
- Public and admin fonts are self-hosted Plus Jakarta Sans Variable plus Hind Siliguri 400/500/600/700 from Fontsource, with OFL licence files in `assets/fonts/` and the packages. Font overrides are scoped to `.public-ui` and `.admin-ui`. Bengali faces load on demand. Candidate PDFs retain tested static Hind Siliguri Regular/Bold; PDF layout/fonts are unchanged.
- Root Inter is not preloaded; the root skip link uses a system font. Checklist ticks use CSS strokes rather than a glyph that triggers a Bengali fallback download on English-only pages.
- Candidate names and answers may be Bengali: every screen that shows them, and the PDF, must render Bengali correctly (conjuncts, vowel signs).

## Layout and components
- Careers home follows `design/mockup/Home-html`: glass pill header with blue-dot Careers wordmark, live hiring pill, centred headline/subheadline, two CTAs, blurred brand orbs and desktop tilted role/stats cards. Small grayscale brand logos link to URL filters in a faded-edge marquee. Compact glass filters, search/removable chips and expanded numbered department groups precede glass job cards with brand-accent top borders, small logos/names, verbatim options, blue fresher highlights, green salary pills and View role arrows. Three glass applying-step cards, FAQ disclosures and a light footer complete the home.
- Below 900px, every filter group moves into an accessible bottom sheet; cards become single column. Floating hero cards hide at <=1180px. Public touch/input text adapts for mobile without changing admin utilities.
- The `.public-ui` design system replaces the poster theme: canvas `#F2F5FB`, ink `#0B1220`, muted `#5B6577`, blue `#2F6BFF`, white translucent panels, hairline borders and soft shadows. See `UI_ACCEPTANCE.md` for precise typography/radii/layout. Glass uses 24px blur with 170% saturation; nested panels never stack backdrop blur. Unsupported blur gets a 92%-white fallback; reduced transparency uses solid white and hides orbs. Marquee pauses on hover/focus and has a visible Pause/Play button (WCAG 2.2.2); under reduced motion it becomes static wrapped links with the duplicate hidden, and card hover lift is disabled too.
- At >=900px the public header is a floating glass pill sticky at top 0 with high z-index; the header wrapper is fully transparent so Home hero orbs/gradient extend behind it. Home filter panel and Job Summary use sticky top 96px (header height + gap), align-self start, viewport max-height `calc(100vh - 96px - 24px)` and internal thin scrollbars only when content overflows. Grids align items at start; scrolling ancestors stay free of vertical overflow clipping. Filter disclosures have compact desktop spacing and remain collapsible. Below 900px sticky is disabled. Anchor targets `#roles`, `#how` and `#faq` use scroll-margin-top to clear the floating header. Browser regression cases at 1440x900/1280x720 verify offset, moving content, container boundaries, header stickiness and mobile/900px behavior; execution evidence belongs in UI_VERIFICATION.md.
- Measured small-text contrast uses chip ink `#26324A` for nav and darker green `#08694F` for salary text, a slight deviation from the mock's muted/green values. Job Summary uses valid direct dt/dd pairs. Local production Lighthouse scores are 95 performance/100 accessibility/100 best practices for both Home and Job; see UI_VERIFICATION.md for all pages and limits of this evidence.
- Job detail follows `Job detail-html`: a deep dark primary-brand-tinted rounded hero, locally clipped brand orbs, All roles link, department/title/summary, option/location/deadline pills and all visible hiring-brand badges. The body has optional sanitised sections, numbered responsibilities, checked requirements/nice-to-have, skill pills, glass benefit/brand cards, final Ready to apply panel and a 340px glass summary column with the viewport-bounded sticky rule above. Summary rows omit unset optional values; experience combines text/options and engagement includes its note. Apply buttons use the real `/jobs/<slug>/apply` URL. Closed/expired jobs show a notice with no Apply button; drafts/hidden-only roles return 404. Sanitised Markdown renders with `overflow-wrap: anywhere` so a long unbroken URL breaks lines instead of overflowing narrow screens.
- Apply is its own noindex server-rendered page with Back to job, real-data glass context card and a separate form panel. Blue section labels and a responsive two-column field grid retain current definitions; long text, choices and uploads span the row. Inputs use 50px height/14px radii/pale surfaces, radio cards and checkbox pills show blue selection, and dashed upload panels support Choose file and actual drag-and-drop through the same upload pipeline. Required consent, lazy Turnstile, upload retries/removal/restart, submit pending/error states and server validation remain. Public-only CSS hooks style the shared question renderer without changing admin preview styling. Field errors are linked to help text and a focusable summary; the developer UTC-date paragraph is removed.
- Success, privacy, public errors and 404 content use glass panels and the shared chrome. Unmatched root URLs get an explicit public layout because they have no route-group wrapper; route-group 404 content does not duplicate that shell. Success shows only a syntactically valid reference and plain next steps, with no timing promise. Privacy retains its owner-review draft and actual provider/retention/deletion wording.
- Admin follows the 14 boards in `design/mockup/careers-admin-mockups/`, with its own `src/app/admin/admin.css` system: cool-white canvas, ink/blue accents, glass cards/sidebar, rounded controls, status pills and real brand logos with initial fallbacks. The mobile shell switches to a focus-contained slide-over below 800px; tables become semantic card stacks. Applicant profile keeps the content/340px review rail, with a native mobile disclosure. Settings is split over the existing Departments and Options routes. Auth uses a centred card and six-cell TOTP entry. Business rules and authorization stay unchanged. See `ADMIN_UI_RESTYLE.md` for deliberate differences and verification. No UI library was added.
- Admin fidelity (2026-10-12) supersedes the prior restyle's unapproved differences;
  `ADMIN_ACCEPTANCE.md` governs reconciliation. Data cards use .76-white/14px
  blur, chrome .58-white/24px blur; no nested backdrop blur. Dashboard now uses
  the board's accent initials, not tiny logos, and six desktop/three mobile latest
  rows with disclosure of the complete existing ten-row set. Mobile department
  statistics remain accessible in a collapsed disclosure. Combined Settings,
  markdown toggles and publish/add-question dialogs are required pending work,
  not accepted omissions. Existing logo rendering remains for the brand uploader
  and unreconciled screens until their own checkpoints. All real fields survive.
- Applications fidelity: compact filter row, More filters for inclusive end date/
  sort/timezone guidance, chips below/on the mobile Filters row, reference column
  proportions, accent initials and Applied before pills. Read-only email history
  is computed server-side, not inferred from names. All filters remain URL-driven.
- Applicant fidelity: repeated desktop name with inline status, initial marks,
  grouped answer/history cards and nested previous-application cards; one sticky
  340px review glass panel becomes an open mobile disclosure above the content.
  Personal rows retain two columns at 390px. All real metadata and PDF/privacy
  guidance survive; the filled delete-confirmation red meets text contrast.
- Jobs fidelity: compact Status/Department/Brand/Search row, reference column
  proportions, accent initials and short dates. Labelled submit/reset icons retain
  filter actions. Drawn row disclosures keep keyboard focus and viewport-safe
  placement; mobile semantic cards avoid the reference's clipped actions.
- Editor shell/Publish fidelity: .58-white sticky bar at 8px with drawn command
  labels, secondary draft-save, additional lifecycle commands in More actions.
  Mobile Duplicate is disclosed to fit the viewport. Native Publish modal shows
  actual title/path/slug warning and advisory readiness/blockers; only confirmation
  invokes the existing authorized server save. Other editor blocks remain pending.
- Empty, loading and error states for every list. Accessible by default (labels, focus rings, contrast, keyboard use, `aria-live` for form errors).

## Metadata, sharing and site identity
- Every public page has a title and a one-sentence description from real data (Home: fixed tagline; Job: role title + brand; Apply/Success are `noindex`). Metadata is defined with the Next.js `metadata` API — root layout supplies `title.template`, `metadataBase`, icons and the manifest; pages override per-route.
- Job detail emits JSON-LD `JobPosting` (buildable from real fields only; empty fields and `baseSalary` are omitted; never for closed/expired/draft jobs) via `src/lib/seo/job-posting.ts`.
- Social previews: `opengraph-image` on Home (wordmark text) and per job (brand initials chip — satori cannot rasterise the SVG logos), plus `twitter:card` `summary_large_image`. Icons: `src/app/icon.svg`, a generated apple-touch PNG and `manifest.webmanifest`.
- `robots.txt` and `sitemap.xml` list only indexable public routes; Apply/Success/admin are excluded or `noindex`.

## Dark mode
Optional for the public site in V1. If implemented, logos stay on light panels. Admin may be light-only in V1.

## Reference material
The approved public references are `design/mockup/Home-html`, `Job detail-html` and `Apply-html`. Admin references are `design/mockup/careers-admin-mockups/`. The poster references are superseded. Rendered references/comparisons remain ignored; `UI_ACCEPTANCE.md` is the public numbered acceptance baseline.
