import { expect, it } from "vitest";
import type { JobCard, PublicBrand } from "./filters";
import { accentColor, cardBrands, groupRoles, publicWebsite } from "./presentation";

const brand = (id: string): PublicBrand => ({ id, slug: id, name: id, sector: "other", description: "", logoUrl: null, accentColor: null });
const job = (id: string, department: string): JobCard => ({ id, title: id, slug: id, summary: "", employmentType: "full_time", workMode: "remote", experienceLevel: null, locationText: null, department: { name: department, slug: department }, brands: [brand("a"), brand("b"), brand("c")], primaryBrandId: "b" });

it("groups in department order, preserves role order and hides empty departments without renumbering", () => {
  const groups = groupRoles([job("second", "creative"), job("first", "tech"), job("third", "tech")], [
    { name: "Empty", slug: "empty" }, { name: "Technical", slug: "tech" }, { name: "Creative", slug: "creative" },
  ]);
  expect(groups.map(group => [group.number, group.slug, group.roles.map(role => role.id)])).toEqual([[2, "tech", ["first", "third"]], [3, "creative", ["second"]]]);
});
it("shows at most two brands with primary first and a visible fallback for hidden primaries", () => {
  const role = job("role", "tech");
  expect(cardBrands(role).map(item => item.id)).toEqual(["b", "a"]);
  expect(cardBrands({ ...role, primaryBrandId: "hidden" }).map(item => item.id)).toEqual(["a", "b"]);
  expect(cardBrands({ ...role, brands: [] })).toEqual([]);
});
it("accepts only passive six-digit accent values", () => {
  expect(accentColor("#2B95A0")).toBe("#2B95A0");
  for (const value of [null, "", "red; background: url(evil)", "#fff"]) expect(accentColor(value)).toBe("#20241f");
});
it("links only valid public HTTP(S) websites without embedded credentials", () => {
  expect(publicWebsite("https://brand.example.test")).toBe("https://brand.example.test/");
  for (const value of [null, "", "javascript:alert(1)", "https://user:password@brand.example.test", "not a URL"]) expect(publicWebsite(value)).toBeNull();
});
