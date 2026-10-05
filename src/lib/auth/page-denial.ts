import "server-only";

import { redirect } from "next/navigation";
import { AdminAccessError } from "./requireAdmin";

/** Translate only expected access denials; let Next's error boundary handle outages. */
export function redirectAdminDenial(error: unknown): never {
  if (error instanceof AdminAccessError) redirect("/admin/login");
  throw error;
}
