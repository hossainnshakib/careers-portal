import { z } from "zod";
import { NextResponse } from "next/server";
import { AdminAccessError, requireAdmin } from "@/lib/auth/requireAdmin";
import { authorizeReviewDownload } from "@/db/queries/review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const parsed = z.uuid().safeParse((await params).id);
    if (!parsed.success) return NextResponse.json({ error: "Attachment not found." }, { status: 404, headers });
    const url = await authorizeReviewDownload(parsed.data);
    if (!url) return NextResponse.json({ error: "Attachment not found." }, { status: 404, headers });
    return new NextResponse(null, { status: 302, headers: { ...headers, Location: url } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof AdminAccessError ? "Administrator access required." : "Unable to download attachment." }, { status: error instanceof AdminAccessError ? 403 : 503, headers });
  }
}
