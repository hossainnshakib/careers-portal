import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config({ path: fileURLToPath(new URL("./.env.local", import.meta.url)), quiet: true });

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
