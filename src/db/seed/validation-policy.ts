export const approvedDemoProject = "xmtoccukridshadnxrlc";
export type DemoOperation = "seed" | "publish" | "cleanup";
export function parseDemoCommand(args: string[]) {
  const [operation, ...flags] = args;
  if (!["seed", "publish", "cleanup"].includes(operation)) throw new Error("Choose seed, publish or cleanup.");
  if (new Set(flags).size !== flags.length || flags.some(flag => !["--write", `--confirm=${approvedDemoProject}`].includes(flag)))
    throw new Error("Unknown or duplicate flags. Default is dry-run; writing requires --write and --confirm=<approved DEV ref>.");
  const write = flags.includes("--write");
  if (write !== flags.includes(`--confirm=${approvedDemoProject}`)) throw new Error("Writing requires both --write and exact DEV confirmation.");
  return { operation: operation as DemoOperation, write };
}
