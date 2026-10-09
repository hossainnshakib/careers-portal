/**
 * Managed option lists (arrangement / engagement / experience).
 *
 * This module is the single place where option groups and stored labels become
 * UI text. Labels are always shown exactly as stored — no case transforms,
 * capitalisation or "humanising" anywhere else in the app.
 */

export type OptionGroup = "arrangement" | "engagement" | "experience";

export const optionGroups: OptionGroup[] = ["arrangement", "engagement", "experience"];

export const optionGroupLabels: Record<OptionGroup, string> = {
  arrangement: "Work arrangement",
  engagement: "Engagement type",
  experience: "Experience",
};

export type OptionTag = { group: OptionGroup; slug: string; label: string };

/** Labels are rendered exactly as the admin stored them. */
export function optionLabel(option: { label: string }): string {
  return option.label;
}

/** Labels for one group, in stored order. */
export function groupLabels(options: OptionTag[], group: OptionGroup): string[] {
  return options.filter((option) => option.group === group).map(optionLabel);
}

export function hasGroup(options: OptionTag[], group: OptionGroup): boolean {
  return options.some((option) => option.group === group);
}

/** "Fresher welcome" is highlighted when the experience group includes it. */
export function fresherWelcome(options: OptionTag[]): boolean {
  return options.some((option) => option.group === "experience" && option.slug === "fresher-welcome");
}
