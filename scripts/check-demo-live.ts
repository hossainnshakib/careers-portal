import { setTimeout as pause } from "node:timers/promises";
import { demoDisclaimer, demoSlugs } from "../src/lib/demo";

const origin = "https://careers-portal-sigma.vercel.app";
const approvedRef = "xmtoccukridshadnxrlc";
async function read(path: string) {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(20000), redirect: "error" });
  if (!response.ok) throw new Error("Public route unavailable");
  return { html: await response.text(), csp: response.headers.get("content-security-policy") ?? "" };
}
try {
  const login = await read("/admin/login");
  const refs = [...login.csp.matchAll(/https:\/\/([a-z0-9]{20})\.supabase\.co/g)].map(match => match[1]);
  if (!refs.length || refs.some(ref => ref !== approvedRef)) throw new Error("Live API project mismatch");
  const deadline = Date.now() + 45000;
  let ready = false;
  do {
    const { html } = await read("/");
    const slugs = new Set([...html.matchAll(/href="\/jobs\/([a-z0-9-]+)/g)].map(match => match[1]));
    ready = slugs.size === demoSlugs.length && demoSlugs.every(slug => slugs.has(slug));
    if (!ready) await pause(1000);
  } while (!ready && Date.now() < deadline);
  if (!ready) throw new Error("Catalog is stale or contains unexpected jobs");
  let banners = 0; let noindex = 0; let structuredData = 0;
  for (const slug of demoSlugs) {
    const job = await read(`/jobs/${slug}`);
    const apply = await read(`/jobs/${slug}/apply`);
    if (![job, apply].every(page => page.html.includes(demoDisclaimer)) || !apply.html.includes("<form") || !apply.html.includes("Submit application"))
      throw new Error("Demo disclosure or application route missing");
    if (job.html.includes('data-testid="demo-notice"')) banners++;
    if (/name="robots"[^>]*content="[^"]*noindex/.test(job.html)) noindex++;
    if (/type="application\/ld\+json"/.test(job.html)) structuredData++;
  }
  console.info(JSON.stringify({ origin, project: approvedRef, demoJobs: 5, genuineJobs: 0, applicationRoutes: 5, disclaimersVerified: true,
    dedicatedBannerPages: banners, noindexJobPages: noindex, jobPostingPages: structuredData }));
  if (banners !== 5 || noindex !== 5 || structuredData !== 0)
    console.info("Deployment limitation: stored DEMO warnings are live, but branch-only dedicated banners/noindex/structured-data exclusion are not fully deployed. No hosting changes were made.");
} catch {
  console.error("Live DEMO read-only verification failed. Verify approved target, public route/disclaimer availability and the 300-second catalog cache. No writes were performed.");
  process.exitCode = 1;
}
