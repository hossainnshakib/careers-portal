import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getStorageClient } from "./client";
import { validateBrandLogo } from "@/lib/validation/brand-logo";

export async function uploadBrandLogo(brandId: string, file: File) {
  z.uuid().parse(brandId);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { extension, mime } = validateBrandLogo(
    { name: file.name, type: file.type, size: file.size },
    bytes,
  );
  const path = `brands/${brandId}/${randomUUID()}.${extension}`;
  const storage = getStorageClient();
  const { error } = await storage
    .from("brand-assets")
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new Error("Logo upload failed");
  return { path, url: storage.from("brand-assets").getPublicUrl(path).data.publicUrl };
}

export async function removeBrandLogo(path: string) {
  if (!/^brands\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(svg|png|webp)$/.test(path))
    throw new Error("Invalid logo path");
  const { error } = await getStorageClient().from("brand-assets").remove([path]);
  if (error) throw new Error("Logo cleanup failed");
}
