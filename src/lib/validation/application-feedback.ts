import type { QuestionDefinition } from "@/lib/questions/definition";
import type { ActionResult } from "@/lib/actions/result";

export type ApplicationField = "contact.fullName" | "contact.email" | "contact.phone" | "contact.location" | "consent" | "cv" | `answers.${string}`;
export type ApplicationFieldError = { field: ApplicationField; message: string };
export type ApplicationSubmitResult = ActionResult<never> | { ok: false; error: string; fieldErrors: ApplicationFieldError[] };

type Issue = { path: readonly PropertyKey[]; code?: string };
const contactMessages: Record<string, string> = {
  fullName: "Enter your full name (up to 200 characters).",
  email: "Enter a valid email address (up to 254 characters).",
  phone: "Enter a valid Bangladesh or international phone number.",
  location: "Enter your city and country (up to 300 characters).",
};

/** Only public, known fields and static guidance; never serialize Zod input or security details. */
export function applicationFieldErrors(issues: readonly Issue[], questions: readonly QuestionDefinition[], envelope = false): ApplicationFieldError[] {
  const errors = new Map<ApplicationField, string>();
  for (const issue of issues) {
    const path = [...issue.path];
    if (envelope && path[0] === "contact" && typeof path[1] === "string" && Object.hasOwn(contactMessages, path[1])) {
      errors.set(`contact.${path[1]}` as ApplicationField, contactMessages[path[1]]);
      continue;
    }
    if (path[0] === "cv") { errors.set("cv", "Upload one valid CV file before submitting."); continue; }
    if (envelope && path[0] === "consent") { errors.set("consent", "Consent to the privacy notice is required."); continue; }
    if (envelope) {
      if (path[0] !== "answers") continue;
      path.shift();
    }
    const question = questions.find(q => q.id === path[0]);
    if (!question) continue;
    const message = question.type === "number" ? `Enter a valid ${question.config?.integer === true ? "whole " : ""}number within the permitted range.`
      : question.type === "date" ? "Enter a valid date within the permitted range."
      : question.type === "url" ? "Enter a complete http:// or https:// URL."
      : question.type === "email" ? "Enter a valid email address."
      : question.type === "phone" ? contactMessages.phone
      : question.type === "file_upload" ? "Upload the required permitted file before submitting."
      : question.type.endsWith("choice") ? "Choose the permitted number of options and complete any selected Other answer."
      : question.type === "yes_no" ? "Choose Yes or No."
      : "Enter an answer within the required length.";
    errors.set(`answers.${question.id}`, message);
  }
  return [...errors].map(([field, message]) => ({ field, message }));
}
