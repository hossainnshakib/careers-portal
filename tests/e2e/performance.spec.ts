import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { test } from "../support/admin-fixture";

test.use({ trace: "off" });
test.skip(process.env.RUN_LIGHTHOUSE !== "1", "Explicit performance run only.");
test("mobile Lighthouse reports for home, job detail and success", async ({ publicFixture, baseURL }) => {
  test.setTimeout(300000);
  const manager = process.env.npm_execpath;
  if (!manager) throw new Error("Run the performance check through pnpm.");
  const folder = "C:/Users/Hossa/AppData/Local/Temp/opencode";
  // Success is reference-only and deliberately performs no applicant lookup.
  const cases = { home: "/", job: `/jobs/${publicFixture.job.slug}`, success: "/applied/APP-234567" };
  for (const [label, path] of Object.entries(cases)) {
    const args = ["dlx", "lighthouse@13.5.0", `${baseURL}${path}`, "--quiet", "--output=json", `--output-path=${folder}/lighthouse-${label}.json`, "--only-categories=performance,accessibility,best-practices,seo", "--chrome-flags=--headless --no-sandbox", "--no-enable-error-reporting"];
    const executable = manager.endsWith(".exe") ? manager : process.execPath;
    const toolEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/(DATABASE|DIRECT_URL|SUPABASE|SECRET|TOKEN|PASSWORD|KEY|CREDENTIAL)/i.test(key))) as NodeJS.ProcessEnv;
    try {
      execFileSync(executable, manager.endsWith(".exe") ? args : [manager, ...args], {
        timeout: 90000, stdio: ["ignore", "pipe", "pipe"], env: { ...toolEnvironment, NODE_ENV: "production", CHROME_PATH: chromium.executablePath(), TEMP: folder, TMP: folder },
      });
    } catch (error) {
      const diagnostic = error as { stderr?: Buffer; status?: number };
      throw new Error(`Public Lighthouse subprocess failed (${diagnostic.status}): ${diagnostic.stderr?.toString() ?? "no diagnostic"}`);
    }
    const report = JSON.parse(await readFile(`${folder}/lighthouse-${label}.json`, "utf8")) as {
      categories: Record<string, { score: number }>;
      audits: Record<string, { score: number | null; scoreDisplayMode: string; numericValue?: number; title: string }>;
    };
    console.info(JSON.stringify({ page: label,
      scores: Object.fromEntries(Object.entries(report.categories).map(([key, category]) => [key, Math.round(category.score * 100)])),
      lcpMs: Math.round(report.audits["largest-contentful-paint"].numericValue ?? 0),
      cls: report.audits["cumulative-layout-shift"].numericValue,
      failedChecks: Object.entries(report.audits).filter(([, audit]) => audit.score === 0 && audit.scoreDisplayMode === "binary").map(([id]) => id),
    }));
  }
});
