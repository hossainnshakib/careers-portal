"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { AdminAccessError, requireAdmin } from "@/lib/auth/requireAdmin";
import { brandInput } from "@/lib/validation/brands";
import { reorderInput } from "@/lib/validation/departments";
import {
  brandJobSlugs,
  findBrand,
  reorderBrand,
  saveBrand,
  setBrandLogo,
} from "@/db/queries/brands";
import { removeBrandLogo, uploadBrandLogo } from "@/lib/storage/brand-logos";
import type { ActionResult } from "@/lib/actions/result";

async function invalidate(id: string) {
  revalidateTag("brands");
  revalidateTag("jobs");
  for (const { slug } of await brandJobSlugs(id)) revalidateTag(`job:${slug}`);
  revalidatePath("/admin/brands");
}
function failure(error: unknown) {
  return {
    ok: false,
    error:
      error instanceof AdminAccessError
        ? "Administrator access required."
        : "Unable to update brand. Check the fields and unique slug, then try again.",
  } as const;
}

export async function saveBrandAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = brandInput.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        error: "Check the brand fields, website URL and six-digit hex accent color.",
      };
    const row = await saveBrand(parsed.data);
    await invalidate(row.id);
    return { ok: true, data: row };
  } catch (error) {
    return failure(error);
  }
}

export async function reorderBrandAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = reorderInput.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid reorder request." };
    await reorderBrand(parsed.data.id, parsed.data.direction);
    await invalidate(parsed.data.id);
    return { ok: true, data: null };
  } catch (error) {
    return failure(error);
  }
}

export async function uploadBrandLogoAction(input: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (
      !(input instanceof FormData) ||
      [...input.keys()].some((key) => !["brandId", "file"].includes(key)) ||
      input.getAll("brandId").length !== 1 ||
      input.getAll("file").length !== 1
    )
      return { ok: false, error: "Invalid logo request." };
    const id = z.uuid().safeParse(input.get("brandId"));
    const file = input.get("file");
    if (!id.success || !(file instanceof File) || file.size === 0 || file.size > 1024 * 1024)
      return { ok: false, error: "Choose an SVG, PNG or WebP logo up to 1 MB." };
    if (!(await findBrand(id.data))) return { ok: false, error: "Brand not found." };
    const uploaded = await uploadBrandLogo(id.data, file);
    try {
      await setBrandLogo(id.data, uploaded.url);
    } catch (error) {
      await removeBrandLogo(uploaded.path);
      throw error;
    }
    await invalidate(id.data);
    return { ok: true, data: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AdminAccessError
          ? "Administrator access required."
          : "Unable to upload logo. Use a valid PNG/WebP or passive SVG without scripts, styles or external resources.",
    };
  }
}
