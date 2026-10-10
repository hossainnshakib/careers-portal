# Public UI redesign history

## Mock-up rebuild — Home checkpoint (branch `public-ui-from-mockup`)

### Job detail and route split checkpoint
- Job detail now matches the dark hero/content/summary structure of `Job detail-html`, with primary-brand tint, real primary-first brands, optional sanitised sections, skill/benefit/brand cards and two real Apply URLs. It imports no application form or Turnstile; current visibility/status/deadline checks remain authoritative.
- Apply no longer re-exports JobPage: its independent server shell uses current job/questions/CV policy, noindex metadata, Back to job and a glass context/form panel. This dependency is delivered with the Job checkpoint so removing the inline form does not break applications; detailed form and utility-page restyling follows.
- Closed/expired roles have no usable form/Apply CTA; drafts/hidden-only remain 404. Unit coverage preserves these gates, sanitisation and metadata while asserting the new route separation. Smoke assertions and final browser execution are still pending.

### Apply form and utility-page checkpoint
- Apply's existing form logic now has the mock's two-column contact/dynamic field layout, blue section labels, pale rounded inputs, selected radio cards/checkbox pills, dashed upload panels, linked consent/privacy and submit/reassurance treatment. All eleven question types, configured upload restrictions and current CV policy remain; the UTC developer paragraph is removed.
- Upload drop and picker share the existing validation/reservation/retry/direct-Storage path. Progress, failure, retry, removal and Start fresh uploads are retained, with plain eight-file guidance that explains removed files still count. No storage/submission/security rule changed.
- Success/privacy/public error/404 content uses the glass system. Root unknown URLs receive shared public chrome, while route-group not-found renders content only. Reference syntax/no-lookup/noindex and the privacy draft/providers/retention text are preserved.
- Focused form tests cover all eleven rendered types, real upload limits, CV policy/consent, lazy CAPTCHA, Bengali, selected Other/boolean values and linked errors. Browser upload assertions now cover local invalid-file rejection and actual drag-and-drop; their execution remains part of final verification.

### Sticky implementation checkpoint
- Home filters and Job Summary use sticky top 24px at >=900px with viewport max-height, internal thin scrollbars, start-aligned grids and no overflow-clipping ancestor. Desktop filter rows/chips/disclosure spacing are compacted to meet the laptop-height requirement; groups remain collapsible. Mobile is static.
- Four production-browser regression cases cover both panels at 1440x900/1280x720, moving content versus fixed panel offsets, ancestor overflow, container release, footer separation and mobile/exact-900px rules. Where natural document scroll room is insufficient to observe release, the test transparently adds temporary room after the footer without changing panel/container geometry. Tests are added but their execution/proof remains pending in final verification.

### Deployment smoke checks
- The existing GET-only `pnpm smoke -- <origin>` now requires Job detail to have no form or CAPTCHA script, independent Apply to return 200 with a real form/noindex/no legacy anchor, and sitemap to include the discovered Job while excluding Apply/admin/API/success URLs. It retains anonymous authorization, enforced CSP/header and response-leak checks. Pure/mock-HTTP coverage passes; real network execution remains final/deployment verification.

- The approved HTML mock-ups supersede the poster presentation below. Home and shared header/footer now use public-scoped Plus Jakarta Sans/Hind Siliguri, cool-white/ink/blue tokens, rounded glass panels and brand-coloured hero orbs. Admin/data model/security/submission logic remain accepted.
- Removed job-title marquee, large brand-filter strip and old sidebar/card markup. Replaced them with small grayscale brand-logo filter links, a stable first-catalog-job floating card, actual hiring-brand stats, compact collapsible filter groups and mock-style department cards with salary/options/summary/View role.
- Brand is now in both desktop/mobile filter panels; Sector is not a picker, but existing sector URLs and removable chips still work. Initial URL-driven rendering and the existing cross-facet matching/count contracts remain intact. Option ordering uses the existing cached active catalog rows.
- Glass fallback/reduced-transparency and reduced-motion handling are implemented without animation libraries or nested blur. Contact is omitted unless configured. Job/Apply route separation, utility-page styling, sticky behaviour/tests, full screenshots and final verification are the remaining checkpoints; historical completion results below do not verify this rebuild.

## V2 — managed job options + poster-family redesign (branch `v2-job-model-and-ui`)

### Data model and admin
- Replaced the fixed `employment_type` / `work_mode` / `experience_level` columns with managed option lists (`job_options` + `job_option_links`, migrations 0004/0005). Option slugs equal the legacy enum values so old filter URLs keep working; labels render verbatim everywhere.
- Job editor: per-group checkbox fieldsets (experience optional), publish pre-check (`missingPublishGroups`: ≥1 arrangement + ≥1 engagement), plus salary (negotiable/range + text), vacancies, experience text, engagement note, skills, benefits and nice-to-have markdown fields. Jobs list shows option tags per row.
- New `/admin/options` surface (protected, in the admin nav) to create/edit/activate/reorder options; delete only while unlinked.
- Applications require an explicit privacy-consent checkbox; `applications.consent_at` is stored and shown on the admin profile header and the candidate PDF.
- `/jobs/:slug/apply` renders the same job page inline with `robots: noindex, follow` (the v1 HTTP 308 redirect is gone); the deployment smoke check asserts 200 + noindex + inline `#apply` form. Brand default accents: `seed:base` fills an accent only when a brand has none; owner edits are never overwritten.

