import sweepAccounts from "./sweep-accounts";
import { verifyDemoTarget } from "./verify-demo-target";

/** Read-only deployment check must pass before the fixture can create an account. */
export default async function setup() {
  verifyDemoTarget();
  const response = await fetch("https://careers-portal-sigma.vercel.app/admin/login", { signal: AbortSignal.timeout(20000), redirect: "error" });
  const csp = response.headers.get("content-security-policy") ?? "";
  const refs = [...csp.matchAll(/https:\/\/([a-z0-9]{20})\.supabase\.co/g)].map(match => match[1]);
  if (!response.ok || !refs.length || refs.some(ref => ref !== "xmtoccukridshadnxrlc"))
    throw new Error("Live DEV project origin not verified; no live testing allowed.");
  sweepAccounts();
}
