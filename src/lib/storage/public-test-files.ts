import "server-only";

import { z } from "zod";
import { requireDevTarget } from "@/db/seed/require-dev";
import { getStorageClient } from "./client";

/** Only explicit ephemeral session UUIDs supplied by the guarded browser worker. */
export async function removePublicTestFiles(prefix: string, sessionIds: string[]) {
  requireDevTarget();
  if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) throw new Error("Invalid public test prefix");
  const bucket = getStorageClient().from("applications");
  for (const session of z.array(z.uuid()).max(100).parse(sessionIds)) {
    const reservations = await bucket.list(`pending/${session}/reservations`, { limit: 9 });
    if (reservations.error) throw new Error("Cannot inspect test reservations");
    for (const item of reservations.data) {
      const stored = await bucket.download(`pending/${session}/reservations/${item.name}`);
      if (stored.error || stored.data.size > 4096) throw new Error("Cannot verify test reservation");
      const reservation = z.object({ jobSlug: z.string(), sessionId: z.literal(session) }).parse(JSON.parse(await stored.data.text()));
      if (!reservation.jobSlug.startsWith(prefix)) throw new Error("Not a test-owned upload session");
    }
    for (const folder of [`pending/${session}`, `pending/${session}/reservations`, `applications/${session}`]) {
      const listed = await bucket.list(folder, { limit: 100 });
      if (listed.error) throw new Error("Cannot inspect test files");
      const paths = listed.data.filter((item) => item.id).map((item) => `${folder}/${item.name}`);
      if (paths.length && !reservations.data.length) throw new Error("Test file ownership cannot be established");
      if (paths.length && (await bucket.remove(paths)).error) throw new Error("Cannot remove test files");
    }
  }
}
