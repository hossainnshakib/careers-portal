import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import { assertDevTarget } from "./src/db/seed/guard";

dotenv.config({ path: fileURLToPath(new URL("./.env.local", import.meta.url)), quiet: true });

// Refuse an accidentally enabled cloud suite before any fixture lifecycle starts.
if (process.env.RUN_SUPABASE_TESTS === "1") assertDevTarget({
  appEnv: process.env.APP_ENV, devProjectRef: process.env.DEV_SUPABASE_PROJECT_REF,
  databaseUrl: process.env.DATABASE_URL, directUrl: process.env.DIRECT_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
});

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
  },
});
