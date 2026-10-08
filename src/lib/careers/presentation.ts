import type { JobCard } from "./filters";

export function groupRoles(jobs: JobCard[], departments: { name: string; slug: string }[]) {
  return departments.flatMap((department, index) => {
    const roles = jobs.filter(job => job.department.slug === department.slug);
    return roles.length ? [{ ...department, number: index + 1, roles }] : [];
  });
}
export function cardBrands(job: JobCard) {
  const primary = job.brands.find(brand => brand.id === job.primaryBrandId) ?? job.brands[0];
  return primary ? [primary, ...job.brands.filter(brand => brand.id !== primary.id)].slice(0, 2) : [];
}
export function accentColor(value: string | null | undefined) {
  return value && /^#[a-f0-9]{6}$/i.test(value) ? value : "#20241f";
}
export function publicWebsite(value: string | null | undefined) {
  try {
    const url = new URL(value ?? "");
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
