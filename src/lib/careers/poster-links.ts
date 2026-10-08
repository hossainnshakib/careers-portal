import { z } from "zod";
import { jobSlugSchema } from "@/lib/validation/uploads";

function csvCell(value: string) {
  const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export const posterCampaignSchema = z.string().min(1).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);
export function posterLinksCsv(jobs: { title: string; slug: string; department: string; brands: string[] }[], base: string, campaign: string) {
  const origin = z.url({ protocol: /^https?$/ }).parse(base);
  if (new URL(origin).username || new URL(origin).password) throw new Error("Public URL must not contain credentials.");
  const tag = posterCampaignSchema.parse(campaign);
  const rows = [["Job title", "Department", "Brand slugs", "Public URL"]];
  for (const job of jobs) {
    const slug = jobSlugSchema.parse(job.slug);
    const url = new URL(`/jobs/${slug}`, origin);
    url.search = new URLSearchParams({ utm_source: "poster", utm_medium: "qr", utm_campaign: tag, utm_content: slug }).toString();
    rows.push([job.title, job.department, job.brands.join(","), url.href]);
  }
  return `${rows.map(row => row.map(csvCell).join(",")).join("\n")}\n`;
}
