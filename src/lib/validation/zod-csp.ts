import { config } from "zod/v4/core";

// Zod's optional JIT probes new Function during schema construction. Use its
// supported interpreter mode so strict script CSP never needs unsafe-eval.
config({ jitless: true });
