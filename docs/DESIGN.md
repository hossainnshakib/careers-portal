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
- Careers home: Careers wordmark and Roles/How it works/FAQ navigation; live-count hero, segmented brand-accent word underline and real-title CSS marquee; one optically balanced brand-filter logo row; expanded sticky non-brand sidebar and search above department-grouped 3/2/1 whole-card results. All matching departments stay expanded. Cards use tiny brand marks, neutral text and hairline accent top borders. Applying steps, native FAQ accordions and a simple contact/brand-website/privacy footer follow the results.
- Mobile: non-brand filters in a bottom sheet; search above results; large touch targets.
- Public tokens use a warm off-white canvas, dark ink, regular/bold weights and one 0.5rem panel radius; medium/semibold utilities map to bold. No shadows or decorative artwork. The marquee pauses on hover/focus; reduced motion disables animation, hides the duplicate and wraps the original real links. Poster originals were viewed but the optional stack is omitted for the minimal first pass.
- Job detail: brand header (logo + name), title, badges, apply button (sticky on mobile), sections for About the role, Responsibilities, Requirements, and a short "How applying works" note.
- Apply form: one column, grouped by section, clear required markers, inline errors, progress feel (not a multi-page wizard), upload widgets with file name, size, remove, and per-file errors. Privacy note near the submit button. Success page shows the reference number and what happens next (plain wording, no promises about timing).
- Admin: functional and dense but tidy (shadcn/ui tables, filters in a toolbar, status badges with distinct colours, a clear "New" indicator). Applicant profile uses two columns on desktop: main sections left, sidebar (status, notes, downloads) right.
- Empty, loading and error states for every list. Accessible by default (labels, focus rings, contrast, keyboard use, `aria-live` for form errors).

## Dark mode
Optional for the public site in V1. If implemented, logos stay on light panels. Admin may be light-only in V1.

## Reference material
If the owner adds poster artwork (colours, type) under `design/poster-ref/`, align accents and tone with it so the portal and the posters feel like one family.
