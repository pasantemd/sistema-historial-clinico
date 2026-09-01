"use server";

import { obtenerSesion } from "@/servicios/autenticacion/obtener-sesion";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";

export async function registrarSolicitudCierreSesion(): Promise<void> {
  const sesion = await obtenerSesion();

  await registrarAuditoriaSegura({
    usuarioId: sesion?.user.id ?? null,
    accion: "CIERRE_SESION",
    modulo: "AUTENTICACION",
    entidad: "SOLICITUD_CIERRE_SESION",
    entidadId: sesion?.user.id ?? null,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
  });
}
