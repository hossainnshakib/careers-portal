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

## Pending workstreams
Inline job applications/lazy Turnstile/legacy redirect, draft privacy and utility pages, admin colour previews/dots, and the launch kit are still pending. Browser verification and Lighthouse are reserved for the final V1 pass; unit checks are not visual sign-off.
