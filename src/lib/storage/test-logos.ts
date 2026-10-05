import "server-only";

import { z } from "zod";
import { requireDevTarget } from "@/db/seed/require-dev";
import { getStorageClient } from "./client";

export async function removeTestLogos(brandIds: string[]) {
  requireDevTarget();
  const ids = z.array(z.uuid()).parse(brandIds);
  const bucket = getStorageClient().from("brand-assets");
  for (const id of ids) {
    const folder = `brands/${id}`;
    const paths: string[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await bucket.list(folder, { limit: 100, offset });
      if (error) throw new Error("Test logo lookup failed");
      paths.push(...data.filter((item) => item.id).map((item) => `${folder}/${item.name}`));
      if (data.length < 100) break;
    }
    if (paths.length) {
      const { error } = await bucket.remove(paths);
      if (error) throw new Error("Test logo cleanup failed");
    }
  }
}
