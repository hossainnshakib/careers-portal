import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import type { JobCard } from "@/lib/careers/filters";
import { accentColor, cardBrands, groupRoles } from "@/lib/careers/presentation";
import { fresherWelcome, groupLabels } from "@/lib/careers/option-labels";

export function CareersResults({ jobs, departments, onClear }: { jobs: JobCard[]; departments: { name: string; slug: string }[]; onClear: () => void }) {
  if (!jobs.length) return <div className="rounded-lg border border-border p-8">
    <h2 className="text-xl font-bold">No matching roles</h2><p className="mt-3 text-muted-foreground">Try another search or clear your filters.</p>
    <button onClick={onClear} className="mt-5 underline">Clear filters</button>
  </div>;
  return <div className="space-y-12">{groupRoles(jobs, departments).map(department => <section key={department.slug} aria-labelledby={`department-${department.slug}`}>
    <header className="mb-5 flex flex-wrap items-baseline gap-3 border-b-2 border-foreground pb-4">
      <span className="font-black text-poster">{String(department.number).padStart(2, "0")}</span>
      <h2 id={`department-${department.slug}`} className="text-2xl font-black tracking-tight">{department.name}</h2>
      <span className="font-bold text-muted-foreground">{department.roles.length} {department.roles.length === 1 ? "role" : "roles"}</span>
    </header>
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{department.roles.map(job => {
      const brands = cardBrands(job);
      const tags = [...groupLabels(job.options, "engagement"), ...groupLabels(job.options, "arrangement")];
      return <li key={job.id} className="min-w-0"><Link href={`/jobs/${job.slug}`} className="block h-full rounded-lg border border-t-4 border-border bg-card p-5" style={{ borderTopColor: accentColor(brands[0]?.accentColor) }}>
        <h3 className="text-xl font-black leading-snug tracking-tight">{job.title}</h3>
        <div className="my-4 flex flex-wrap gap-3">{brands.map(brand => <span key={brand.id} className="flex min-w-0 items-center gap-2 font-bold">
          {brand.logoUrl && <BrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} size="mark" decorative />}
          <span>{brand.name}</span>
        </span>)}</div>
        <div className="flex flex-wrap gap-2">
          {fresherWelcome(job.options) && <span className="rounded-full border border-poster px-2.5 py-1 font-bold text-poster">Fresher welcome</span>}
          {tags.map(tag => <span key={tag} className="rounded-full border border-border px-2.5 py-1 font-bold">{tag}</span>)}
          {job.salaryMode === "range" && job.salaryText && <span className="rounded-full border border-border bg-secondary px-2.5 py-1 font-bold">{job.salaryText}</span>}
        </div>
        <p className="mt-4 line-clamp-2 leading-relaxed text-muted-foreground">{job.summary}</p>
      </Link></li>;
    })}</ul>
  </section>)}</div>;
}
