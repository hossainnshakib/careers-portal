"use client";

import { useEffect, useState } from "react";
import { applicationStatusEnum } from "@/db/schema";
import type { ReviewFilters } from "@/lib/validation/review";
import { applicationStatusLabel } from "@/lib/admin/display";

const sortLabels: Record<ReviewFilters["sort"], string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name A–Z",
  name_desc: "Name Z–A",
};

function filterUrl(filters: ReviewFilters, patch: Partial<ReviewFilters>) {
  const values = new URLSearchParams();
  const merged = { ...filters, ...patch };
  for (const key of ["brand", "department", "job", "status", "q", "from", "to", "tz", "sort"] as const) {
    if (merged[key] !== "" && !(key === "sort" && merged.sort === "newest")) {
      values.set(key, String(merged[key]));
    }
  }
  const url = `/admin/applications${values.size ? `?${values}` : ""}`;
  return url;
}

export function ReviewFilterForm({
  filters,
  options,
  showReset = true,
}: {
  filters: ReviewFilters;
  showReset?: boolean;
  options: {
    brands: { id: string; name: string }[];
    departments: { id: string; name: string }[];
    jobs: { id: string; title: string }[];
  };
}) {
  const [zone, setZone] = useState(filters.tz);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const adapt = () => setMobile(media.matches);
    adapt();
    media.addEventListener("change", adapt);
    return () => media.removeEventListener("change", adapt);
  }, []);
  useEffect(() => {
    if (!filters.from && !filters.to) setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [filters.from, filters.to]);

  const chips: { key: string; label: string; href: string }[] = [];
  if (filters.q) chips.push({ key: "q", label: `Search: ${filters.q}`, href: filterUrl(filters, { q: "" }) });
  if (filters.brand) {
    const brand = options.brands.find((item) => item.id === filters.brand);
    chips.push({ key: "brand", label: `Brand: ${brand?.name ?? "Selected"}`, href: filterUrl(filters, { brand: "" }) });
  }
  if (filters.department) {
    const department = options.departments.find((item) => item.id === filters.department);
    chips.push({
      key: "department",
      label: `Department: ${department?.name ?? "Selected"}`,
      href: filterUrl(filters, { department: "" }),
    });
  }
  if (filters.job) {
    const job = options.jobs.find((item) => item.id === filters.job);
    chips.push({ key: "job", label: `Job: ${job?.title ?? "Selected"}`, href: filterUrl(filters, { job: "" }) });
  }
  if (filters.status) {
    chips.push({
      key: "status",
      label: `Status: ${applicationStatusLabel(filters.status)}`,
      href: filterUrl(filters, { status: "" }),
    });
  }
  if (filters.from) chips.push({ key: "from", label: `From: ${filters.from}`, href: filterUrl(filters, { from: "" }) });
  if (filters.to) chips.push({ key: "to", label: `To: ${filters.to}`, href: filterUrl(filters, { to: "" }) });
  if (filters.sort !== "newest") chips.push({ key: "sort", label: `Sort: ${sortLabels[filters.sort]}`, href: filterUrl(filters, { sort: "newest" }) });

  return (
    <div className="admin-review-filter-block">
      <form action="/admin/applications" method="get" className="admin-card admin-review-filters admin-mobile-flat">
        <label className="admin-review-search">
           <span className="sr-only">Search name/email</span>
          <input aria-label="Search name/email" name="q" defaultValue={filters.q} maxLength={200} placeholder={mobile ? "Search name or email" : "Name or email"} />
        </label>
        <div id="review-filter-fields" className={`admin-review-primary${open ? " is-open" : ""}`}>
          <input type="hidden" name="tz" value={zone} />
          <label>
            <span className="sr-only">Brand</span>
            <select aria-label="Brand" name="brand" defaultValue={filters.brand}>
              <option value="">Brand</option>
              {options.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Department</span>
            <select aria-label="Department" name="department" defaultValue={filters.department}>
              <option value="">Department</option>
              {options.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Job</span>
            <select aria-label="Job" name="job" defaultValue={filters.job}>
              <option value="">Job</option>
              {options.jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Status</span>
            <select aria-label="Status" name="status" defaultValue={filters.status}>
              <option value="">Status</option>
              {applicationStatusEnum.enumValues.map((status) => (
                <option key={status} value={status}>
                  {applicationStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">From date</span>
            <input aria-label="From date" type="date" name="from" defaultValue={filters.from} />
          </label>
          <button type="button" className="admin-btn admin-btn-secondary admin-review-more" aria-label="More filters" title="More filters" aria-expanded={more} aria-controls="review-extra-fields" onClick={() => setMore(!more)}><span aria-hidden="true">⋯</span></button>
        </div>
        <div id="review-extra-fields" className="admin-review-extra" hidden={!more && !open}>
          <label>
            To date
            <input aria-label="To date" type="date" name="to" defaultValue={filters.to} />
          </label>
          <label>
            Sort
            <select aria-label="Sort" name="sort" defaultValue={filters.sort}>
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="admin-note" style={{ gridColumn: "1 / -1", margin: 0 }}>
            Date range uses {zone}; the end date is inclusive.
          </p>
          <div className="admin-filter-actions">
            {showReset && <>
              {/* Fresh private-document navigation rechecks authorization and renews the CSP nonce. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/admin/applications" className="admin-link">Clear filters</a>
            </>}
          </div>
        </div>
        <button className={`admin-btn admin-review-submit${open ? " is-open" : ""}`} type="submit" aria-label="Filter applications" title="Filter applications"><span className="admin-review-submit-icon" aria-hidden="true">→</span><span className="admin-review-submit-label">Filter applications</span></button>
      </form>
      <div className="admin-review-filter-controls">
        <button type="button" className="admin-btn admin-btn-secondary admin-filter-toggle" aria-expanded={open} aria-controls="review-filter-fields review-extra-fields" onClick={() => setOpen(!open)}>Filters</button>
        {chips.length > 0 && <div className="admin-chips">
          {chips.map((chip) => <a key={chip.key} href={chip.href} className="admin-chip">{chip.label}<span aria-hidden="true">✕</span><span className="sr-only">— remove filter</span></a>)}
          {/* Fresh private-document navigation renews authorization and the CSP nonce. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/applications" className="admin-link">Clear all</a>
        </div>}
      </div>
    </div>
  );
}
