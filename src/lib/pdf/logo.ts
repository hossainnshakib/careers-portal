import "server-only";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { readUploadedPdfLogo } from "@/lib/storage/pdf-brand-logo";

export async function pdfLogo(logoUrl: string | null): Promise<string | undefined> {
  if (!logoUrl) return undefined;
  const bytes = /^\/brands\/[a-z0-9-]+\.(svg|png|webp)$/.test(logoUrl)
    ? await readFile(resolve("public", logoUrl.slice(1)))
    : await readUploadedPdfLogo(logoUrl);
  if (bytes.length > 1024 * 1024) throw new Error("PDF logo exceeds limit");
  const png = await sharp(bytes, { limitInputPixels: 20000000 }).resize({ width: 480, height: 180, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
