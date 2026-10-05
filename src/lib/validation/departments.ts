import { z } from "zod";

export const slugInput = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase ASCII letters, numbers and single hyphens.");
export const departmentInput = z.strictObject({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1).max(150),
  slug: slugInput,
  isActive: z.boolean(),
});
export const reorderInput = z.strictObject({ id: z.uuid(), direction: z.enum(["up", "down"]) });
export type DepartmentInput = z.infer<typeof departmentInput>;
