import { scryptSync, timingSafeEqual } from "node:crypto";

const LONGITUD_SAL = 16;
const LONGITUD_HASH = 64;

function esHexadecimal(valor: string, bytes: number): boolean {
  return valor.length === bytes * 2 && /^[0-9a-f]+$/i.test(valor);
}

export function verificarClaveScrypt(clave: string, claveHash: string): boolean {
  const [algoritmo, salHex, hashHex, segmentoExtra] = claveHash.split(":");

  if (
    algoritmo !== "scrypt" ||
    segmentoExtra !== undefined ||
    !esHexadecimal(salHex ?? "", LONGITUD_SAL) ||
    !esHexadecimal(hashHex ?? "", LONGITUD_HASH)
  ) {
    realizarDerivacionScryptSimulada(clave);
    return false;
  }

  const hashEsperado = Buffer.from(hashHex, "hex");
  const hashCalculado = scryptSync(clave, Buffer.from(salHex, "hex"), LONGITUD_HASH);

  return timingSafeEqual(hashCalculado, hashEsperado);
}

export function realizarDerivacionScryptSimulada(clave: string): void {
  const salSimulada = Buffer.alloc(LONGITUD_SAL);
  const hashCalculado = scryptSync(clave, salSimulada, LONGITUD_HASH);
  const hashImposible = Buffer.alloc(LONGITUD_HASH, 0xff);
  timingSafeEqual(hashCalculado, hashImposible);
}
