import React from "react";
import { expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { CandidateProfile } from "./CandidateProfile";
import { pdfText, type PdfModel } from "./model";

it("uses the same human-readable choice labels in PDF text nodes", () => {
  const model: PdfModel = { reference: "APP-234567", fullName: "Synthetic Candidate", email: "fixture@example.test", phone: "01700000000", location: "Dhaka", title: "Synthetic role", brands: [], primaryBrand: "Synthetic brand", department: "Technical", status: "new", accent: "#30303B", timezone: "UTC", locale: "en-GB", appliedAt: "2026-10-09T00:00:00Z", generatedAt: "2026-10-09T00:00:00Z", attachments: [], notes: [], answers: [
    { label: "Single", type: "single_choice", section: "skills", value: "skill_0", questionOptions: [{ value: "skill_0", label: "Beginner" }] },
    { label: "Multiple", type: "multiple_choice", section: "skills", value: ["skill_0", "Other text"], optionsSnapshot: [{ value: "skill_0", label: "Original label" }] },
    { label: "Boolean", type: "yes_no", section: "skills", value: false },
  ] };
  const text: string[] = [];
  function visit(node: React.ReactNode) {
    if (typeof node === "string") text.push(node);
    else if (React.isValidElement<{ children?: React.ReactNode }>(node)) React.Children.forEach(node.props.children, visit);
  }
  visit(CandidateProfile({ model }));
  expect(text.join(" ")).toContain("Beginner"); expect(text.join(" ")).toContain("Original label, Other text");
  expect(text).toContain("No"); expect(text.join(" ")).not.toContain("skill_0");
});

it("paginates long Bengali/URL answers and allocates visible footer boxes on every page", async () => {
  const model: PdfModel = { reference: "APP-234567", fullName: "শ্রী ক্ষিতিশ", email: "fixture@example.com", phone: "01700000000", location: "Dhaka", title: "Test role", brands: ["Test brand"], primaryBrand: "Test brand", department: "Test department", status: "new", accent: "#30303B", timezone: "UTC", locale: "en-GB", appliedAt: "2026-10-07T00:00:00Z", generatedAt: "2026-10-07T00:00:00Z", attachments: [], notes: [], answers: [
    { label: "Bengali answer", type: "long_text", section: "professional", value: "শ্রীময়ীর কর্মক্ষেত্রে গবেষণা ও সৃজনশীল প্রকল্পের অভিজ্ঞতা রয়েছে। ".repeat(120) },
    { label: "Long URL", type: "url", section: "portfolio", value: `https://example.com/${"portfolio".repeat(160)}` },
  ] };
  type Node = { type: string; props?: { render?: unknown }; box?: { height?: number }; lines?: unknown[]; children?: Node[] };
  const heights: number[] = [];
  const lineCounts: number[] = [];
  const pdf = await renderToBuffer(React.cloneElement(CandidateProfile({ model }), { onRender: (data: { _INTERNAL__LAYOUT__DATA_?: Node }) => {
    function visit(node: Node) { if (node.type === "TEXT" && node.props?.render) { heights.push(node.box?.height ?? 0); lineCounts.push(node.lines?.length ?? 0); } node.children?.forEach(visit); }
    if (data._INTERNAL__LAYOUT__DATA_) visit(data._INTERNAL__LAYOUT__DATA_);
  } }));
  const pages = (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;
  expect(pages).toBeGreaterThan(1); expect(heights).toHaveLength(pages); expect(heights.every((height) => height >= 14)).toBe(true);
  expect(lineCounts.every((lines) => lines > 0)).toBe(true);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  const url = `https://example.com/${"x".repeat(200)}`;
  expect(pdfText(url).replaceAll("\n", "")).toBe(url);
}, 30000);
