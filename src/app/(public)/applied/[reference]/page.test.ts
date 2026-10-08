import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ getDb: vi.fn(() => { throw new Error("Public acknowledgement must not query applicant data."); }) }));
vi.mock("@/db", () => db);
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));
import AppliedPage, { metadata } from "./page";

it("shows any syntactically valid reference without a lookup and excludes reference values from metadata", async () => {
  const html = renderToStaticMarkup(await AppliedPage({ params: Promise.resolve({ reference: "APP-234567" }) }));
  expect(html).toContain("APP-234567"); expect(html).toContain("Application submitted");
  expect(db.getDb).not.toHaveBeenCalled();
  expect(metadata.robots).toEqual({ index: false, follow: false });
  expect(JSON.stringify(metadata)).not.toContain("APP-234567");
});
it.each(["not-valid", "APP-000000", "APP-234567-extra"])("rejects malformed references without any data access", async (reference) => {
  await expect(AppliedPage({ params: Promise.resolve({ reference }) })).rejects.toThrow("not-found");
  expect(db.getDb).not.toHaveBeenCalled();
});
