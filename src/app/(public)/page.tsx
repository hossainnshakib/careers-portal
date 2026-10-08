import { loadPublicCatalog } from "@/db/queries/public-jobs";
import { CareersHub } from "@/components/public/careers-hub";
import { isServerEnvConfigured } from "@/lib/env";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getPublicSiteUrl } from "@/lib/env-public";

export const metadata = {
  title: "Careers · Good work starts here",
  description: "Browse open roles across our brands. No account needed.",
  alternates: { canonical: getPublicSiteUrl() },
  openGraph: { title: "Careers · Good work starts here", description: "Browse open roles across our brands. No account needed.", url: getPublicSiteUrl(), type: "website" as const },
};

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await searchParams;
  if (!isServerEnvConfigured()) return <main id="main" className="mx-auto max-w-6xl p-10"><h1 className="text-4xl font-semibold">Good work starts here.</h1><p className="mt-6">The portal is being configured. Please check back soon.</p></main>;
  return <NuqsAdapter><CareersHub {...await loadPublicCatalog()} /></NuqsAdapter>;
}
