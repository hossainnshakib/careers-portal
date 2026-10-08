import { runSmoke } from "../src/lib/deployment/smoke";

const arguments_ = process.argv.slice(2).filter(value => value !== "--");
try {
  if (arguments_.length !== 1) throw new Error("Invalid arguments");
  if (!await runSmoke(arguments_[0])) process.exitCode = 1;
} catch {
  console.error("FAIL smoke setup: use pnpm smoke -- <HTTP(S)-base-origin> without credentials or query parameters.");
  process.exitCode = 1;
}
