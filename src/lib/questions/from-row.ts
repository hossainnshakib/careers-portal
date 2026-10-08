import type { JobQuestion } from "@/db/schema";
import { questionDefinitionSchema } from "./definition";

export function questionFromRow(q: JobQuestion) {
  return questionDefinitionSchema.parse({
    id: q.id,
    label: q.label,
    helpText: q.helpText,
    type: q.type,
    required: q.required,
    options: q.options,
    config: q.config,
    section: q.section,
    sortOrder: q.sortOrder,
  });
}
