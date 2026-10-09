import "server-only";

import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { brands, departments, jobOptions } from "@/db/schema";
import { brandData, defaultBrandAccents, departmentData, optionData } from "./data";

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
      // Default accents apply only where the owner has not chosen one.
      if (defaultBrandAccents[brand.slug])
        await tx
          .update(brands)
          .set({ accentColor: defaultBrandAccents[brand.slug] })
          .where(sql`${brands.slug} = ${brand.slug} and ${brands.accentColor} is null`);
    }
    for (const option of optionData) {
      await tx
        .insert(jobOptions)
        .values({ group: option.group, label: option.label, slug: option.slug, sortOrder: option.sortOrder })
        .onConflictDoNothing({ target: [jobOptions.group, jobOptions.slug] });
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
