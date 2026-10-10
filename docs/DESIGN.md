# DESIGN — Careers Portal

## Feel
A confident, calm careers hub for a group of brands. Cool-white canvas, dark ink, blue accents, generous rounded glass panels and restrained brand-colour orbs. Not a Google Form, not a generic HR SaaS, not a job marketplace. Mobile first: most candidates arrive from a phone.

## Logos
- Source files: `design/logos/<slug>.svg` (Illustrator exports, viewBox 1000×398, text already outlined, no embedded images or scripts). Copy to `public/brands/<slug>.svg`.
- Show logos only via `<img>` (never inline SVG). Put every logo in a fixed-size box with `object-fit: contain` so different logos look balanced. Fixen Media's artwork fills its canvas while the others have padding, so tune per-brand scale via a small optional `logoScale` map if needed.
- Several logos contain taglines that are unreadable at small sizes. Use the logo only in cards (medium size) and the brand header (large). In filter chips and small UI use the brand NAME as text, optionally with a small accent dot.
- Logos are dark or colourful. Always place them on a light panel, even in dark mode, so Mactie and Builtale never disappear.
- Admin-uploaded logos: png/webp/svg, ≤ 1 MB, SVG sanitised (see SCHEMA.md).

## Brand accents
Each brand has an `accent_color` (see SEED_DATA.md). Use it sparingly: a thin top border or dot on job cards, the PDF header band, the brand header on `?brand=` views. Check contrast; never put light text on the lime-ish Wiki Bangla green without checking.

## Typography
- Bengali: Hind Siliguri or Noto Sans Bengali (self-host; OFL). Latin: one clean sans (for example Inter or Geist). Define a font stack with Bengali fallbacks so mixed text renders well. Body 16px minimum on mobile.
- Public fonts are self-hosted Plus Jakarta Sans Variable plus Hind Siliguri 400/500/600/700 from Fontsource, with OFL licence files in `assets/fonts/` and the packages. Admin retains Inter and the existing Hind Siliguri fonts; public font-family overrides are scoped to `.public-ui`. Bengali faces load on demand. Candidate PDFs retain tested static Hind Siliguri Regular/Bold; PDF layout/fonts are unchanged.
- Candidate names and answers may be Bengali: every screen that shows them, and the PDF, must render Bengali correctly (conjuncts, vowel signs).

## Layout and components
- Careers home follows `design/mockup/Home-html`: glass pill header with blue-dot Careers wordmark, live hiring pill, centred headline/subheadline, two CTAs, blurred brand orbs and desktop tilted role/stats cards. Small grayscale brand logos link to URL filters in a faded-edge marquee. Compact glass filters, search/removable chips and expanded numbered department groups precede glass job cards with brand-accent top borders, small logos/names, verbatim options, blue fresher highlights, green salary pills and View role arrows. Three glass applying-step cards, FAQ disclosures and a light footer complete the home.
- Below 900px, every filter group moves into an accessible bottom sheet; cards become single column. Floating hero cards hide at <=1180px. Public touch/input text adapts for mobile without changing admin utilities.
- The `.public-ui` design system replaces the poster theme: canvas `#F2F5FB`, ink `#0B1220`, muted `#5B6577`, blue `#2F6BFF`, white translucent panels, hairline borders and soft shadows. See `UI_ACCEPTANCE.md` for precise typography/radii/layout. Glass uses 24px blur with 170% saturation; nested panels never stack backdrop blur. Unsupported blur gets a 92%-white fallback; reduced transparency uses solid white and hides orbs. Marquee pauses on hover/focus and becomes static wrapped links with hidden duplicate under reduced motion; card hover lift is disabled too. Sticky behaviour is implemented/tested separately at the final interaction step.
- Job detail: "We're hiring · Department" kicker, huge title, pill tags (options, experience text, salary/vacancies, location), bold Hiring for row with tiny logos, lead summary; then About/Responsibilities/Requirements/Nice to have, skills pills and red-triangle benefit bullets. Apply is a dark ink block (`#apply`) with the form in a light card; top and mobile sticky anchors lead to it. Closed/expired jobs retain content in the same dark block with a clear no-form state; drafts return 404.
- Apply form: one column within the dark apply block's light card, grouped by section, clear required markers, inline errors, upload widgets with file name/size, remove, and per-file errors. Turnstile mounts when the form is near the viewport or a field receives input/focus. Privacy note/link and a required consent checkbox sit near submit. Success shows only a syntactically valid reference and plain next steps, with no timing promise.
- Admin: functional and dense but tidy with native accessible controls/Tailwind tables, toolbar filters, status badges and a clear New indicator. Tiny brand dots preserve neutral label text; the accent editor has a live WCAG preview using readable black/white text. Applicant profile uses two desktop columns (content and status/notes/download sidebar). No UI kit was added.
- Empty, loading and error states for every list. Accessible by default (labels, focus rings, contrast, keyboard use, `aria-live` for form errors).

## Dark mode
Optional for the public site in V1. If implemented, logos stay on light panels. Admin may be light-only in V1.

## Reference material
The approved public references are `design/mockup/Home-html`, `Job detail-html` and `Apply-html`. The poster references are superseded. Rendered references/comparisons remain ignored; `UI_ACCEPTANCE.md` is the numbered acceptance baseline. Admin keeps its neutral look.
