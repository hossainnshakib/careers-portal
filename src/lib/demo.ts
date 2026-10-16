/** Public labels only; no environment settings or credentials belong here. */
export const demoDisclaimer = "DEMO / TEST ONLY — Not a real job opening";
export const demoMarker = "Validation dataset: prompt-13-demo-v1.";
export const demoSlugs = [
  "demo-platform-developer", "demo-visual-designer", "demo-video-producer",
  "demo-bengali-editor", "demo-campaign-coordinator",
] as const;

export function isDemoSlug(slug: string) {
  return slug.startsWith("demo-") || /^e2e-[a-f0-9]{32}-/.test(slug);
}

/** Prefixes alone never authorize dataset mutations. */
export function ownsValidationJob(job: { slug: string; title: string; descriptionMd: string }) {
  return (demoSlugs as readonly string[]).includes(job.slug) && job.title.startsWith("DEMO — ") &&
    job.title.includes(demoDisclaimer) && job.descriptionMd.includes(demoMarker) && job.descriptionMd.startsWith(demoDisclaimer);
}
