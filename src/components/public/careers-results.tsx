import Link from "next/link";
import type { JobCard } from "@/lib/careers/filters";
import { accentColor, cardBrands, groupRoles } from "@/lib/careers/presentation";
import { PublicBrandLogo } from "./public-brand-logo";
import { PublicIcon } from "./public-icon";

export function CareersResults({ jobs, departments, onClear, activeFilters = false }: { jobs: JobCard[]; departments: { name: string; slug: string }[]; onClear: () => void; activeFilters?: boolean }) {
  if (!jobs.length) return <div className="ui-glass rounded-[24px] p-8">
    <h2 className="text-xl font-bold">{activeFilters ? "No roles match your filters" : "No roles found"}</h2>
    <p className="mt-3 text-ui-muted">{activeFilters ? "Try a different search, or clear your filters to see everything." : "Try a different search term."}</p>
    <button onClick={onClear} className="mt-5 font-semibold text-ui-blue-text underline">Clear filters</button>
  </div>;
  return <div className="space-y-9">{groupRoles(jobs, departments).map(department => <section key={department.slug} aria-labelledby={`department-${department.slug}`}>
    <header className="mb-[18px] flex flex-wrap items-baseline gap-3 border-b border-ui-border pb-3">
      <span className="text-[13px] font-bold text-ui-blue-text">{String(department.number).padStart(2, "0")}</span>
      <h2 id={`department-${department.slug}`} className="text-[22px] font-extrabold tracking-[-.02em]">{department.name}</h2>
      <span className="text-[13px] font-semibold text-ui-muted">{department.roles.length} {department.roles.length === 1 ? "role" : "roles"}</span>
    </header>
    <ul className="ui-job-grid">{department.roles.map(job => {
      const brands = cardBrands(job);
      return <li key={job.id} className="min-w-0"><Link href={`/jobs/${job.slug}`} className="ui-glass ui-lift flex h-full min-w-0 flex-col gap-[14px] rounded-ui-card px-5 pb-[18px] pt-5" style={{ borderTopColor: accentColor(brands[0]?.accentColor), borderTopWidth: 3 }}>
        <div className="flex min-h-6 flex-wrap items-center gap-x-[14px] gap-y-1.5">{brands.map((brand, index) => <span key={brand.id} className="flex items-center">
          {index > 0 && <span aria-hidden="true" className="mr-[14px] h-3.5 w-px bg-ui-border" />}
          <PublicBrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} />
        </span>)}</div>
        <h3 className="text-[18px] font-bold leading-[1.25] tracking-[-.01em]">{job.title}</h3>
        <div className="flex flex-wrap gap-[7px]">
          {(["engagement", "arrangement", "experience"] as const).flatMap(group => job.options.filter(option => option.group === group)).map(option => <span key={`${option.group}:${option.slug}`} className={`ui-pill ${option.group === "experience" && option.slug === "fresher-welcome" ? "ui-pill-blue" : ""}`}>{option.label}</span>)}
          <span className="ui-pill ui-pill-salary">{job.salaryMode === "range" && job.salaryText ? job.salaryText : "Negotiable"}</span>
        </div>
        {job.summary && <p className="line-clamp-2 text-[13.5px] leading-[1.55] text-ui-muted">{job.summary}</p>}
        <span className="mt-auto flex items-center gap-1.5 text-[13.5px] font-bold text-ui-blue-text">View role <PublicIcon name="arrow" size={16} /></span>
      </Link></li>;
    })}</ul>
  </section>)}</div>;
}
