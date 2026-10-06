"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { applicationStatusEnum } from "@/db/schema";
import type { ReviewFilters } from "@/lib/validation/review";

export function ReviewFilterForm({ filters, options }: {
  filters: ReviewFilters;
  options: { brands: { id: string; name: string }[]; departments: { id: string; name: string }[]; jobs: { id: string; title: string }[] };
}) {
  const [zone, setZone] = useState(filters.tz);
  useEffect(() => {
    if (!filters.from && !filters.to) setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [filters.from, filters.to]);
  const input = "mt-1 block w-full rounded border border-input bg-card p-2";
  return <form action="/admin/applications" method="get" className="grid gap-3 rounded border border-border p-4 sm:grid-cols-2 xl:grid-cols-4">
    <input type="hidden" name="tz" value={zone} />
    <label>Search name/email<input aria-label="Search name/email" name="q" defaultValue={filters.q} maxLength={200} className={input} /></label>
    <label>Brand<select aria-label="Brand" name="brand" defaultValue={filters.brand} className={input}><option value="">All brands</option>{options.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <label>Department<select aria-label="Department" name="department" defaultValue={filters.department} className={input}><option value="">All departments</option>{options.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <label>Job<select aria-label="Job" name="job" defaultValue={filters.job} className={input}><option value="">All jobs</option>{options.jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></label>
    <label>Status<select aria-label="Status" name="status" defaultValue={filters.status} className={input}><option value="">All statuses</option>{applicationStatusEnum.enumValues.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
    <label>From date<input aria-label="From date" type="date" name="from" defaultValue={filters.from} className={input} /></label>
    <label>To date<input aria-label="To date" type="date" name="to" defaultValue={filters.to} className={input} /></label>
    <label>Sort<select aria-label="Sort" name="sort" defaultValue={filters.sort} className={input}>{[["newest", "Newest first"], ["oldest", "Oldest first"], ["name_asc", "Name A–Z"], ["name_desc", "Name Z–A"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <p className="text-xs text-muted-foreground sm:col-span-2">Date range uses {zone}; the end date is inclusive.</p>
    <div className="flex items-center gap-4"><button className="rounded border border-border px-4 py-2">Filter applications</button><Link href="/admin/applications" className="underline">Clear filters</Link></div>
  </form>;
}
