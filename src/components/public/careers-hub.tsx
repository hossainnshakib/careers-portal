"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useQueryStates } from "nuqs";
import { BrandLogo } from "@/components/brand-logo";
import { BrandAccent } from "@/components/brand-accent";
import { filterKeys, filterParsers, humanize, matchesJob, optionCount, type FilterKey, type JobCard, type PublicBrand } from "@/lib/careers/filters";

export function CareersHub({ jobs, brands, departments }: {
  jobs: JobCard[]; brands: PublicBrand[]; departments: { name: string; slug: string }[];
}) {
  const [filters, setFilters] = useQueryStates(filterParsers, { shallow: true, history: "replace" });
  const mobileDialog = useRef<HTMLDialogElement>(null);
  const [more, setMore] = useState(false);
  const selectedBrand = filters.brand.length === 1 ? brands.find((b) => b.slug === filters.brand[0]) : undefined;
  const visible = jobs.filter((job) => matchesJob(job, filters));
  const options: Record<FilterKey, { value: string; label: string }[]> = {
    brand: brands.map((b) => ({ value: b.slug, label: b.name })),
    dept: departments.map((d) => ({ value: d.slug, label: d.name })),
    type: ["full_time", "part_time", "contract", "internship", "freelance"].map((value) => ({ value, label: humanize(value) })),
    mode: ["onsite", "remote", "hybrid"].map((value) => ({ value, label: value })),
    sector: [...new Set(brands.map((b) => b.sector))].map((value) => ({ value, label: humanize(value) })),
    level: ["entry", "mid", "senior"].map((value) => ({ value, label: value })),
  };
  const labels = { brand: "Brand", dept: "Department", type: "Employment type", mode: "Work mode", sector: "Sector", level: "Experience level" };
  function toggle(key: FilterKey, value: string) {
    void setFilters({ [key]: filters[key].includes(value) ? filters[key].filter((v) => v !== value) : [...filters[key], value] });
  }
  function group(key: FilterKey) {
    return <fieldset key={key} className="min-w-0"><legend className="mb-2 font-semibold">{labels[key]}</legend>
      <div className="space-y-2">{options[key].map((option) => {
        const count = optionCount(jobs, filters, key, option.value);
        return <label key={option.value} className={`flex items-start gap-2 text-sm ${!count ? "text-muted-foreground" : ""}`}>
          <input type="checkbox" checked={filters[key].includes(option.value)} disabled={!count && !filters[key].includes(option.value)} onChange={() => toggle(key, option.value)} />
          {option.label} ({count})</label>;
      })}</div></fieldset>;
  }
  return <main id="main" className="mx-auto max-w-6xl px-5 py-10">
    <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Your next chapter</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Good work starts here.</h1>
    <p className="mt-4 max-w-2xl text-muted-foreground">Find a role where your ideas, skills and ambition can make a difference.</p>
    {selectedBrand && <section className="mt-8 rounded-xl border border-border bg-card p-6" aria-label={`${selectedBrand.name} careers`}>
      <BrandLogo name={selectedBrand.name} src={selectedBrand.logoUrl} className="max-w-xs" />
      <h2 className="mt-3 text-2xl font-semibold">{selectedBrand.name}</h2><p className="mt-2">{selectedBrand.description}</p>
      <button className="mt-3 underline" onClick={() => void setFilters({ brand: [] })}>See all brands</button>
    </section>}
    <div className="my-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{brands.map((b) => <button key={b.id}
      aria-pressed={filters.brand.includes(b.slug)} aria-label={`Filter by ${b.name}`}
      disabled={!optionCount(jobs, filters, "brand", b.slug) && !filters.brand.includes(b.slug)}
      onClick={() => toggle("brand", b.slug)} className={`rounded-xl border p-2 disabled:opacity-40 ${filters.brand.includes(b.slug) ? "border-primary ring-1 ring-primary" : "border-border"}`}>
      <BrandLogo name={b.name} src={b.logoUrl} /><span className="text-sm font-medium">{b.name} ({optionCount(jobs, filters, "brand", b.slug)})</span>
    </button>)}</div>
    <label className="block max-w-xl font-medium">Search roles<input aria-label="Search roles" type="search" maxLength={200}
      value={filters.q} onChange={(e) => void setFilters({ q: e.target.value })} className="mt-2 block w-full rounded-lg border border-input bg-card p-3" /></label>
    <button onClick={() => mobileDialog.current?.showModal()} className="my-4 rounded border border-border p-3 md:hidden">Filters</button>
    <dialog ref={mobileDialog} aria-label="Job filters" className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85vh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-border bg-card p-6 text-foreground backdrop:bg-black/40">
      <button onClick={() => mobileDialog.current?.close()} className="mb-4 underline">Done filtering</button>
      <div className="space-y-5">{filterKeys.map(group)}</div>
    </dialog>
    <div className={`mt-6 gap-8 md:grid md:grid-cols-[15rem_1fr]`}>
      <aside aria-label="Job filters" className="hidden space-y-5 md:block">
        {filterKeys.slice(0, 3).map(group)}
        <button onClick={() => setMore(!more)} aria-expanded={more} className="underline">More filters</button>
        {more && filterKeys.slice(3).map(group)}
      </aside>
      <section aria-label="Open roles" className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filterKeys.flatMap((key) => filters[key].map((value) => <button key={`${key}:${value}`} onClick={() => toggle(key, value)} className="rounded-full border border-border px-3 py-1 text-sm">{options[key].find((o) => o.value === value)?.label ?? value} ×</button>))}
          {(filters.q || filterKeys.some((k) => filters[k].length)) && <button className="underline" onClick={() => void setFilters(null)}>Clear all</button>}
        </div>
        <p role="status" className="mb-4 text-sm text-muted-foreground">{visible.length} open {visible.length === 1 ? "role" : "roles"}</p>
        {!visible.length && <div className="rounded-xl border border-border p-8"><h2 className="text-xl font-semibold">No matching roles</h2><p className="mt-2">Try another search or clear your filters.</p></div>}
        <ul className="grid gap-5 lg:grid-cols-2">{visible.map((job) => {
          const primary = job.brands.find((b) => b.id === job.primaryBrandId) ?? job.brands[0];
          return <li key={job.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <BrandAccent color={primary.accentColor} /><div className="p-5">
              <BrandLogo name={primary.name} src={primary.logoUrl} />
              <p className="mt-3 text-sm text-muted-foreground">{job.brands.map((b) => b.name).join(" · ")}</p>
              <h2 className="mt-2 text-xl font-semibold"><Link href={`/jobs/${job.slug}`}>{job.title}</Link></h2>
              <p className="mt-2 text-sm">{job.department.name}</p>
              <p className="mt-2 text-sm capitalize">{humanize(job.employmentType)} · {job.workMode}{job.locationText ? ` · ${job.locationText}` : ""}</p>
              <p className="my-4 text-sm text-muted-foreground">{job.summary}</p><Link className="font-medium underline" href={`/jobs/${job.slug}`}>View role</Link>
            </div></li>;
        })}</ul>
      </section>
    </div>
  </main>;
}
