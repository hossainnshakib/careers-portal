import type { MetadataRoute } from "next";
import { loadPublicCatalog } from "@/db/queries/public-jobs";
import { getPublicEnv } from "@/lib/env-public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const catalog = await loadPublicCatalog();
  return [{ url: base, changeFrequency: "daily", priority: 1 }, ...catalog.jobs.map((job) => ({ url: `${base}/jobs/${job.slug}`, changeFrequency: "daily" as const, priority: 0.8 }))];
}
