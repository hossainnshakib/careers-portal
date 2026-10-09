import { expect, it } from "vitest";
import { missingPdfTraceAssets, missingTraceDisposition } from "./trace-guard";

const files = [
  "../../node_modules/.pnpm/pdfkit@0.20.1/node_modules/pdfkit/js/standard-fonts/Helvetica.cjs",
  "../../node_modules/.pnpm/pdfkit@0.20.1/node_modules/pdfkit/js/standard-fonts/chunks/font.cjs",
  "../../node_modules/.pnpm/pdfkit@0.20.1/node_modules/pdfkit/js/data/sRGB_IEC61966_2_1.icc",
  "../../assets/fonts/HindSiliguri-Regular.ttf", "../../assets/fonts/HindSiliguri-Bold.ttf", "../../public/brands/brand.svg",
];
it("accepts complete pnpm traces including Windows separators", () => {
  expect(missingPdfTraceAssets(files, ["brand.svg"])).toEqual([]);
  expect(missingPdfTraceAssets(files.map(path => path.replaceAll("/", "\\")), ["brand.svg"])).toEqual([]);
});
it.each(files)("fails when an independently required runtime asset is absent: %s", missing => {
  expect(missingPdfTraceAssets(files.filter(file => file !== missing), ["brand.svg"])).toHaveLength(1);
});
it("does not accept only the ESM Helvetica file instead of the lazily required CJS module", () => {
  expect(missingPdfTraceAssets(files.map(file => file.replace("Helvetica.cjs", "Helvetica.mjs")), ["brand.svg"])).toContain("pdfkit Helvetica standard font module");
});
it("rejects malformed file lists and empty logo inventories", () => {
  expect(() => missingPdfTraceAssets(undefined, ["brand.svg"])).toThrow();
  expect(missingPdfTraceAssets(files, [])).toContain("static brand logo inventory");
});
it("skips only without a build, while a missing trace after a build fails", () => {
  expect(missingTraceDisposition(false, false)).toBe("skip");
  expect(missingTraceDisposition(true, false)).toBe("fail");
  expect(missingTraceDisposition(false, true)).toBe("fail");
});
