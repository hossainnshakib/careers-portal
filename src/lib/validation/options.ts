import "./zod-csp";
import { z } from "zod";
import { optionGroupEnum } from "@/db/schema";
import { slugInput } from "./departments";

export const optionInput = z.strictObject({
  id: z.uuid().nullable(),
  group: z.enum(optionGroupEnum.enumValues),
  label: z.string().trim().min(1).max(40),
  slug: slugInput,
  isActive: z.boolean(),
});
export const optionReorder = z.strictObject({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});
export const optionDelete = z.strictObject({ id: z.uuid() });
export type OptionInput = z.infer<typeof optionInput>;
