import Link from "next/link";
import type { JobCard, PublicBrand } from "@/lib/careers/filters";
import { accentColor } from "@/lib/careers/presentation";

export function CareersHero({ jobs, brands }: { jobs: JobCard[]; brands: PublicBrand[] }) {
  const titles = (duplicate: boolean) => jobs.map((job, index) => <li key={job.id}>
    <Link href={`/jobs/${job.slug}`} tabIndex={duplicate ? -1 : undefined}
      className={`block whitespace-nowrap rounded-full border border-border bg-card px-4 py-2.5 font-bold ${index % 4 === 3 ? "text-poster" : ""}`}>{job.title}</Link>
  </li>);
  return <section aria-labelledby="careers-title" className="pb-10 pt-12 sm:pt-16">
    <div className="mx-auto max-w-3xl text-center">
      <p className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 font-bold">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-poster" />
        We&rsquo;re hiring · {jobs.length} open {jobs.length === 1 ? "role" : "roles"} across {brands.length} {brands.length === 1 ? "brand" : "brands"}
      </p>
      <h1 id="careers-title" className="mt-8 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">Good work
        starts <span className="text-poster">here</span>.</h1>
      <p className="mt-6 text-lg text-muted-foreground">Browse open roles across our brands. No account needed.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
        <a href="#roles" className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground">Browse roles</a>
        <a href="#how-it-works" className="font-bold underline">How applying works</a>
      </div>
    </div>
    {!!jobs.length && <div className="roles-marquee mt-12 overflow-hidden py-2" aria-label="Explore open roles">
      <div className="roles-marquee-track flex w-max">
        <ul className="flex gap-3 pr-3">{titles(false)}</ul>
        <ul aria-hidden="true" className="roles-marquee-copy flex gap-3 pr-3">{titles(true)}</ul>
      </div>
    </div>}
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-hidden="true">
      {brands.slice(0, 4).map(brand => <span key={brand.id} className="h-1 w-10" style={{ backgroundColor: accentColor(brand.accentColor) }} />)}
    </div>
  </section>;
}
