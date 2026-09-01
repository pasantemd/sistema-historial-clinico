import { redirect } from "next/navigation";

import { obtenerUsuarioActual } from "@/servicios/autenticacion/obtener-sesion";
import { buscarIdentidadUsuarioPorId } from "@/modulos/autenticacion/repositorios/repositorio-autenticacion";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";

export async function requerirUsuario() {
  const usuario = await obtenerUsuarioActual();
  const identidadVigente = usuario ? await buscarIdentidadUsuarioPorId(usuario.id) : null;

  if (!identidadVigente || identidadVigente.estado !== "ACTIVO") {
    await registrarAuditoriaSegura({
      accion: "ACCESO_DENEGADO",
      usuarioId: usuario?.id,
      modulo: "AUTENTICACION",
      entidad: "PANEL",
      agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
      resultado: "FALLIDO",
    });
    redirect("/iniciar-sesion");
  }

  return {
    id: identidadVigente.id,
    nombres: identidadVigente.nombres,
    apellidos: identidadVigente.apellidos,
    correo: identidadVigente.correo,
    roles: identidadVigente.roles,
    permisos: identidadVigente.permisos,
  };
}
