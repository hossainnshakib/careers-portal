import "./zod-csp";
import { z } from "zod";
import { sectorEnum } from "@/db/schema";
import { slugInput } from "./departments";

export const brandInput = z.strictObject({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1).max(150),
  slug: slugInput,
  sector: z.enum(sectorEnum.enumValues),
  description: z.string().trim().max(3000),
  website: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(2048)]),
  accentColor: z.union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{6}$/)]),
  status: z.enum(["active", "hidden"]),
});
export type BrandInput = z.infer<typeof brandInput>;
