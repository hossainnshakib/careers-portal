import { expect, it } from "vitest";
import { posterLinksCsv } from "./poster-links";

const job = { title: '"Quoted", Role', department: "Technical", slug: "quoted-role", brands: ["a", "b"] };
it("writes quoted public fields, stable poster UTMs and LF rows", () => {
  const csv = posterLinksCsv([job], "https://careers.example.test", "recruitment-v1");
  expect(csv).toContain('"""Quoted"", Role"'); expect(csv).toContain('"a,b"');
  expect(csv).toContain("https://careers.example.test/jobs/quoted-role?utm_source=poster&utm_medium=qr&utm_campaign=recruitment-v1&utm_content=quoted-role");
  expect(csv).not.toContain("\r"); expect(csv.endsWith("\n")).toBe(true);
});
it("keeps Bengali public titles and neutralizes spreadsheet formula cells", () => {
  expect(posterLinksCsv([{ ...job, title: "বাংলা ভূমিকা" }], "https://careers.example.test", "v1")).toContain("বাংলা ভূমিকা");
  expect(posterLinksCsv([{ ...job, title: "=1+1" }], "https://careers.example.test", "v1")).toContain("'=1+1");
});
it("rejects unsafe URL schemes, embedded credentials, slugs and campaign values", () => {
  expect(() => posterLinksCsv([job], "javascript:alert(1)", "v1")).toThrow();
  expect(() => posterLinksCsv([job], "https://user:password@example.test", "v1")).toThrow();
  expect(() => posterLinksCsv([{ ...job, slug: "../private" }], "https://careers.example.test", "v1")).toThrow();
  expect(() => posterLinksCsv([job], "https://careers.example.test", "../private")).toThrow();
});
it("exports only a header when there are no public roles", () => {
  expect(posterLinksCsv([], "https://careers.example.test", "v1").split("\n")).toHaveLength(2);
});
