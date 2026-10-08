import Link from "next/link";
import type { JobCard, PublicBrand } from "@/lib/careers/filters";
import { accentColor } from "@/lib/careers/presentation";

export function CareersHero({ jobs, brands }: { jobs: JobCard[]; brands: PublicBrand[] }) {
  const titles = (duplicate: boolean) => jobs.map(job => <li key={job.id}>
    <Link href={`/jobs/${job.slug}`} tabIndex={duplicate ? -1 : undefined} className="block whitespace-nowrap rounded-lg border border-border bg-card px-4 py-3">{job.title}</Link>
  </li>);
  return <section aria-labelledby="careers-title" className="pb-10 pt-14 sm:pt-20">
    <div className="mx-auto max-w-3xl text-center">
      <p className="inline-block rounded-lg border border-border px-4 py-2">{jobs.length} open {jobs.length === 1 ? "role" : "roles"} · {brands.length} {brands.length === 1 ? "brand" : "brands"}</p>
      <h1 id="careers-title" className="mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Good <span className="relative inline-block pb-3">work
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-1.5 gap-1">{brands.map(brand => <span key={brand.id} className="flex-1" style={{ backgroundColor: accentColor(brand.accentColor) }} />)}</span>
      </span> starts here.</h1>
      <p className="mt-6 text-lg text-muted-foreground">Browse open roles across our brands. No account needed.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="#roles" className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground">Browse roles</a>
        <a href="#how-it-works" className="rounded-lg border border-border px-6 py-3">How applying works</a>
      </div>
    </div>
    {!!jobs.length && <div className="roles-marquee mt-12 overflow-hidden py-2" aria-label="Explore open roles">
      <div className="roles-marquee-track flex w-max">
        <ul className="flex gap-3 pr-3">{titles(false)}</ul>
        <ul aria-hidden="true" className="roles-marquee-copy flex gap-3 pr-3">{titles(true)}</ul>
      </div>
    </div>}
  </section>;
}
