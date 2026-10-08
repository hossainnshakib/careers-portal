/** Independent pin for owner-run setup, never inferred from connection strings. */
export function assertAllowedTarget(input: {
  appEnv?: string; allowedProjectRef?: string; devProjectRef?: string;
  databaseUrl?: string; directUrl?: string; supabaseUrl?: string;
}) {
  const validRef = (value: string | undefined): value is string => !!value && /^[a-z0-9]{20}$/.test(value);
  if (!validRef(input.allowedProjectRef) || !validRef(input.devProjectRef))
    throw new Error("Pin ALLOWED_SUPABASE_PROJECT_REF and DEV_SUPABASE_PROJECT_REF before owner maintenance.");
  if (input.appEnv === "development") {
    if (input.allowedProjectRef !== input.devProjectRef) throw new Error("Development maintenance must target the pinned dev project.");
  } else if (input.appEnv === "production") {
    if (input.allowedProjectRef === input.devProjectRef) throw new Error("Production maintenance must not target the dev project.");
  } else throw new Error("Owner maintenance requires explicit APP_ENV=development or production.");
  const ref = input.allowedProjectRef;
  try {
    const api = new URL(input.supabaseUrl ?? "");
    if (api.protocol !== "https:" || api.hostname !== `${ref}.supabase.co`) throw new Error();
    for (const value of [input.databaseUrl, input.directUrl]) {
      const url = new URL(value ?? "");
      const direct = url.hostname === `db.${ref}.supabase.co`;
      const pooler = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) && decodeURIComponent(url.username) === `postgres.${ref}`;
      if (!/^postgres(ql)?:$/.test(url.protocol) || (!direct && !pooler) || url.pathname !== "/postgres") throw new Error();
    }
  } catch {
    throw new Error("Owner maintenance refused: API and both database targets must match the independent allowed pin.");
  }
}
