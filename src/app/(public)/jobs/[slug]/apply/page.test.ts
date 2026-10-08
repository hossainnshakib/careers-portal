import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ permanentRedirect: mocks.redirect, notFound: () => { throw new Error("not-found"); } }));
import ApplyPage from "./page";
beforeEach(() => { vi.resetAllMocks(); mocks.redirect.mockImplementation(() => { throw new Error("permanent-redirect"); }); });
it("permanently redirects the old valid URL to the inline form anchor", async () => {
  await expect(ApplyPage({ params: Promise.resolve({ slug: "web-developer" }) })).rejects.toThrow("permanent-redirect");
  expect(mocks.redirect).toHaveBeenCalledWith("/jobs/web-developer#apply");
});
it("rejects unsafe slugs instead of reflecting them into a redirect", async () => {
  await expect(ApplyPage({ params: Promise.resolve({ slug: "../private" }) })).rejects.toThrow("not-found");
  expect(mocks.redirect).not.toHaveBeenCalled();
});
