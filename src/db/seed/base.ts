import "server-only";

import { fileURLToPath } from "node:url";
import { closeDb, getDb } from "@/db";
import { brands, departments } from "@/db/schema";
import { brandData, departmentData } from "./data";

export async function seedBase() {
  // Repeat runs preserve owner edits: insert missing rows without resetting descriptions/order.
  await getDb().transaction(async (tx) => {
    for (const [i, [name, slug]] of departmentData.entries()) {
      await tx
        .insert(departments)
        .values({ name, slug, sortOrder: i + 1 })
        .onConflictDoNothing({ target: departments.slug });
    }
    for (const [i, brand] of brandData.entries()) {
      await tx
        .insert(brands)
        .values({ ...brand, sortOrder: i + 1, logoUrl: `/brands/${brand.slug}.svg` })
        .onConflictDoNothing({ target: brands.slug });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedBase()
    .then(
      () => console.info("Base seed completed."),
      () => {
        console.error("Base seed failed. Check dev database configuration.");
        process.exitCode = 1;
      },
    )
    .finally(closeDb);
}
