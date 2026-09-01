import { randomBytes, scryptSync } from "node:crypto";

export function crearClaveScrypt(clave: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(clave, sal, 64);
  return `scrypt:${sal.toString("hex")}:${hash.toString("hex")}`;
}
