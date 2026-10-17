import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ postgres: vi.fn(), drizzle: vi.fn(), migrate: vi.fn(), end: vi.fn(), tls: vi.fn(), env: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("postgres", () => ({ default: mocks.postgres }));
vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: mocks.drizzle }));
vi.mock("drizzle-orm/postgres-js/migrator", () => ({ migrate: mocks.migrate }));
vi.mock("@/lib/env", () => ({ getServerEnv: mocks.env, getDatabaseTlsOptions: mocks.tls }));
beforeEach(() => {
  vi.resetModules(); vi.resetAllMocks();
  mocks.env.mockReturnValue({ DATABASE_URL: "runtime-fixture", DIRECT_URL: "maintenance-fixture" });
  mocks.tls.mockReturnValue({ rejectUnauthorized: true, ca: "test-ca" });
  mocks.postgres.mockReturnValue({ end: mocks.end });
});
it("runtime connections keep prepare:false and use verified TLS", async () => {
  const { getDb, closeDb } = await import("./index");
  getDb();
  expect(mocks.postgres).toHaveBeenCalledWith("runtime-fixture", expect.objectContaining({ ssl: { rejectUnauthorized: true, ca: "test-ca" }, prepare: false, max: 5 }));
  await closeDb();
});
it("maintenance migrations use verified TLS and close the dedicated connection", async () => {
  const { runMigrations } = await import("./migrate");
  await runMigrations();
  expect(mocks.postgres).toHaveBeenCalledWith("maintenance-fixture", { ssl: { rejectUnauthorized: true, ca: "test-ca" }, prepare: false, max: 1 });
  expect(mocks.migrate).toHaveBeenCalledOnce(); expect(mocks.end).toHaveBeenCalledOnce();
});
it.each(["runtime", "maintenance"])("%s fails before connecting when TLS configuration is rejected", async kind => {
  mocks.tls.mockImplementation(() => { throw new Error("TLS refused"); });
  if (kind === "runtime") { const { getDb } = await import("./index"); expect(() => getDb()).toThrow("TLS refused"); }
  else { const { runMigrations } = await import("./migrate"); await expect(runMigrations()).rejects.toThrow("TLS refused"); }
  expect(mocks.postgres).not.toHaveBeenCalled();
});
