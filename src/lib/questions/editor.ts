import type { QuestionDefinition } from "./definition";

export const questionTypeChoices = [
  ["short_text", "Short text"], ["long_text", "Long text"], ["single_choice", "Single choice"],
  ["multiple_choice", "Multiple choice"], ["yes_no", "Yes/No"], ["number", "Number"],
  ["url", "URL"], ["email", "Email"], ["phone", "Phone"], ["date", "Date"], ["file_upload", "File upload"],
] as const;

export function newQuestion(sortOrder: number): QuestionDefinition {
  return { id: crypto.randomUUID(), label: "", type: "short_text", required: false, helpText: null, section: "role_specific", options: null, config: null, sortOrder };
}
export function reorderQuestions(questions: QuestionDefinition[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= questions.length || to >= questions.length || from === to) return questions;
  const next = [...questions];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((question, sortOrder) => ({ ...question, sortOrder }));
}
export function nextOptionValue(options: { value: string }[]) {
  let index = 1;
  while (options.some((option) => option.value === `option_${index}`)) index++;
  return `option_${index}`;
}
