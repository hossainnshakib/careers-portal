import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env-public";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/applied", "/jobs/*/apply"] }, sitemap: `${getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/sitemap.xml` };
}
