import "server-only";

import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";

export async function runMigrations() {
  const client = postgres(getServerEnv().DIRECT_URL, { prepare: false, max: 1 });
  try {
    await migrate(drizzle(client), {
      migrationsFolder: fileURLToPath(new URL("./migrations", import.meta.url)),
    });
  } finally {
    await client.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then(
    () => console.info("Migrations completed."),
    () => {
      console.error("Migration failed. Check the connection settings and database dashboard.");
      process.exitCode = 1;
    },
  );
}
