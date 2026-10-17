import type { MetadataRoute } from "next";
import { loadPublicCatalog } from "@/db/queries/public-jobs";
import { getPublicEnv } from "@/lib/env-public";
import { isDemoSlug } from "@/lib/demo";

// Packaging must not connect to production. Runtime retains the tagged catalog cache.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const loaded = await loadPublicCatalog();
  const catalog = { jobs: loaded.jobs.filter(job => !isDemoSlug(job.slug)) };
  return [{ url: base, changeFrequency: "daily", priority: 1 }, { url: `${base}/privacy`, changeFrequency: "monthly", priority: 0.3 }, ...catalog.jobs.map((job) => ({ url: `${base}/jobs/${job.slug}`, changeFrequency: "daily" as const, priority: 0.8 }))];
}
