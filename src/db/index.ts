import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";
import { reservedQueryClient } from "./reserved-client";

let connection: ReturnType<typeof postgres> | undefined;
export function getDb() {
  connection ??= postgres(getServerEnv().DATABASE_URL, {
    prepare: false,
    max: 5,
    connect_timeout: 10,
  });
  return drizzle(reservedQueryClient(connection), { schema });
}

export async function closeDb() {
  await connection?.end();
  connection = undefined;
}
