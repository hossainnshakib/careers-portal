"use client";

import { useRef } from "react";
import { useQueryStates } from "nuqs";
import { filterKeys, filterParsers, humanize, matchesJob, optionCount, type FilterKey, type JobCard, type PublicBrand } from "@/lib/careers/filters";
import { optionGroupLabels, type OptionGroup, type OptionTag } from "@/lib/careers/option-labels";
import { CareersHero } from "./careers-hero";
import { CareersResults } from "./careers-results";
import { CareersInfo } from "./careers-info";
import { PublicIcon } from "./public-icon";

const panelKeys: FilterKey[] = ["dept", "brand", "mode", "type", "level"];
const labels: Record<FilterKey, string> = {
  brand: "Brand", dept: "Department", type: optionGroupLabels.engagement,
  mode: optionGroupLabels.arrangement, sector: "Sector", level: optionGroupLabels.experience,
};
function optionFacet(jobs: JobCard[], catalogOptions: OptionTag[], group: OptionGroup) {
  const linked = new Set(jobs.flatMap(job => job.options.filter(option => option.group === group).map(option => option.slug)));
  const seen = new Map<string, string>();
  for (const option of catalogOptions) if (option.group === group && linked.has(option.slug)) seen.set(option.slug, option.label);
  return [...seen].map(([value, label]) => ({ value, label }));
}

