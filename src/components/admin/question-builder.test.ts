import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/app/admin/(protected)/jobs/actions", () => ({ copyJobQuestionsAction: vi.fn() }));
import { QuestionBuilder } from "./question-builder";
import { questionTypeChoices, newQuestion } from "@/lib/questions/editor";

it("renders compact headers with archive semantics, keyboard/drag controls and hidden full editors for all types", () => {
  const questions = questionTypeChoices.map(([type], index) => ({ ...newQuestion(index), type, label: `Synthetic ${type}` }));
  const html = renderToStaticMarkup(createElement(QuestionBuilder, { questions, onChange: () => {}, sources: [], hasApplications: true }));
  expect([...html.matchAll(/class="admin-question-head"/g)]).toHaveLength(11);
  expect([...html.matchAll(/draggable="true"/g)]).toHaveLength(11);
  expect(html).toContain('aria-label="Archive Question 1"'); expect(html).not.toContain('aria-label="Remove Question 1"');
  expect(html).toContain('aria-label="Edit question 1" aria-expanded="false"');
  for (const text of ["Minimum length", "Maximum length", "Minimum selections", "Maximum selections", "Integer only", "Accepted extensions", "Maximum size MB", "YYYY-MM-DD or today", "Additional settings"]) expect(html).toContain(text);
  expect(html).toContain('aria-label="Question 1 move up"'); expect(html).toContain('role="status" aria-live="polite"');
  expect(html).toContain('class="admin-question-edit-fields" hidden=""');
  expect(html).toContain('aria-label="Add question"');
});
it("retains max100/seven-default bounds and a genuine empty state with copy source access", () => {
  const props = { onChange: () => {}, sources: [{ id: "source", title: "Synthetic source" }], hasApplications: false };
  const empty = renderToStaticMarkup(createElement(QuestionBuilder, { ...props, questions: [] }));
  expect(empty).toContain("No questions yet."); expect(empty).toContain("Synthetic source");
  const full = renderToStaticMarkup(createElement(QuestionBuilder, { ...props, questions: Array.from({ length: 100 }, (_, i) => ({ ...newQuestion(i), label: "Fixture" })) }));
  expect(full).toContain('disabled="">Add question'); expect(full).toContain('disabled="">Add standard questions');
});
