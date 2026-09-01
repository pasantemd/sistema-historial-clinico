import { createHash } from "node:crypto";

import { DemasiadosIntentosError } from "@/modulos/autenticacion/errores/demasiados-intentos.error";
import { prisma } from "@/servicios/base-datos/prisma";

const MAXIMO_INTENTOS = 5;
const VENTANA_MINUTOS = 15;

export function crearClaveLimiteInicioSesion(correo: string, direccionIp?: string | null) {
  const identidad = `${correo.trim().toLowerCase()}|${direccionIp?.trim() || "sin-ip"}`;
  return createHash("sha256").update(identidad).digest("hex");
}

function inicioVentana() {
  return new Date(Date.now() - VENTANA_MINUTOS * 60_000);
}

export async function verificarLimiteInicioSesion(claveHash: string) {
  const intentos = await prisma.intentoInicioSesion.count({
    where: { claveHash, creadoEn: { gte: inicioVentana() } },
  });
  if (intentos >= MAXIMO_INTENTOS) throw new DemasiadosIntentosError();
}

export async function registrarIntentoFallido(claveHash: string) {
  await prisma.intentoInicioSesion.create({ data: { claveHash } });
}

export async function limpiarIntentosInicioSesion(claveHash: string) {
  await prisma.intentoInicioSesion.deleteMany({ where: { claveHash } });
}
