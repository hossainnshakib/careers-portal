import { expect, it, vi } from "vitest";
import type { Sql } from "postgres";
vi.mock("server-only", () => ({}));
import { reservedQueryClient } from "./reserved-client";

function fixture(fail = false) {
  const objects = [{ value: 7 }]; const arrays = [[7]];
  const release = vi.fn();
  const values = vi.fn(async () => { if (fail) throw new Error("Synthetic query failure"); return arrays; });
  const unsafe = vi.fn(() => Object.assign(Promise.resolve(objects), { values }));
  const begin = vi.fn();
  const rootUnsafe = vi.fn(() => { throw new Error("Unreserved queries must not run."); });
  const reserve = vi.fn(async () => ({ unsafe, release }));
  const root = { unsafe: rootUnsafe, reserve, begin } as unknown as Sql;
  return { client: reservedQueryClient(root), root, objects, arrays, release, values, unsafe, rootUnsafe, reserve, begin };
}
it("reserves object-mode statements and passes parameter/options values unchanged", async () => {
  const f = fixture();
  expect(await f.client.unsafe("select $1", [7], { prepare: false })).toEqual(f.objects);
  expect(f.unsafe).toHaveBeenCalledWith("select $1", [7], { prepare: false });
  expect(f.rootUnsafe).not.toHaveBeenCalled(); expect(f.release).toHaveBeenCalledOnce();
});
it("keeps Drizzle array-mode queries lazy and executes a statement only once across awaits", async () => {
  const f = fixture(); const query = f.client.unsafe("select $1", [7]).values();
  expect(f.reserve).not.toHaveBeenCalled();
  expect(await query).toEqual(f.arrays); expect(await query).toEqual(f.arrays);
  expect(f.values).toHaveBeenCalledOnce(); expect(f.unsafe).toHaveBeenCalledOnce(); expect(f.release).toHaveBeenCalledOnce();
});
it("releases failed statements without swallowing the failure", async () => {
  const f = fixture(true);
  await expect(f.client.unsafe("select $1", [7]).values()).rejects.toThrow("Synthetic query failure");
  expect(f.release).toHaveBeenCalledOnce();
});
it("leaves native transaction reservation and other client APIs unchanged", () => {
  const f = fixture();
  expect(f.client.begin).toBe(f.begin); expect(f.client.reserve).toBe(f.reserve);
});
it("uses an independent reservation for each overlapping statement", async () => {
  const f = fixture();
  await Promise.all([f.client.unsafe("select 1"), f.client.unsafe("select 2").values()]);
  expect(f.reserve).toHaveBeenCalledTimes(2); expect(f.release).toHaveBeenCalledTimes(2); expect(f.rootUnsafe).not.toHaveBeenCalled();
});
