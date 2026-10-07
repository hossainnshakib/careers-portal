import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { actionFiles, protectedApiRoutes, protectedPages } from "./surfaces";
const root = fileURLToPath(new URL("../../app/admin/", import.meta.url));
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(`${directory}/${entry.name}`).map((path) => `${entry.name}/${path}`)
      : [entry.name],
  );
}
it("covers every admin page, action export and route handler and requires direct gates", () => {
  const all = files(root);
  const pages = all.filter((path) => path.endsWith("page.tsx") && path !== "login/page.tsx");
  expect(
    pages
      .map((path) =>
        `/admin/${path.replace(/\(protected\)\//, "").replace(/\/?page\.tsx$/, "")}`.replace(
          /\/$/,
          "",
        ),
      )
      .sort(),
  ).toEqual([...protectedPages].sort());
  const discovered: Record<string, string[]> = {};
  for (const path of all.filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts"))) {
    const source = readFileSync(`${root}/${path}`, "utf8");
    if (!source.startsWith('"use server";')) continue;
    discovered[path] = [...source.matchAll(/export async function (\w+)/g)].map(
      (match) => match[1],
    );
    expect(source).toMatch(/await requireAdmin\(/);
    if (source.includes("allowMfaSetup")) expect(["login/actions.ts", "mfa/actions.ts"]).toContain(path);
  }
  expect(discovered).toEqual(actionFiles);
  for (const path of [...pages, "(protected)/layout.tsx"]) {
    const source = readFileSync(`${root}/${path}`, "utf8");
    expect(source).toMatch(/await requireAdmin\(/);
    if (source.includes("allowMfaSetup")) expect(path).toBe("mfa/page.tsx");
  }
  const apiRoot = fileURLToPath(new URL("../../app/api/", import.meta.url));
  const handlers = files(apiRoot).filter((path) => path.startsWith("admin/") && path.endsWith("route.ts"));
  expect(handlers.map((path) => `/api/${path.replace(/\/route\.ts$/, "")}`).sort()).toEqual([...protectedApiRoutes].sort());
  for (const path of handlers) expect(readFileSync(`${apiRoot}/${path}`, "utf8")).toContain("await requireAdmin()");
});
