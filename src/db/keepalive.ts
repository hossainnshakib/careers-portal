import "server-only";

import postgres from "postgres";
import { getDevDatabaseEnv } from "@/lib/env";
import { requireDevTarget } from "@/db/seed/require-dev";

async function keepAlive() {
  requireDevTarget();
  const client = postgres(getDevDatabaseEnv().DATABASE_URL, {
    prepare: false,
    max: 1,
    connect_timeout: 10,
  });
  try {
    await client`select 1`;
    console.info("Dev database connection checked.");
  } finally {
    await client.end();
  }
}

keepAlive().catch(() => {
  console.error(
    "Dev database check failed or was refused. Check project availability and dev configuration.",
  );
  process.exitCode = 1;
});
