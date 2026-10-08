import { randomUUID } from "node:crypto";
import { protectedApiRoutes } from "@/lib/auth/surfaces";

export type SmokeResponse = { status: number; headers: Headers; body: string };

export function smokeOrigin(value: string): string {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("Supply an HTTP(S) origin without credentials, path, query or fragment.");
  return url.origin;
}
export function publicJobPath(html: string, origin: string): string | undefined {
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1].replaceAll("&amp;", "&"), origin);
      if (url.origin === origin && /^\/jobs\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url.pathname) && url.pathname.length <= 126)
        return url.pathname;
    } catch { /* An invalid/external link is not a public role. */ }
  }
}
/** Signature checks, not an exhaustive detector of unknown unlabelled secrets. */
export function responseLeaks(response: SmokeResponse): boolean {
  const text = `${[...response.headers].map(([key, value]) => `${key}: ${value}`).join("\n")}\n${response.body}`
    .replaceAll("\\n", "\n").replaceAll("&quot;", '"').replaceAll("&#34;", '"');
  if (response.headers.has("authorization")) return true;
  if (/postgres(?:ql)?:\/\/|sb_secret_[A-Za-z0-9_-]{8,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/i.test(text)) return true;
  if (/\b(?:DATABASE_URL|DIRECT_URL|SUPABASE_SERVICE_ROLE_KEY|UPLOAD_SESSION_SECRET|CRON_SECRET|TURNSTILE_SECRET_KEY)["']?\s*[:=]\s*["']?[^\s"'<]+/i.test(text)) return true;
  if (/\bat\s+(?:async\s+)?[^\n<>]*(?:file:\/\/|[A-Z]:[\\/]|\/(?:app|var|usr|home|vercel|tmp)\/)[^\n<>]*:\d+:\d+/i.test(text) || /["']stack["']\s*:\s*["'][^"']*(?:Error|\\n\s*at)/i.test(text)) return true;
  for (const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\b/g)) {
    try {
      if (JSON.parse(Buffer.from(match[1], "base64url").toString("utf8")).role !== "anon") return true;
    } catch { return true; }
  }
  return false;
}
export function securityHeaders(headers: Headers): boolean {
  const csp = headers.get("content-security-policy") ?? "";
  const script = csp.split(";").find(value => /^\s*script-src\s/.test(value)) ?? "";
  const permissions = headers.get("permissions-policy") ?? "";
  return headers.get("x-content-type-options") === "nosniff" && headers.get("x-frame-options") === "DENY"
    && headers.get("referrer-policy") === "strict-origin-when-cross-origin"
    && ["camera=()", "microphone=()", "geolocation=()"].every(value => permissions.includes(value))
    && script.includes("'self'") && /'nonce-[A-Za-z0-9+/_-]{16,}={0,2}'/.test(script)
    && !script.includes("'unsafe-eval'") && !script.includes("'unsafe-inline'")
    && /frame-ancestors\s+'none'/.test(csp) && /object-src\s+'none'/.test(csp);
}
export function anonymousDenied(response: SmokeResponse, origin: string): boolean {
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    try {
      const url = new URL(response.headers.get("location") ?? "", origin);
      return url.origin === origin && url.pathname === "/admin/login" && !responseLeaks(response);
    } catch { return false; }
  }
  if (![401, 403].includes(response.status)) return false;
  if (!response.body.trim()) return true;
  if (["Unauthorized", "Forbidden"].includes(response.body.trim())) return true;
  try {
    const body = JSON.parse(response.body);
    return Object.keys(body).every(key => ["ok", "error"].includes(key)) && body.ok !== true
      && ["Administrator access required.", "Unauthorized.", "Unauthorized", "Forbidden"].includes(body.error);
  } catch { return false; }
}
export function inlineApplyRedirect(response: SmokeResponse, origin: string, path: string): boolean {
  try {
    const url = new URL(response.headers.get("location") ?? "", origin);
    return [301, 308].includes(response.status) && url.origin === origin && url.pathname === path && url.hash === "#apply";
  } catch { return false; }
}

async function boundedBody(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.length; if (size > 2 * 1024 * 1024) throw new Error("Response exceeds smoke limit.");
      chunks.push(chunk.value);
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks).toString("utf8");
}

/** GET only, no cookies, credentials, request bodies or automatic redirects. */
export async function runSmoke(base: string, fetcher: typeof fetch = fetch, emit: (line: string) => void = console.log): Promise<boolean> {
  const origin = smokeOrigin(base); let passed = true; let leakFree = true;
  function check(name: string, ok: boolean) { emit(`${ok ? "PASS" : "FAIL"} ${name}`); if (!ok) passed = false; }
  async function request(path: string): Promise<SmokeResponse | undefined> {
    try {
      const response = await fetcher(new URL(path, origin), { method: "GET", redirect: "manual", credentials: "omit", signal: AbortSignal.timeout(20_000) });
      const result = { status: response.status, headers: response.headers, body: await boundedBody(response) };
      if (responseLeaks(result)) leakFree = false;
      return result;
    } catch { leakFree = false; return undefined; }
  }
  const health = await request("/api/health");
  let healthOk = false;
  try { const value = JSON.parse(health?.body ?? ""); healthOk = value.ok === true && Object.keys(value).length === 1; } catch { /* Fail safely. */ }
  check("health JSON ok", health?.status === 200 && healthOk);
  const home = await request("/");
  check("home HTTP 200", home?.status === 200);
  const job = home ? publicJobPath(home.body, origin) : undefined;
  check("home has a public job link", !!job);
  const role = job ? await request(job) : undefined;
  check("public job HTTP 200", role?.status === 200);
  const unknown = await request(`/jobs/smoke-unknown-${randomUUID()}`);
  check("unknown job HTTP 404", unknown?.status === 404);
  const legacy = job ? await request(`${job}/apply`) : undefined;
  check("legacy apply permanent redirect to inline form", !!legacy && !!job && inlineApplyRedirect(legacy, origin, job));
  check("home security headers and enforced production CSP", !!home && securityHeaders(home.headers));
  check("job security headers and enforced production CSP", !!role && securityHeaders(role.headers));
  const admin = await request("/admin");
  check("anonymous admin page denied", !!admin && anonymousDenied(admin, origin));
  for (const route of protectedApiRoutes) {
    const result = await request(route.replace("[id]", "00000000-0000-4000-8000-000000000001"));
    check(`anonymous ${route} denied`, !!result && anonymousDenied(result, origin));
  }
  const cron = await request("/api/cron/daily");
  check("cron without secret HTTP 401", cron?.status === 401 && anonymousDenied(cron, origin));
  const sitemap = await request("/sitemap.xml");
  check("public sitemap responds", sitemap?.status === 200 && /<urlset\b/.test(sitemap.body) && !/\/(?:admin|applied)\//.test(sitemap.body));
  const robots = await request("/robots.txt");
  check("robots responds and excludes admin/API", robots?.status === 200 && /User-agent:/i.test(robots.body) && /Disallow:\s*\/admin/.test(robots.body) && /Disallow:\s*\/api/.test(robots.body));
  check("responses contain no detected stack/private configuration leaks", leakFree);
  return passed;
}
