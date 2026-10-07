import { z } from "zod";
import { NextResponse } from "next/server";
import { AdminAccessError, requireAdmin } from "@/lib/auth/requireAdmin";
import { loadPdfProfile } from "@/db/queries/pdf";
import { renderProfilePdf } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
const querySchema = z.strictObject({
  notes: z.enum(["0", "1"]).default("0"),
  tz: z.string().max(100).default("UTC"), locale: z.string().max(100).default("en-GB"),
}).refine((value) => { try { new Intl.DateTimeFormat(value.locale, { timeZone: value.tz }); return true; } catch { return false; } });
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const id = z.uuid().safeParse((await params).id);
    const search = new URL(request.url).searchParams;
    const query = querySchema.safeParse(Object.fromEntries(search));
    if (!id.success || !query.success || [...search.keys()].some((key) => search.getAll(key).length !== 1)) return NextResponse.json({ error: "Invalid PDF request." }, { status: 400, headers });
    const profile = await loadPdfProfile(id.data, query.data.notes === "1");
    if (!profile) return NextResponse.json({ error: "Application not found." }, { status: 404, headers });
    const bytes = await renderProfilePdf(profile, query.data.tz, query.data.locale);
    const reference = profile.application.reference.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80);
    const name = Array.from(profile.application.fullName.replace(/[\r\n\u0000-\u001f\u202a-\u202e\u2066-\u2069/\\"<>:|?*]/g, "_")).slice(0, 100).join("");
    const filename = encodeURIComponent(`${reference}-${name}.pdf`).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new NextResponse(new Uint8Array(bytes), { headers: {
      ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${reference}-profile.pdf"; filename*=UTF-8''${filename}`,
    } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof AdminAccessError ? "Administrator access required." : "Unable to generate profile PDF." }, { status: error instanceof AdminAccessError ? 403 : 503, headers });
  }
}
