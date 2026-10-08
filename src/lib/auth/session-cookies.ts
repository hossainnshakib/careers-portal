import type { CookieOptions } from "@supabase/ssr";

/** Single setting for the sliding cookie window and absolute provider-session cap. */
export const adminSessionLifetimeSeconds = 30 * 24 * 60 * 60;
export function adminCookieOptions(secure: boolean): CookieOptions {
  return { path: "/", httpOnly: true, sameSite: "lax", secure, maxAge: adminSessionLifetimeSeconds };
}
/** SSR 0.12.7 overwrites maxAge with its 400-day default; normalize at setAll. */
export function adminCookieWriteOptions(options: CookieOptions, secure: boolean, now = Date.now()): CookieOptions {
  const clearing = options.maxAge === 0;
  return { ...adminCookieOptions(secure), maxAge: clearing ? 0 : adminSessionLifetimeSeconds,
    expires: new Date(clearing ? 0 : now + adminSessionLifetimeSeconds * 1000) };
}
export function isAdminSessionCookie(name: string, supabaseUrl: string): boolean {
  const base = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
  return name === base || (name.startsWith(`${base}.`) && /^\d+$/.test(name.slice(base.length + 1)));
}
