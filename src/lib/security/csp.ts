export function createCsp(nonce: string, supabaseOrigin: string | null, development: boolean) {
  if (!/^[A-Za-z0-9+/=_-]+$/.test(nonce)) throw new Error("Invalid CSP nonce");
  const storage = supabaseOrigin ? ` ${new URL(supabaseOrigin).origin}` : "";
  const websocket = supabaseOrigin ? ` ${new URL(supabaseOrigin).origin.replace(/^https:/, "wss:")}` : "";
  return [
    "default-src 'self'", `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", `img-src 'self' data: blob:${storage}`, "font-src 'self'",
    `connect-src 'self' https://challenges.cloudflare.com${storage}${websocket}${development ? " ws: wss:" : ""}`,
    "frame-src https://challenges.cloudflare.com", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
  ].join("; ");
}
