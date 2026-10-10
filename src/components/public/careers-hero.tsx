import Link from "next/link";
import type { JobCard, PublicBrand } from "@/lib/careers/filters";
import { accentColor, cardBrands } from "@/lib/careers/presentation";
import { readableAccentText } from "@/lib/brands/contrast";
import { PublicBrandLogo } from "./public-brand-logo";
import { PublicIcon } from "./public-icon";

export function CareersHero({ jobs, brands }: { jobs: JobCard[]; brands: PublicBrand[] }) {
  const hiring = brands.filter(brand => jobs.some(job => job.brands.some(link => link.id === brand.id)));
  const featured = jobs[0];
  const featuredBrand = featured ? cardBrands(featured)[0] : undefined;
  const logos = (duplicate: boolean) => brands.map(brand => <li key={brand.id} className="shrink-0">
    <Link href={`/?brand=${encodeURIComponent(brand.slug)}#roles`} tabIndex={duplicate ? -1 : undefined} aria-label={`View roles at ${brand.name}`} className="block opacity-55 grayscale transition-opacity hover:opacity-100">
      {brand.logoUrl ? <PublicBrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} className="h-[30px] max-w-[110px]" decorative={duplicate} /> : <span className="text-[14px] font-bold">{brand.name}</span>}
    </Link>
  </li>);
  return <>
    <section aria-labelledby="careers-title" className="relative isolate">
      <div aria-hidden="true" className="ui-orbs pointer-events-none absolute inset-0 -z-10 overflow-clip">
        {hiring.slice(0, 6).map((brand, index) => <span key={brand.id} className="absolute h-[380px] w-[380px] rounded-full opacity-30 blur-[90px]" style={{ backgroundColor: accentColor(brand.accentColor), left: `${4 + index * 16}%`, top: index % 2 ? "60px" : "-120px" }} />)}
      </div>
      <div className="relative mx-auto max-w-[1360px] px-6 pb-16 pt-20">
        {featured && <Link href={`/jobs/${featured.slug}`} className="ui-float-card ui-glass absolute left-8 top-24 w-[236px] -rotate-5 flex-col gap-2.5 rounded-[22px] p-4">
          <span className="text-[10.5px] font-bold uppercase tracking-[.06em] text-ui-muted">{featured.department.name}</span>
          <span className="text-[17px] font-extrabold tracking-[-.01em]">{featured.title}</span>
          <span className="flex flex-wrap gap-1.5">{featured.options.filter(option => option.group !== "experience").map(option => <span className="ui-pill" key={`${option.group}:${option.slug}`}>{option.label}</span>)}</span>
          {featuredBrand && <PublicBrandLogo name={featuredBrand.name} src={featuredBrand.logoUrl} slug={featuredBrand.slug} className="h-[24px] max-w-[110px]" />}
        </Link>}
        <div className="ui-float-card ui-glass absolute right-8 top-[84px] w-[220px] rotate-4 flex-col gap-2.5 rounded-[22px] p-[18px]" aria-label="Hiring statistics">
          <span className="text-[12px] font-bold text-ui-muted">Open roles</span>
          <span className="text-[44px] font-extrabold leading-none tracking-[-.03em]">{jobs.length}</span>
          <div aria-hidden="true" className="flex flex-wrap pl-2">{hiring.map(brand => <span key={brand.id} className="-ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white text-[12px] font-extrabold" style={{ backgroundColor: accentColor(brand.accentColor), color: readableAccentText(brand.accentColor) }}>{Array.from(brand.name)[0]}</span>)}</div>
          <span className="text-[12px] font-semibold text-ui-muted">{hiring.length} {hiring.length === 1 ? "brand" : "brands"} hiring</span>
        </div>
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-[22px] text-center">
          <p className="ui-glass inline-flex flex-wrap items-center justify-center gap-[9px] rounded-full px-4 py-2 text-[13px] font-bold">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ui-success" />We&rsquo;re hiring · {jobs.length} open {jobs.length === 1 ? "role" : "roles"} · {hiring.length} {hiring.length === 1 ? "brand" : "brands"}
          </p>
          <h1 id="careers-title" className="text-[42px] font-extrabold leading-[1.04] tracking-[-.035em] sm:text-[68px]">Good work starts here.<br /><span className="mt-2 block text-[28px] tracking-[-.03em] text-ui-muted sm:text-[44px]">Find your place across our brands.</span></h1>
          <p className="max-w-[560px] text-[18px] leading-[1.6] text-ui-muted">Browse open roles, pick one that fits, and apply in a few steps. No account needed.</p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-3">
            <a href="#roles" className="ui-button ui-button-pill shadow-[0_10px_30px_rgba(11,18,32,.25)]">Browse roles <PublicIcon name="down" /></a>
            <a href="#how" className="ui-glass inline-flex items-center gap-[9px] rounded-full px-[26px] py-[15px] text-[15px] font-bold">How applying works <PublicIcon name="external" /></a>
          </div>
        </div>
      </div>
    </section>
    {!!brands.length && <section aria-label="Hiring across our brands" className="mx-auto max-w-[1100px] px-6 pb-7 pt-2 text-center">
      <h2 className="mb-[18px] text-[12.5px] font-bold uppercase tracking-[.08em] text-ui-muted">Hiring across our brands</h2>
      <div className="brand-marquee py-1"><div className="brand-marquee-track"><ul>{logos(false)}</ul><ul aria-hidden="true" className="brand-marquee-copy">{logos(true)}</ul></div></div>
    </section>}
  </>;
}
