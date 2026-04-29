import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;
const N = 16384;
const r = 8;
const p = 1;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, nStr, rStr, pStr, salt, derivedHex] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !derivedHex) return false;
    const derived = scryptSync(password, salt, KEY_LEN, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
    });
    const stored2 = Buffer.from(derivedHex, "hex");
    if (stored2.length !== derived.length) return false;
    return timingSafeEqual(stored2, derived);
  } catch {
    return false;
  }
}
