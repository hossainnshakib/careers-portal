import type { NextConfig } from "next";
import { assertStartupEnvironment } from "./src/lib/app-env";
import { resolveSiteUrl } from "./src/lib/site-url";

// `next build` and `next start` both run with NODE_ENV=production and load the
// .env files before this file, so a production build with APP_ENV missing or
// unrecognised (or Turnstile test keys configured) fails here with a clear
// message instead of silently falling back to development.
assertStartupEnvironment(process.env, process.env.NODE_ENV);

const nextConfig: NextConfig = {
  // Bake the same resolved public origin into browser bundles; non-public
  // Vercel system variables are otherwise unavailable to client modules.
  env: { NEXT_PUBLIC_SITE_URL: resolveSiteUrl(process.env) },
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  logging: { incomingRequests: false },
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],
  outputFileTracingIncludes: { "/api/admin/applications/*/pdf": [
    "./assets/fonts/*.ttf", "./public/brands/*",
    // pdfkit uses createRequire with package-import font names at render time;
    // automatic tracing misses these modules and their sibling chunks.
    "./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/**",
  ] },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

export default nextConfig;
