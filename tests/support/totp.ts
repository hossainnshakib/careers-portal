// RFC 6238 fixture only; production verification is performed by Supabase.
import { createHmac } from "node:crypto";
export function testTotp(secret: string, now = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const letter of secret.toUpperCase().replace(/=+$/, "")) {
    const value = alphabet.indexOf(letter);
    if (value < 0) throw new Error("Invalid test authenticator secret");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = Buffer.from(Array.from({ length: Math.floor(bits.length / 8) }, (_, i) => parseInt(bits.slice(i * 8, i * 8 + 8), 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(now / 30000)));
  const digest = createHmac("sha1", bytes).update(counter).digest();
  const offset = digest.at(-1)! & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
}
export async function freshTestTotp(secret: string) {
  const remaining = 30000 - Date.now() % 30000;
  if (remaining < 3000) await new Promise((resolve) => setTimeout(resolve, remaining + 50));
  return testTotp(secret);
}
