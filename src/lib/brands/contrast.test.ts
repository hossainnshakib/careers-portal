import { expect, it } from "vitest";
import { brandData } from "@/db/seed/data";
import { contrastRatio, readableAccentText, snapshotAccent } from "./contrast";

it("matches known WCAG reference ratios and chooses neutral readable text", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBe(21);
  expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  expect(readableAccentText("#777777")).toBe("#000000");
  expect(readableAccentText("#1B2F6E")).toBe("#ffffff");
  expect(readableAccentText("#ffffff")).toBe("#000000");
});
it.each(brandData)("keeps the $name default accent above 4.5:1", (brand) => {
  expect(contrastRatio(brand.accentColor, readableAccentText(brand.accentColor))).toBeGreaterThanOrEqual(4.5);
});
it("covers middle tones and the sRGB colour cube without an unreadable gap", () => {
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
    const color = `#${[r, g, b].map(value => value.toString(16).padStart(2, "0")).join("")}`;
    expect(contrastRatio(color, readableAccentText(color))).toBeGreaterThanOrEqual(4.5);
  }
});
it("uses neutral fallback for missing/ambiguous snapshots without changing names", () => {
  expect(snapshotAccent("Old name", [{ name: "New name", accentColor: "#EC1C24" }])).toBe("#20241f");
  expect(snapshotAccent("Same", [{ name: "Same", accentColor: "#EC1C24" }, { name: "Same", accentColor: "#2B95A0" }])).toBe("#20241f");
  expect(snapshotAccent("Same", [{ name: "Same", accentColor: "#2B95A0" }])).toBe("#2B95A0");
});
