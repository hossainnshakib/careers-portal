import { expect, it, vi } from "vitest";
vi.mock("@/lib/env-public", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://careers.example.test/" }) }));
vi.mock("@/db/queries/public-jobs", () => ({ loadPublicCatalog: async () => ({ jobs: [{ slug: "open-role" }] }) }));
import sitemap from "./sitemap";
import robots from "./robots";

it("lists public careers/privacy/open-role URLs without private, success or legacy apply URLs", async () => {
  expect((await sitemap()).map(entry => entry.url)).toEqual([
    "https://careers.example.test", "https://careers.example.test/privacy", "https://careers.example.test/jobs/open-role",
  ]);
});
it("keeps admin/API/reference and legacy apply paths out of crawler access", () => {
  expect(robots()).toMatchObject({ rules: { allow: "/", disallow: ["/admin", "/api", "/applied", "/jobs/*/apply"] }, sitemap: "https://careers.example.test/sitemap.xml" });
});
