import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, getSecurityEnvironment } from "@/lib/env-public";
import { createCsp } from "@/lib/security/csp";
import { adminCookieOptions, adminCookieWriteOptions, isAdminSessionCookie } from "@/lib/auth/session-cookies";

export async function middleware(request: NextRequest) {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const security = getSecurityEnvironment();
  const csp = createCsp(nonce, security.supabaseOrigin, security.development);
  const flight = request.headers.get("rsc") === "1" || request.headers.has("next-action");
  if (flight) {
    request.headers.delete("x-nonce");
    request.headers.delete("Content-Security-Policy");
  } else {
    request.headers.set("x-nonce", nonce);
    request.headers.set("Content-Security-Policy", csp);
  }
  if (!request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/api/admin")) {
    const publicResponse = NextResponse.next({ request });
    if (!flight) publicResponse.headers.set("Content-Security-Policy", csp);
    return publicResponse;
  }
  const env = getPublicEnv();
  const secure = process.env.VERCEL === "1" || new URL(env.NEXT_PUBLIC_SITE_URL).protocol === "https:";
  let response = NextResponse.next({ request });
  const changedCookies = new Map<string, { name: string; value: string; options: ReturnType<typeof adminCookieWriteOptions> }>();
  const refreshHeaders = new Map<string, string>();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: adminCookieOptions(secure),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          for (const { name, value, options } of values) {
            if (options.maxAge === 0) request.cookies.delete(name); else request.cookies.set(name, value);
            changedCookies.set(name, { name, value, options: adminCookieWriteOptions(options, secure) });
          }
          for (const [name, value] of Object.entries(headers)) refreshHeaders.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of changedCookies.values()) response.cookies.set(name, value, options);
          for (const [name, value] of refreshHeaders) response.headers.set(name, value);
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // Slide the cookie window on verified activity even when the access token
    // is still fresh. Token values/AAL are unchanged; authorization is separate.
    for (const { name, value } of request.cookies.getAll()) {
      if (isAdminSessionCookie(name, env.NEXT_PUBLIC_SUPABASE_URL) && !changedCookies.has(name))
        response.cookies.set(name, value, adminCookieWriteOptions({}, secure));
    }
  }
  if (!user && request.nextUrl.pathname !== "/admin/login" && !request.nextUrl.pathname.startsWith("/api/admin/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    response = redirect;
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  if (!flight) response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|brands/|fonts/).*)"] };
