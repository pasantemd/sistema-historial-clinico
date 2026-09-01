"use client";

import { signOut } from "next-auth/react";

import { registrarSolicitudCierreSesion } from "@/modulos/autenticacion/acciones/cerrar-sesion.accion";

const RUTA_INICIO_SESION = "/iniciar-sesion";

export async function cerrarSesionCliente(): Promise<void> {
  try {
    await registrarSolicitudCierreSesion();
  } catch {
    // La auditoría es best-effort y nunca debe impedir invalidar la sesión.
  }

  const resultado = await signOut({
    callbackUrl: RUTA_INICIO_SESION,
    redirect: false,
  });

  window.location.replace(resultado?.url ?? RUTA_INICIO_SESION);
}
