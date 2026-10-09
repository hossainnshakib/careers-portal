"use client";

import { useRef } from "react";
import { useQueryStates } from "nuqs";
import { BrandLogo } from "@/components/brand-logo";
import { filterKeys, filterParsers, humanize, matchesJob, optionCount, type FilterKey, type JobCard, type PublicBrand } from "@/lib/careers/filters";
import { optionGroupLabels, type OptionGroup } from "@/lib/careers/option-labels";
import { accentColor } from "@/lib/careers/presentation";
import { CareersHero } from "./careers-hero";
import { CareersResults } from "./careers-results";
import { CareersInfo } from "./careers-info";

const sidebarKeys = filterKeys.filter(key => key !== "brand");
const labels: Record<FilterKey, string> = {
  brand: "Brand", dept: "Department",
  type: optionGroupLabels.engagement, mode: optionGroupLabels.arrangement, sector: "Sector", level: optionGroupLabels.experience,
};
/** Distinct option facets from the open catalog, in first-seen (stored) order. */
function optionFacet(jobs: JobCard[], group: OptionGroup) {
  const seen = new Map<string, string>();
  for (const job of jobs) for (const option of job.options) if (option.group === group && !seen.has(option.slug)) seen.set(option.slug, option.label);
  return [...seen].map(([value, label]) => ({ value, label }));
}

export function CareersHub({ jobs, brands, departments }: {
  jobs: JobCard[]; brands: PublicBrand[]; departments: { name: string; slug: string }[];
}) {
  const [filters, setFilters] = useQueryStates(filterParsers, { shallow: true, history: "replace" });
  const mobileDialog = useRef<HTMLDialogElement>(null);
  const selectedBrand = filters.brand.length === 1 ? brands.find(brand => brand.slug === filters.brand[0]) : undefined;
  const visible = jobs.filter(job => matchesJob(job, filters));
  const options: Record<FilterKey, { value: string; label: string }[]> = {
    brand: brands.map(brand => ({ value: brand.slug, label: brand.name })),
    dept: departments.map(department => ({ value: department.slug, label: department.name })),
    type: optionFacet(jobs, "engagement"),
    mode: optionFacet(jobs, "arrangement"),
    sector: [...new Set(brands.map(brand => brand.sector))].map(value => ({ value, label: humanize(value) })),
    level: optionFacet(jobs, "experience"),
  };
  function toggle(key: FilterKey, value: string) {
    void setFilters({ [key]: filters[key].includes(value) ? filters[key].filter(item => item !== value) : [...filters[key], value] });
  }
  const clear = () => { void setFilters(null); };
  function group(key: FilterKey) {
    return <fieldset key={key}><legend className="mb-3 font-black">{labels[key]}</legend><div className="space-y-3">{options[key].map(option => {
      const count = optionCount(jobs, filters, key, option.value);
      const checked = filters[key].includes(option.value);
      return <label key={option.value} className={`flex items-start gap-3 font-bold ${!count ? "text-muted-foreground" : ""}`}>
        <input className="mt-1 h-4 w-4 shrink-0" type="checkbox" checked={checked} disabled={!count && !checked} onChange={() => toggle(key, option.value)} />
        <span>{option.label} <span className="text-muted-foreground">({count})</span></span>
      </label>;
    })}</div></fieldset>;
  }
  return <main id="main" className="mx-auto max-w-7xl px-5 pb-8">
    <CareersHero jobs={jobs} brands={brands} />
    <section aria-label="Filter by brand" className="border-y border-border py-5">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">{brands.map(brand => {
        const selected = filters.brand.includes(brand.slug);
        const count = optionCount(jobs, filters, "brand", brand.slug);
        return <button key={brand.id} aria-pressed={selected} aria-label={`Filter by ${brand.name} (${count})`} onClick={() => toggle("brand", brand.slug)} className="relative flex w-40 shrink-0 snap-start flex-col items-center gap-2 rounded-lg bg-card px-3 py-4">
          <BrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} size="strip" decorative />
          <span>{brand.name}</span>{selected && <span aria-hidden="true" className="absolute inset-x-8 bottom-0 h-0.5" style={{ backgroundColor: accentColor(brand.accentColor) }} />}
        </button>;
      })}</div>
      {selectedBrand && <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        {selectedBrand.description && <p className="max-w-2xl text-muted-foreground">{selectedBrand.description}</p>}
        <button onClick={() => void setFilters({ brand: [] })} className="underline">See all brands</button>
      </div>}
    </section>
    <section id="roles" aria-label="Open roles" className="scroll-mt-8 pt-10">
      <h2 className="mb-8 text-4xl font-black tracking-tight">Find your role</h2>
      <div className="grid gap-8 md:grid-cols-[14rem_1fr]">
        <aside aria-label="Job filters" className="hidden md:block"><div className="sticky top-6 max-h-[calc(100vh-3rem)] space-y-7 overflow-y-auto p-1">
          {sidebarKeys.map(group)}<button onClick={clear} className="font-bold underline">Clear all</button>
        </div></aside>
        <div className="min-w-0">
          <label className="block font-black">Search roles<input aria-label="Search roles" type="search" maxLength={200} value={filters.q} onChange={event => void setFilters({ q: event.target.value })} className="mt-3 block w-full rounded-lg border border-input bg-card p-3 font-bold" /></label>
          <button onClick={() => mobileDialog.current?.showModal()} className="mt-4 rounded-lg border-2 border-foreground px-4 py-3 font-bold md:hidden">Filters</button>
          <div className="my-5 flex flex-wrap gap-2">
            {filterKeys.flatMap(key => filters[key].map(value => <button key={`${key}:${value}`} aria-label={`Remove ${labels[key]} filter: ${options[key].find(option => option.value === value)?.label ?? value}`} onClick={() => toggle(key, value)} className="rounded-full border border-border bg-card px-3 py-1.5 font-bold">{options[key].find(option => option.value === value)?.label ?? value} ×</button>))}
            {filters.q && <button aria-label="Remove search filter" onClick={() => void setFilters({ q: "" })} className="rounded-full border border-border bg-card px-3 py-1.5 font-bold">{filters.q} ×</button>}
          </div>
          <p role="status" className="mb-7 font-bold">{visible.length} open {visible.length === 1 ? "role" : "roles"}</p>
          <CareersResults jobs={visible} departments={departments} onClear={clear} />
        </div>
      </div>
    </section>
    <dialog ref={mobileDialog} aria-label="Job filters" className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85vh] w-full max-w-none overflow-y-auto rounded-t-lg border border-border bg-card p-6 text-foreground backdrop:bg-black/40">
      <div className="mb-6 flex justify-between gap-4"><button onClick={() => mobileDialog.current?.close()} className="font-bold underline">Done filtering</button><button onClick={clear} className="font-bold underline">Clear all</button></div>
      <div className="space-y-7">{sidebarKeys.map(group)}</div>
    </dialog>
    <CareersInfo />
  </main>;
}
