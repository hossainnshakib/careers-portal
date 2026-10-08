import { expect, it, vi } from "vitest";
import { createCsp } from "@/lib/security/csp";
import { anonymousDenied, inlineApplyRedirect, publicJobPath, responseLeaks, runSmoke, securityHeaders, smokeOrigin } from "./smoke";

const origin = "https://preview.example.test";
const safeHeaders = () => new Headers({
  "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()", "content-security-policy": createCsp("abcdefghijklmnopqrstuvwxyz123456", "https://example.supabase.co", false),
});
const snapshot = (body: string, status = 200, headers = safeHeaders()) => ({ body, status, headers });

it("accepts only a public HTTP(S) base origin and ignores external/legacy/non-anchor job links", () => {
  expect(smokeOrigin(`${origin}/`)).toBe(origin);
  for (const value of ["javascript:alert(1)", "https://user:private@example.test", `${origin}/path`, `${origin}/?secret=private`]) expect(() => smokeOrigin(value)).toThrow();
  expect(publicJobPath('<a href="https://other.example.test/jobs/role">External</a><a href="/jobs/role/apply">Old</a><a href="/jobs/valid-role?utm_source=poster">Role</a>', origin)).toBe("/jobs/valid-role");
  expect(publicJobPath('<script>"href=/jobs/not-a-link"</script>', origin)).toBeUndefined();
});
it("requires enforced nonce CSP and the expected security headers", () => {
  expect(securityHeaders(safeHeaders())).toBe(true);
  const headers = safeHeaders(); headers.set("content-security-policy", createCsp("abcdefghijklmnopqrstuvwxyz123456", null, true));
  expect(securityHeaders(headers)).toBe(false);
  headers.delete("content-security-policy"); headers.set("content-security-policy-report-only", createCsp("abcdefghijklmnopqrstuvwxyz123456", null, false));
  expect(securityHeaders(headers)).toBe(false);
});
it("accepts only same-origin login redirects or generic denials, never private content/signed download redirects", () => {
  expect(anonymousDenied(snapshot("", 307, new Headers({ location: "/admin/login" })), origin)).toBe(true);
  expect(anonymousDenied(snapshot('{"error":"Administrator access required."}', 403), origin)).toBe(true);
  expect(anonymousDenied(snapshot('{"error":"Administrator access required.","data":{"fullName":"Synthetic"}}', 403), origin)).toBe(false);
  expect(anonymousDenied(snapshot("%PDF-private", 200), origin)).toBe(false);
  expect(anonymousDenied(snapshot("", 302, new Headers({ location: "https://storage.example.test/signed" })), origin)).toBe(false);
});
it("requires the correct permanent same-origin apply anchor", () => {
  expect(inlineApplyRedirect(snapshot("", 308, new Headers({ location: "/jobs/role#apply" })), origin, "/jobs/role")).toBe(true);
  expect(inlineApplyRedirect(snapshot("", 302, new Headers({ location: "/jobs/role#apply" })), origin, "/jobs/role")).toBe(false);
  expect(inlineApplyRedirect(snapshot("", 308, new Headers({ location: "https://other.example.test/jobs/role#apply" })), origin, "/jobs/role")).toBe(false);
});
it.each([
  "Error: failure\n    at async work (/var/task/app.js:10:4)",
  "DATABASE_URL=postgres://fixture:private@db.example.test/postgres",
  "CRON_SECRET: synthetic-leaked-secret", "sb_secret_syntheticallyleaked", "-----BEGIN PRIVATE KEY-----",
])("detects diagnostics/private configuration without returning the matched text", body => {
  expect(responseLeaks(snapshot(body))).toBe(true);
});
it("allows public nonces and anonymous publishable JWTs but detects privileged tokens and header leakage", () => {
  const token = (role: string) => `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
  expect(responseLeaks(snapshot(`<input name="contact.email">${token("anon")}`))).toBe(false);
  expect(responseLeaks(snapshot(token("service_role")))).toBe(true);
  expect(responseLeaks(snapshot("", 200, new Headers({ authorization: "Bearer synthetic-private" })))).toBe(true);
});

function fakeServer(failHome = false, leak = false) {
  return vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    expect(init?.method).toBe("GET"); expect(init?.redirect).toBe("manual"); expect(init?.credentials).toBe("omit");
    expect(init?.body).toBeUndefined(); expect(init?.headers).toBeUndefined();
    const path = new URL(String(input)).pathname; const headers = safeHeaders();
    let status = 200; let body = "";
    if (path === "/api/health") body = '{"ok":true}';
    else if (path === "/") { status = failHome ? 503 : 200; body = '<a href="/jobs/role">Role</a>'; }
    else if (path === "/jobs/role") body = leak ? "CRON_SECRET=synthetic-private" : "Public role";
    else if (path === "/jobs/role/apply") { status = 308; headers.set("location", "/jobs/role#apply"); }
    else if (path.startsWith("/jobs/smoke-unknown-")) status = 404;
    else if (path === "/admin") { status = 307; headers.set("location", "/admin/login"); }
    else if (path.startsWith("/api/admin/")) { status = 403; body = '{"error":"Administrator access required."}'; }
    else if (path === "/api/cron/daily") { status = 401; body = '{"ok":false,"error":"Unauthorized."}'; }
    else if (path === "/sitemap.xml") body = '<urlset><url><loc>https://preview.example.test/jobs/role</loc></url></urlset>';
    else if (path === "/robots.txt") body = "User-agent: *\nDisallow: /admin\nDisallow: /api";
    return new Response(body, { status, headers });
  });
}
it("checks all anonymous surfaces with GET-only requests and clear safe PASS lines", async () => {
  const fetcher = fakeServer(); const lines: string[] = [];
  expect(await runSmoke(origin, fetcher, line => lines.push(line))).toBe(true);
  expect(lines.every(line => line.startsWith("PASS "))).toBe(true);
  expect(fetcher.mock.calls.some(([url]) => String(url).includes("/attachments/"))).toBe(true);
  expect(fetcher.mock.calls.some(([url]) => String(url).endsWith("/pdf"))).toBe(true);
});
it("fails non-zero-result checks and never prints leaked response values", async () => {
  const lines: string[] = [];
  expect(await runSmoke(origin, fakeServer(true, true), line => lines.push(line))).toBe(false);
  expect(lines.some(line => line.startsWith("FAIL "))).toBe(true);
  expect(lines.join("\n")).not.toContain("synthetic-private");
});
it("fails safely on network errors without printing provider messages", async () => {
  const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("Sensitive network diagnostic")); const lines: string[] = [];
  expect(await runSmoke(origin, fetcher, line => lines.push(line))).toBe(false);
  expect(lines.join("\n")).not.toContain("Sensitive");
});
