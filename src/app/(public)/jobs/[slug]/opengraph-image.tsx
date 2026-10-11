import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { z } from "zod";
import { loadPublicJob } from "@/db/queries/public-jobs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Careers job posting";

/**
 * Per-job Open Graph image. Brand logos are SVG files which satori (ImageResponse)
 * cannot render, so we fall back to the primary brand's initials on a coloured chip.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).safeParse((await params).slug);
  if (!slug.success) notFound();
  const data = await loadPublicJob(slug.data).catch(() => null);
  if (!data || data.job.status === "draft" || !data.brands.some(item => item.brand.status === "active")) notFound();
  const visibleBrands = data.brands.filter(item => item.brand.status === "active").sort((a, b) => Number(b.primary) - Number(a.primary));
  const primary = visibleBrands[0]?.brand;
  const initials = primary?.name.split(/\s+/).map(word => word[0]).join("").slice(0, 2).toUpperCase() ?? "C";
  const accent = primary?.accentColor && /^#[a-f0-9]{6}$/i.test(primary.accentColor) ? primary.accentColor : "#2f6bff";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#f2f5fb", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#ffffff" }}>{initials}</span>
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#5a6478" }}>{data.department.name}</span>
        </div>
        <p style={{ marginTop: 36, fontSize: 64, fontWeight: 800, color: "#0b1220", letterSpacing: -2, lineHeight: 1.05 }}>{data.job.title}</p>
        {data.job.summary && <p style={{ marginTop: 20, fontSize: 28, color: "#5a6478", maxWidth: 900 }}>{data.job.summary.slice(0, 120)}</p>}
        <p style={{ marginTop: 32, fontSize: 24, fontWeight: 700, color: "#1e4fd8" }}>Careers</p>
      </div>
    ),
    { ...size },
  );
}
