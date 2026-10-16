import { expect, request, type FullConfig } from "@playwright/test";
import sweepAccounts from "./sweep-accounts";
import { demoSlugs } from "../../src/lib/demo";
import { verifyDemoTarget } from "./verify-demo-target";

export default async function setup(config: FullConfig) {
  verifyDemoTarget();
  sweepAccounts();
  const api = await request.newContext({ baseURL: config.projects[0].use.baseURL });
  try {
    // CLI publication cannot call Next's revalidateTag. A persisted stale catalog
    // can return once while revalidation runs; require the actual five roles
    // before starting populated-catalog assertions, without deleting build caches.
    await expect.poll(async () => {
      const response = await api.get("/");
      const html = await response.text();
      return response.ok() && demoSlugs.every(slug => html.includes(`/jobs/${slug}`));
    }, { timeout: 45000, intervals: [500, 1000, 2000], message: "Seed/publish all five approved DEMO jobs; public catalog must be ready before E2E." }).toBe(true);
  } finally { await api.dispose(); }
}
