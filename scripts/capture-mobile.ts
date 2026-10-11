import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";
const out = "design/mockup-compare";

async function main() {
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  const jobs = await listJobs();
  const jobSlug = jobs.find(slug => slug === "web-developer") ?? jobs[0] ?? "web-developer";
  for (const width of [360, 390, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const [name, path] of [["home", "/"], ["job", `/jobs/${jobSlug}`], ["apply", `/jobs/${jobSlug}/apply`]] as const) {
      await page.goto(base + path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(`${name}-${width}: overflow=${overflow}`);
    }
    await context.close();
  }
  await browser.close();
}

async function listJobs(): Promise<string[]> {
  try {
    const res = await fetch(`${base}/`);
    const html = await res.text();
    return [...html.matchAll(/\/jobs\/([a-z0-9-]+)/g)].map(m => m[1]!).filter((v, i, a) => a.indexOf(v) === i);
  } catch { return []; }
}

main().catch(error => { console.error(error); process.exit(1); });
