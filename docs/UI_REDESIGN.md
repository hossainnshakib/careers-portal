# V1 public UI redesign

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

## Pending workstreams
The launch kit is still pending. Browser verification and Lighthouse are reserved for the final V1 pass; unit checks are not visual sign-off.
