import "server-only";
import type { Sql } from "postgres";

/**
 * Drizzle's postgres.js driver awaits unsafe() in object or values() mode.
 * Reserve a pool connection for that statement so overlapping simple/extended
 * protocol queries cannot share it. Native transactions already reserve theirs.
 */
export function reservedQueryClient(client: Sql): Sql {
  return new Proxy(client, {
    get(target, key, receiver) {
      if (key !== "unsafe") return Reflect.get(target, key, receiver);
      return (...args: Parameters<Sql["unsafe"]>) => {
        let arrayMode = false;
        let execution: Promise<unknown> | undefined;
        const run = () => execution ??= (async () => {
          const reserved = await client.reserve();
          try {
            const query = reserved.unsafe(...args);
            return await (arrayMode ? query.values() : query);
          } finally { reserved.release(); }
        })();
        return {
          values() { arrayMode = true; return this; },
          then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) { return run().then(resolve, reject); },
          catch(reject: (reason: unknown) => unknown) { return run().catch(reject); },
          finally(callback: () => void) { return run().finally(callback); },
        };
      };
    },
  });
}
