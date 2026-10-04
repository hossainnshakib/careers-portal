import "server-only";

import { closeDb } from "@/db";
import { getRowCounts } from "@/db/queries/counts";

getRowCounts()
  .then(
    (counts) => console.info(JSON.stringify(counts)),
    () => {
      console.error("Cannot read database counts. Check the dev connection.");
      process.exitCode = 1;
    },
  )
  .finally(closeDb);
