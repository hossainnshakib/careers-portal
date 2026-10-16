import { jobInput, missingPublishGroups, type JobInput } from "@/lib/validation/jobs";
import { optionGroupLabels, type OptionGroup } from "@/lib/careers/option-labels";

/** Advisory UI check only; the authorized server always reloads and validates. */
export function publishBlockers(draft: JobInput, options: { id: string; group: OptionGroup }[]) {
  const groups = draft.optionIds.map((id) => options.find((option) => option.id === id)?.group).filter((group): group is OptionGroup => !!group);
  const blockers = missingPublishGroups(groups).map((group) => `Select at least one ${optionGroupLabels[group].toLowerCase()}.`);
  const parsed = jobInput.safeParse({ ...draft, intent: "publish" });
  if (!parsed.success) blockers.push(...parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  return [...new Set(blockers)];
}
