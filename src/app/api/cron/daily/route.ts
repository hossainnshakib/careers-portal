import { hasCronAuthorization } from "@/lib/auth/cron";
import { cleanupPendingUploads } from "@/lib/storage/cleanup-pending";
import { checkDatabaseConnection } from "@/db/queries/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request) {
  try {
    if (!hasCronAuthorization(request.headers.get("authorization")))
      return Response.json({ ok: false, error: "Unauthorized." }, { status: 401, headers });
    const counts = await cleanupPendingUploads();
    await checkDatabaseConnection();
    return Response.json(counts, { headers });
  } catch {
    return Response.json({ ok: false, error: "Daily maintenance failed." }, { status: 503, headers });
  }
}
