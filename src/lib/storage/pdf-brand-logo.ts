import "server-only";

import { getPublicEnv } from "@/lib/env-public";
import { getStorageClient } from "./client";
import { validateBrandLogo } from "@/lib/validation/brand-logo";

export async function readUploadedPdfLogo(url: string) {
  const parsed = new URL(url);
  if (parsed.origin !== new URL(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).origin || parsed.search || parsed.hash) throw new Error("Invalid PDF logo origin");
  const prefix = "/storage/v1/object/public/brand-assets/";
  const path = parsed.pathname.slice(prefix.length);
  if (!parsed.pathname.startsWith(prefix) || !/^brands\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(svg|png|webp)$/.test(path)) throw new Error("Invalid PDF logo path");
  const downloaded = await getStorageClient().from("brand-assets").download(path);
  if (downloaded.error || downloaded.data.size > 1024 * 1024) throw new Error("Unable to read PDF logo");
  const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
  const extension = path.split(".").at(-1)!;
  const mime = { svg: "image/svg+xml", png: "image/png", webp: "image/webp" }[extension]!;
  validateBrandLogo({ name: `logo.${extension}`, type: mime, size: bytes.length }, bytes);
  return bytes;
}
