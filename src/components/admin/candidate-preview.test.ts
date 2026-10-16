import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CandidatePreview } from "./candidate-preview";
import { copyStandardQuestions } from "@/lib/questions/defaults";

it("scales the whole card and displays the escaped live role title and complete fixed fields", () => {
  const html = renderToStaticMarkup(createElement(CandidatePreview, { questions: [], cvRequired: true, title: "বাংলা <script>role</script>" }));
  expect(html).toContain('class="admin-card admin-preview admin-preview-scale"');
  expect(html).toContain("Apply for বাংলা &lt;script&gt;role&lt;/script&gt;");
  expect(html).not.toContain("<script>");
  for (const label of ["Full name", "Email", "Phone", "Location", "CV", "privacy consent"]) expect(html).toContain(`aria-label="Preview ${label}"`);
  expect(html).toContain('placeholder="Full name"'); expect(html).toContain('placeholder="Email"');
  expect(html).toContain('type="email"'); expect(html).toContain('type="tel"');
  expect(html).toContain("Answers and selected files are not submitted.");
  expect(html).toContain("Validate preview answers"); expect(html).toContain('href="/privacy"');
});
it("keeps every configured section/question and optional CV while handling an empty title", () => {
  const questions = copyStandardQuestions();
  const html = renderToStaticMarkup(createElement(CandidatePreview, { questions, cvRequired: false, title: " " }));
  expect(html).toContain("Apply for this role"); expect(html).toContain("CV (optional)");
  for (const question of questions) expect(html).toContain(question.label);
  for (const section of ["professional", "experience", "portfolio"]) expect(html).toContain(`aria-label="Preview ${section}"`);
  expect(html).not.toContain("<form"); expect(html).not.toContain("turnstile");
});
