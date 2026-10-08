import type { QuestionDefinition } from "./definition";

export const standardQuestions = [
  {
    label: "LinkedIn profile",
    type: "url",
    required: false,
    section: "professional",
    config: null,
  },
  {
    label: "Portfolio or website",
    type: "url",
    required: false,
    section: "portfolio",
    config: null,
  },
  {
    label: "Years of relevant experience",
    type: "number",
    required: true,
    section: "experience",
    config: { integer: true, min: 0, max: 50 },
  },
  {
    label: "Current or most recent job title and company",
    type: "short_text",
    required: false,
    section: "experience",
    config: null,
  },
  {
    label: "Earliest date you can join",
    type: "date",
    required: false,
    section: "professional",
    config: { min: "today" },
  },
  {
    label: "Expected monthly salary (BDT)",
    type: "number",
    required: false,
    section: "professional",
    config: null,
  },
  {
    label: "Why do you want to work with us?",
    type: "long_text",
    required: true,
    section: "professional",
    config: { maxLength: 1500 },
  },
] as const;

export function copyStandardQuestions(startOrder = 0): QuestionDefinition[] {
  return standardQuestions.map((definition, index) => ({
    ...structuredClone(definition),
    id: crypto.randomUUID(),
    helpText: null,
    options: null,
    sortOrder: startOrder + index,
  }));
}
