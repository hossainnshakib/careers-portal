import { defineConfig } from "drizzle-kit";

// `db:generate` only reads the schema (no connection needed).
// No cloud credentials are accepted here. Use the guarded migration CLIs;
// production requires the owner command with explicit apply/target confirmation.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
});