### Public design system (scoped `.public-theme`)
- Public layout subtree opts into a poster-family theme (warm grey canvas `#edece7`, ink `#141412`, card `#f8f7f2`, red accent `#e0341f` with black-on-red AA buttons, hairline borders, 0.375rem radius, font-black display type); admin keeps the existing root tokens untouched.
- Header: bold wordmark with red dot. Footer: dark ink band with brand-website links and contact email.
- Hero: "We're hiring · N roles" pill kicker, huge headline with a red accent word, dual CTA, and a reduced-motion-safe marquee of real job titles as pills (every fourth title in red). Filters/chips/tags are pill-shaped; results show red department numbers, pill tags (fresher-welcome in red) and salary pills. How-it-works uses red step numbers; FAQ and info sections use heavier display type.
- Job detail: poster hiring header with pill tags, red-triangle benefit bullets, skills pills, and a dark `bg-ink` apply block containing the form in a light card; the closed state is the same dark block without `id="apply"` or a form. Success and privacy pages inherit the theme with heavier headings.
- Verification: typecheck/lint/unit (528 passed) and the full Playwright suite (18 passed, Lighthouse opt-in skip) pass; `pnpm build` with the PDF trace guard passes. See V2_VERIFICATION.md.

## V1 — first public UI pass

## Implemented — careers home
- Public route-group shell: Careers wordmark, Roles/How it works/FAQ navigation, website/contact/privacy footer. Admin layout remains separate; root still supplies fonts, skip link and document CSP nonce.
- Live cached counts and real-title marquee, with an aria-hidden non-tab-stop duplicate. Reduced-motion users get static wrapping links; hover and focus pause motion.
- One active-brand logo strip with optical scale adjustments, toggle state and mobile snap-scroll. A single selected brand may show its description and a reset control, without another large logo header.
- Existing nuqs URL params, OR/AND semantics and cross-facet counts retained. Non-brand facets are expanded in the sticky desktop sidebar and native mobile bottom sheet; search sits above results and all selected filters have removal controls.
- Department groups follow the database-ordered department array; empty groups are hidden and canonical section numbering remains stable. Whole-card links use 3/2/1 columns and no more than two small brand marks, primary first.
- Three applying steps and five real FAQs. `NEXT_PUBLIC_CONTACT_EMAIL` is an optional validated public setting; absent configuration displays a clear placeholder. Only valid HTTP(S) brand websites are linked.
- Inter/Hind Siliguri, regular/bold, warm neutral canvas, one panel radius, visible focus and no shadows. Originals in design/reference and design/poster-ref stay untracked; optional poster imagery is omitted.

## Separation for later polish
`CareersHub` owns URL/filter interactions; `lib/careers/filters.ts` owns matching/count contracts; `presentation.ts` owns ordered grouping/primary-brand selection/passive colour and link selection. Hero, results, info, header and footer components are thin presentation. Theme values/motion are in globals.css.

## Implemented — inline job applications
Job pages have a small primary-first Hiring for row, sanitized role content and the existing application form at `#apply`. Top/mobile anchors scroll to it. Form definitions and current open/deadline/CV state reload uncached; submit authorization and Storage flow are unchanged. Closed/expired roles have no form, and drafts/hidden-only roles return 404. Next config supplies the legacy apply HTTP 308 before streaming; the old page retains a validated redirect fallback and its obsolete loading boundary is removed. Turnstile mounts only near the form or on input/focus, retaining document nonces and real server verification.

## Implemented — public utility pages
Privacy describes actual collection, administrator access/downloads, providers, deletion requests and the absence of automatic submitted-application retention, prominently marked as an owner-review draft. The optional configured contact is shared with the footer. Public/root 404 and generic error recovery avoid provider diagnostics. Home/job/privacy have canonical/Open Graph basics; sitemap includes privacy and open roles, never private or success URLs. Reference-only success remains noindex, validates syntax and does not look up applicants. The final Lighthouse case now targets home/job/success.

## Implemented — light admin touches
Job/application lists and latest applications show tiny current-brand dots beside neutral text. Application snapshot names are preserved; a unique exact current-name match supplies colour, while renamed/ambiguous names use neutral fallback. Lists use bounded bulk lookups, not one query per row. The existing accent editor has a live readable-text/contrast preview. Black/white selection covers every sRGB accent at >=4.5:1; PDF branding already uses a border on a neutral header rather than text on an accent background. Fresh Doshok defaults use teal; existing stored choices are untouched.

## Launch preparation delivered
RUNBOOK, VERCEL_CHECKLIST and BRAND_LINKS cover owner-only production setup, backups/restore/rollback, DNS, region/plan choices, MFA/Turnstile/private data and website/poster conventions. Separate allowed-target owner setup commands preserve dev-only guards; draft-shell and public CSV tools are implemented without schema/dependency changes. Vercel region currently matches Mumbai dev; final production choice belongs to the owner.

## Local verification complete
The final default/live/build/browser/audit/privacy/Lighthouse pass is recorded in V1_VERIFICATION.md, including the corrected cold-catalog contention and visible card-name issue. All 17 production browser cases passed. This is not hosted or production sign-off: owner preview/real-phone/backup-restore/production-key checks remain external launch tasks.
