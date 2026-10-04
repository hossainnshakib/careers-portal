import { defineConfig } from "drizzle-kit";

// `db:generate` only reads the schema (no connection needed).
// Running/pushing migrations uses `pnpm db:migrate` (src/db/migrate.ts) with DIRECT_URL,
// so this placeholder URL is never dialed by our scripts.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? "postgres://user:pass@localhost:5432/placeholder",
  },
});
