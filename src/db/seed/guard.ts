/** Fail closed: an independently pinned dev ref must match BOTH database targets. */
export function assertDevTarget(input: {
  appEnv?: string;
  devProjectRef?: string;
  databaseUrl?: string;
  directUrl?: string;
  supabaseUrl?: string;
}) {
  if (input.appEnv !== "development")
    throw new Error("Demo/reset operations require APP_ENV=development.");
  const ref = input.devProjectRef;
  if (!ref || !/^[a-z0-9]{20}$/.test(ref))
    throw new Error("Pin DEV_SUPABASE_PROJECT_REF before demo/reset operations.");
  try {
    const api = new URL(input.supabaseUrl ?? "");
    if (api.protocol !== "https:" || api.hostname !== `${ref}.supabase.co`) throw new Error();
    for (const value of [input.databaseUrl, input.directUrl]) {
      const url = new URL(value ?? "");
      const direct = url.hostname === `db.${ref}.supabase.co`;
      const pooler =
        /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) &&
        decodeURIComponent(url.username) === `postgres.${ref}`;
      if (
        !/^postgres(ql)?:$/.test(url.protocol) ||
        (!direct && !pooler) ||
        url.pathname !== "/postgres"
      )
        throw new Error();
    }
  } catch {
    throw new Error("Demo/reset refused: connection targets do not match the pinned dev project.");
  }
}
