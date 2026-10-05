import { expect, it } from "vitest";
import { jobData } from "@/db/seed/data";
import { slugify, uniqueSlug } from "./slug";

it("produces lowercase ASCII with punctuation and ampersands removed", () => {
  expect(slugify("  Web & Backend Security Analyst! ")).toBe("web-backend-security-analyst");
  expect(slugify("UI/UX Designer")).toBe("uiux-designer");
  expect(slugify("---Hello--- world---")).toBe("hello-world");
  expect(slugify("বাংলা")).toBe("");
});
it.each(jobData)("preserves the explicit intended slug for %s", (_title, intended) => {
  expect(slugify(intended)).toBe(intended);
  expect(uniqueSlug(intended, new Set())).toBe(intended);
});
it("adds the first available collision suffix", () => {
  expect(uniqueSlug("job", new Set(["job", "job-2"]))).toBe("job-3");
  expect(uniqueSlug("job", new Set(["job", "job-3"]))).toBe("job-2");
});
