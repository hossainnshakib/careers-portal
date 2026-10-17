/** Owner-designated production target. Environment variables cannot reclassify it. */
export const productionProjectRef = "xmtoccukridshadnxrlc";

/** Reject ambiguous URL options before postgres.js turns them into startup parameters. */
export function parseDatabaseTarget(value: string | undefined) {
  try {
    if (typeof value !== "string" || [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) throw new Error();
    const url = new URL(value ?? "");
    if (!/^postgres(ql)?:$/.test(url.protocol) || url.pathname !== "/postgres" || url.hash ||
        !url.password || [...url.searchParams].some(([key, mode]) => key !== "sslmode" || mode !== "verify-full") ||
        url.searchParams.getAll("sslmode").length > 1) throw new Error();
    const username = decodeURIComponent(url.username);
    decodeURIComponent(url.password); // Refuse malformed escapes before driver parsing.
    const direct = /^db\.([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname);
    const pooler = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname);
    const tenant = /^([a-z_][a-z0-9_]*)\.([a-z0-9]{20})$/.exec(username);
    if (direct && /^[a-z_][a-z0-9_]*$/.test(username) && ["", "5432", "6543"].includes(url.port))
      return { ref: direct[1], transaction: url.port === "6543" };
    if (pooler && tenant && ["5432", "6543"].includes(url.port))
      return { ref: tenant[2], transaction: url.port === "6543" };
    throw new Error();
  } catch {
    throw new Error("Invalid database target or TLS options.");
  }
}

export function assertProjectConnections(ref: string, input: {
  databaseUrl?: string; directUrl?: string; supabaseUrl?: string;
}) {
  try {
    const api = new URL(input.supabaseUrl ?? "");
    if (api.origin !== `https://${ref}.supabase.co` || api.username || api.password || api.search || api.hash || api.pathname !== "/") throw new Error();
    if (parseDatabaseTarget(input.databaseUrl).ref !== ref) throw new Error();
    const direct = parseDatabaseTarget(input.directUrl);
    if (direct.ref !== ref || direct.transaction) throw new Error();
  } catch {
    throw new Error("Connection targets must match the independent project pin; maintenance requires direct/session mode.");
  }
}

/** Startup also checks partial configuration: production is never a DEV/preview target. */
export function assertDeploymentTarget(values: Record<string, string | undefined>) {
  const production = values.APP_ENV === "production";
  if (values.VERCEL === "1" && (production ? values.VERCEL_ENV !== "production" : values.VERCEL_ENV === "production"))
    throw new Error("Deployment scope and APP_ENV must agree; production credentials are forbidden in previews.");
  if (production) return;
  if (values.DEV_SUPABASE_PROJECT_REF === productionProjectRef ||
      [values.NEXT_PUBLIC_SUPABASE_URL, values.DATABASE_URL, values.DIRECT_URL].some(value => value?.includes(productionProjectRef)))
    throw new Error("The designated production project is forbidden in development and preview configuration.");
}

/** Independent pin for owner-run setup, never inferred from connection strings. */
export function assertAllowedTarget(input: {
  appEnv?: string; allowedProjectRef?: string; devProjectRef?: string;
  databaseUrl?: string; directUrl?: string; supabaseUrl?: string;
}) {
  const validRef = (value: string | undefined): value is string => !!value && /^[a-z0-9]{20}$/.test(value);
  if (!validRef(input.allowedProjectRef))
    throw new Error("Pin ALLOWED_SUPABASE_PROJECT_REF before owner maintenance.");
  if (input.appEnv === "development") {
    if (!validRef(input.devProjectRef) || input.devProjectRef === productionProjectRef || input.allowedProjectRef === productionProjectRef)
      throw new Error("Development requires an independent non-production project pin.");
    if (input.allowedProjectRef !== input.devProjectRef) throw new Error("Development maintenance must target the pinned dev project.");
  } else if (input.appEnv === "production") {
    if (input.allowedProjectRef !== productionProjectRef || input.devProjectRef !== undefined)
      throw new Error("Production maintenance requires the designated production pin and no DEV pin.");
  } else throw new Error("Owner maintenance requires explicit APP_ENV=development or production.");
  assertProjectConnections(input.allowedProjectRef, input);
}

export function assertMaintenanceConfirmation(args: readonly string[], ref: string) {
  if (args.length !== 2 || !args.includes("--apply") || !args.includes(`--confirm=${ref}`))
    throw new Error("No changes authorized: require --apply and exact --confirm project approval.");
}
