import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const source = (path: string) => readFileSync(`${root}/${path}`, "utf8");
it("keeps one daily Mumbai cron and explicit Hobby-valid budgets above the PDF timeout", () => {
  const config = JSON.parse(source("vercel.json"));
  expect(config.regions).toEqual(["bom1"]);
  expect(config.crons).toEqual([{ path: "/api/cron/daily", schedule: "0 0 * * *" }]);
  const timeout = Number(source("src/lib/pdf/render.tsx").match(/renderTimeoutMs\s*=\s*([\d_]+)/)?.[1].replaceAll("_", "")) / 1000;
  expect(timeout).toBeGreaterThan(0);
  for (const path of ["src/app/api/admin/applications/[id]/pdf/route.ts", "src/app/api/upload-url/route.ts", "src/app/(public)/jobs/[slug]/page.tsx", "src/app/(public)/jobs/[slug]/apply/page.tsx"]) {
    const text = source(path);
    expect(text).toContain('export const runtime = "nodejs"');
    const duration = Number(text.match(/export const maxDuration = (\d+)/)?.[1]);
    expect(duration).toBeGreaterThan(timeout);
    expect(duration).toBeLessThanOrEqual(300); // Current documented Hobby Fluid limit.
  }
});
it("traces static Bengali fonts and logos while externalizing sharp with Linux packages locked", () => {
  const config = source("next.config.ts");
  expect(config).toContain('"./assets/fonts/*.ttf"'); expect(config).toContain('"./public/brands/*"');
  expect(existsSync(`${root}/assets/fonts/HindSiliguri-Regular.ttf`)).toBe(true);
  expect(existsSync(`${root}/assets/fonts/HindSiliguri-Bold.ttf`)).toBe(true);
  expect(config).toContain('serverExternalPackages: ["@react-pdf/renderer", "sharp"]');
  expect(source("pnpm-lock.yaml")).toContain("@img/sharp-linux-x64");
  expect(source("pnpm-lock.yaml")).toContain("@img/sharp-libvips-linux-x64");
});
