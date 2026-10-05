import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { actionFiles, protectedPages } from "./surfaces";
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
    expect(source).toContain("await requireAdmin()");
  }
  expect(discovered).toEqual(actionFiles);
  for (const path of [...pages, "(protected)/layout.tsx"])
    expect(readFileSync(`${root}/${path}`, "utf8")).toContain("await requireAdmin()");
  const apiRoot = fileURLToPath(new URL("../../app/api/", import.meta.url));
  expect(
    files(apiRoot).filter((path) => path.startsWith("admin/") && path.endsWith("route.ts")),
  ).toEqual([]);
  // There are no admin API handlers in Phase 1; adding one requires registry/tests.
});
