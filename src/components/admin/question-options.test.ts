import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { QuestionOptions } from "./question-options";
import { newQuestion } from "@/lib/questions/editor";

it("uses Enter-add plus independently labelled value/label/removal controls, not a multiline parser", () => {
  const html = renderToStaticMarkup(createElement(QuestionOptions, { question: { ...newQuestion(0), type: "single_choice", options: [{ value: "a", label: "বাংলা" }] }, prefix: "Fixture", onChange: () => {} }));
  expect(html).toContain('placeholder="Add option, press Enter"'); expect(html).not.toContain("textarea");
  for (const label of ["Fixture option 1 label", "Fixture option 1 value", "Fixture remove option 1"]) expect(html).toContain(`aria-label="${label}"`);
  expect(html).toContain("বাংলা");
});
it("reports duplicate values and disables adding past the existing 100-option limit", () => {
  const render = (options: { value: string; label: string }[]) => renderToStaticMarkup(createElement(QuestionOptions, { question: { ...newQuestion(0), options }, prefix: "Fixture", onChange: () => {} }));
  expect(render([{ value: "a", label: "A" }, { value: "a", label: "B" }])).toContain("Option values must be unique.");
  expect(render(Array.from({ length: 100 }, (_, i) => ({ value: String(i), label: String(i) })))).toContain('disabled=""');
});
