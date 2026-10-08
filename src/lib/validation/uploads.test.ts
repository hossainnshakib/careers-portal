import { expect, it } from "vitest";
import { hasFileSignature, sanitizeFileName, validateUploadMetadata } from "./uploads";
import type { QuestionDefinition } from "@/lib/questions/definition";
const q: QuestionDefinition = { id: "00000000-0000-4000-8000-000000000001", label: "Sample", type: "file_upload", required: true, helpText: null, options: null, config: { accept: ["png"], maxSizeMb: 1 }, section: "portfolio", sortOrder: 0 };
it("checks server-loaded slot limits, MIME/extension agreement and positive sizes", () => {
  const file = { fileName: "cv.pdf", mime: "application/pdf", size: 500 };
  expect(() => validateUploadMetadata(file, "cv", [q])).not.toThrow();
  for (const invalid of [{ ...file, mime: "text/html" }, { ...file, fileName: "cv.svg" }, { ...file, size: 0 }, { ...file, size: 5 * 1024 * 1024 + 1 }]) expect(() => validateUploadMetadata(invalid, "cv", [q])).toThrow();
  expect(() => validateUploadMetadata(file, q.id, [q])).toThrow();
  expect(() => validateUploadMetadata({ fileName: "x.png", mime: "image/png", size: 1048577 }, q.id, [q])).toThrow();
  expect(() => validateUploadMetadata(file, "unknown", [q])).toThrow();
});
it("sanitizes filenames and rejects content inconsistent with the allowed type", () => {
  expect(sanitizeFileName("../../my résumé.PDF")).toBe("my_r_sum_.pdf");
  expect(sanitizeFileName("C:\\fakepath\\cv.pdf")).toBe("cv.pdf");
  expect(hasFileSignature("application/pdf", new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
  expect(hasFileSignature("application/pdf", new TextEncoder().encode("<script>alert(1)</script>"))).toBe(false);
  expect(hasFileSignature("image/svg+xml", new TextEncoder().encode("<svg/>"))).toBe(false);
});
