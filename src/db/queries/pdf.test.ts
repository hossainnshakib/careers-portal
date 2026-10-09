import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ tables: [] as unknown[] }));
import { adminNotes, applications } from "@/db/schema";
vi.mock("@/db", () => ({ getDb: () => ({ select: () => {
  let table: unknown;
  const chain = { from: (value: unknown) => { table = value; state.tables.push(value); return chain; }, leftJoin: () => chain, where: () => chain, limit: () => chain, orderBy: () => chain,
    then: (resolve: (rows: object[]) => unknown) => Promise.resolve(table === applications ? [{ primaryBrandSnapshot: "Test brand" }] : []).then(resolve) };
  return chain;
} }) }));
import { loadPdfProfile } from "./pdf";
it("does not even query internal notes unless explicitly requested", async () => {
  state.tables = []; const profile = await loadPdfProfile("id", false); expect(profile?.notes).toEqual([]); expect(state.tables.includes(adminNotes)).toBe(false);
  state.tables = []; await loadPdfProfile("id", true); expect(state.tables.includes(adminNotes)).toBe(true);
});
