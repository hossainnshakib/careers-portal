import { z } from "zod";
import { applicationStatusEnum } from "@/db/schema";
import { isCalendarDate } from "@/lib/questions/definition";

const optionalId = z.union([z.literal(""), z.uuid()]).default("");
const optionalDate = z.union([z.literal(""), z.string().refine(isCalendarDate)]).default("");
export const reviewFilters = z.strictObject({
  brand: optionalId,
  department: optionalId,
  job: optionalId,
  status: z.union([z.literal(""), z.enum(applicationStatusEnum.enumValues)]).default(""),
  q: z.string().trim().max(200).default(""),
  from: optionalDate,
  to: optionalDate,
  tz: z.string().max(100).default("UTC").refine((zone) => {
    try { new Intl.DateTimeFormat("en", { timeZone: zone }); return true; }
    catch { return false; }
  }, "Invalid timezone"),
  sort: z.enum(["newest", "oldest", "name_asc", "name_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  cleanup: optionalId,
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "Date range is reversed", path: ["to"],
});
export type ReviewFilters = z.infer<typeof reviewFilters>;
export const applicationIdInput = z.strictObject({ applicationId: z.uuid() });
export const statusInput = applicationIdInput.extend({ status: z.enum(applicationStatusEnum.enumValues) });
export const noteInput = applicationIdInput.extend({ note: z.string().trim().min(1).max(10000) });
export const deleteNoteInput = applicationIdInput.extend({ noteId: z.uuid() });
export const deleteApplicationInput = applicationIdInput.extend({ confirmed: z.literal(true) });

export function safeApplicantUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = z.url({ protocol: /^https?$/ }).max(2048).safeParse(value);
  return parsed.success ? parsed.data : null;
}
