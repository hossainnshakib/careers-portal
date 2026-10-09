# DESIGN — Careers Portal

## Feel
A confident, calm careers hub for a group of brands. Clean, editorial, a little warm. Not a Google Form, not a generic HR SaaS, not a job marketplace. Lots of white space, strong typography, restrained colour, logos treated with respect. Mobile first: most candidates arrive from a phone.

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
- Implemented website fonts are self-hosted Inter plus Hind Siliguri; Bengali faces load on demand rather than preloading unused fonts on English-first pages. Candidate PDFs use tested static Hind Siliguri Regular/Bold, never the website variable Inter file. PDF branding uses rasterized validated logos on white, black body text and a restrained accent band for grayscale readability.
- Candidate names and answers may be Bengali: every screen that shows them, and the PDF, must render Bengali correctly (conjuncts, vowel signs).

## Layout and components
- Careers home: Careers wordmark with a red dot and Roles/How it works/FAQ navigation; poster-style hero ("We're hiring · N roles" pill kicker, huge font-black headline with a red accent word, dual CTA), reduced-motion-safe marquee of real job titles in pills (some titles in red); one optically balanced brand-filter logo row; expanded sticky non-brand sidebar and search above department-grouped 3/2/1 whole-card results with red department numbers and pill tags (fresher-welcome in red). All matching departments stay expanded. Cards use tiny brand marks, neutral text and brand-accent top borders. Applying steps (red step numbers), native FAQ accordions and a dark ink footer with brand-website links complete the public home.
- Mobile: non-brand filters in a bottom sheet; search above results; large touch targets.
- Public theme (V2, scoped via `.public-theme` on the public layout so admin keeps its own look): warm grey canvas `#edece7`, near-black ink `#141412`, card `#f8f7f2`, red accent `#e0341f` (buttons are black-on-red, AA), hairline borders `#d5d2c8`, tight 0.375rem radius, font-black tight-leading display type; medium/semibold utilities map to bold. Red is reserved for accents, large display words, numbers and bullets — never long body text. No shadows or decorative artwork. The marquee pauses on hover/focus; reduced motion disables animation, hides the duplicate and wraps the original real links.
- Job detail: "We're hiring · Department" kicker, huge title, pill tags (options, experience text, salary/vacancies, location), bold Hiring for row with tiny logos, lead summary; then About/Responsibilities/Requirements/Nice to have, skills pills and red-triangle benefit bullets. Apply is a dark ink block (`#apply`) with the form in a light card; top and mobile sticky anchors lead to it. Closed/expired jobs retain content in the same dark block with a clear no-form state; drafts return 404.
- Apply form: one column within the dark apply block's light card, grouped by section, clear required markers, inline errors, upload widgets with file name/size, remove, and per-file errors. Turnstile mounts when the form is near the viewport or a field receives input/focus. Privacy note/link and a required consent checkbox sit near submit. Success shows only a syntactically valid reference and plain next steps, with no timing promise.
- Admin: functional and dense but tidy with native accessible controls/Tailwind tables, toolbar filters, status badges and a clear New indicator. Tiny brand dots preserve neutral label text; the accent editor has a live WCAG preview using readable black/white text. Applicant profile uses two desktop columns (content and status/notes/download sidebar). No UI kit was added.
- Empty, loading and error states for every list. Accessible by default (labels, focus rings, contrast, keyboard use, `aria-live` for form errors).

## Dark mode
Optional for the public site in V1. If implemented, logos stay on light panels. Admin may be light-only in V1.

## Reference material
The public site follows the poster family in `design/poster-ref/` (warm grey canvas, black ink, vivid red accent words, pill tags, red-triangle bullets) and the hero/homepage images in `design/reference/`. Keep new public surfaces in that family; admin keeps its neutral look.