export function CareersHub({ jobs, brands, departments, jobOptions }: {
  jobs: JobCard[]; brands: PublicBrand[]; departments: { name: string; slug: string }[]; jobOptions?: OptionTag[];
}) {
  const [filters, setFilters] = useQueryStates(filterParsers, { shallow: true, history: "replace" });
  const mobileDialog = useRef<HTMLDialogElement>(null);
  const visible = jobs.filter(job => matchesJob(job, filters));
  const catalogOptions = jobOptions ?? jobs.flatMap(job => job.options);
  const options: Record<FilterKey, { value: string; label: string }[]> = {
    brand: brands.map(brand => ({ value: brand.slug, label: brand.name })),
    dept: departments.map(department => ({ value: department.slug, label: department.name })),
    type: optionFacet(jobs, catalogOptions, "engagement"), mode: optionFacet(jobs, catalogOptions, "arrangement"),
    level: optionFacet(jobs, catalogOptions, "experience"),
    sector: [...new Set(brands.map(brand => brand.sector))].map(value => ({ value, label: humanize(value) })),
  };
  const activeCount = filterKeys.reduce((count, key) => count + filters[key].length, filters.q ? 1 : 0);
  function toggle(key: FilterKey, value: string) {
    void setFilters({ [key]: filters[key].includes(value) ? filters[key].filter(item => item !== value) : [...filters[key], value] });
  }
  const clear = () => { void setFilters(null); };
  function group(key: FilterKey) {
    return <details key={key} open className="ui-filter-group">
      <summary className="ui-label text-ui-muted">{labels[key]}</summary>
      <fieldset className="mt-2.5"><legend className="sr-only">{labels[key]}</legend>
        <div className={key === "dept" ? "space-y-2.5" : "flex flex-wrap gap-[7px]"}>{options[key].map(option => {
          const count = optionCount(jobs, filters, key, option.value);
          const checked = filters[key].includes(option.value);
          if (key === "dept") return <label key={option.value} className={`flex items-start gap-2.5 text-[13.5px] font-medium ${!count ? "text-ui-muted" : ""}`}>
            <input className="mt-0.5 h-4 w-4 shrink-0 accent-ui-ink" type="checkbox" checked={checked} disabled={!count && !checked} onChange={() => toggle(key, option.value)} />
            <span className="flex-1">{option.label}</span><span className="text-[12px] text-ui-muted">{count}</span>
          </label>;
          return <button key={option.value} type="button" aria-pressed={checked} disabled={!count && !checked} onClick={() => toggle(key, option.value)} className={`rounded-full border px-3 py-[7px] text-[12.5px] font-semibold disabled:opacity-40 ${checked ? "border-ui-ink bg-ui-ink text-white" : "border-ui-border bg-white/70 text-ui-chip"}`}>{option.label}</button>;
        })}</div>
      </fieldset>
    </details>;
  }
  return <main id="main" className="pb-2">
    <CareersHero jobs={jobs} brands={brands} />
    <section id="roles" aria-label="Open roles" className="ui-container scroll-mt-24 pb-6 pt-12">
      <div className="mb-7 space-y-1.5"><h2 className="text-[36px] font-extrabold tracking-[-.03em]">Find your role</h2><p className="text-[15px] text-ui-muted">Every open role, grouped by department.</p></div>
      <div className="ui-roles-grid" data-testid="roles-grid">
        <aside aria-label="Job filters" className="ui-desktop-filter ui-sticky-panel ui-glass space-y-4 self-start rounded-[24px] p-[22px]" data-testid="home-filter-panel">
          <div className="flex items-center justify-between"><h3 className="text-[16px] font-extrabold">Filters</h3><button onClick={clear} className="text-[13px] font-semibold text-ui-blue-text">Clear all</button></div>
          {panelKeys.map(group)}
        </aside>
        <div className="min-w-0">
          <div className="ui-glass flex h-14 items-center gap-3 rounded-[18px] px-[18px] text-ui-muted"><PublicIcon name="search" size={20} />
            <label htmlFor="role-search" className="sr-only">Search roles</label>
            <input id="role-search" type="search" maxLength={200} placeholder="Search roles" value={filters.q} onChange={event => void setFilters({ q: event.target.value })} className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-ui-ink sm:text-[15px]" />
          </div>
          <button onClick={() => mobileDialog.current?.showModal()} className="ui-mobile-filter mt-4 items-center gap-2 rounded-full border border-ui-border bg-white/70 px-4 py-2.5 text-[14px] font-bold" aria-haspopup="dialog">Filters{activeCount > 0 && <span aria-label={`${activeCount} active filters`} className="rounded-full bg-ui-blue-surface px-2 text-ui-blue-text">{activeCount}</span>}</button>
          <div className="mb-9 mt-[14px] flex flex-wrap items-center gap-2">
            <p role="status" className="text-[13px] font-semibold text-ui-muted">{visible.length} open {visible.length === 1 ? "role" : "roles"}</p>
            {filterKeys.flatMap(key => filters[key].map(value => <button key={`${key}:${value}`} aria-label={`Remove ${labels[key]} filter: ${options[key].find(option => option.value === value)?.label ?? value}`} onClick={() => toggle(key, value)} className="inline-flex items-center gap-1.5 rounded-full bg-ui-blue-surface py-1.5 pl-3 pr-2 text-[12.5px] font-bold text-ui-blue-text">{options[key].find(option => option.value === value)?.label ?? value}<PublicIcon name="close" size={13} /></button>))}
            {filters.q && <button aria-label="Remove search filter" onClick={() => void setFilters({ q: "" })} className="inline-flex items-center gap-1.5 rounded-full bg-ui-blue-surface py-1.5 pl-3 pr-2 text-[12.5px] font-bold text-ui-blue-text">{filters.q}<PublicIcon name="close" size={13} /></button>}
          </div>
          <CareersResults jobs={visible} departments={departments} onClear={clear} />
        </div>
      </div>
    </section>
    <dialog ref={mobileDialog} aria-label="Job filters" className="ui-glass fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-[28px] p-6 text-ui-ink backdrop:bg-ui-ink/40">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="font-extrabold">Filters · {activeCount} active</h2><button onClick={clear} className="text-[13px] font-semibold text-ui-blue-text">Clear all</button><button onClick={() => mobileDialog.current?.close()} className="rounded-full bg-ui-ink px-4 py-2 text-[14px] font-bold text-white">Done filtering</button></div>
      <div className="space-y-[22px]">{panelKeys.map(group)}</div>
    </dialog>
    <CareersInfo />
  </main>;
}
