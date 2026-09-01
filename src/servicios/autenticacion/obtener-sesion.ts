import { getServerSession } from "next-auth";

import { buscarIdentidadUsuarioPorId } from "@/modulos/autenticacion/repositorios/repositorio-autenticacion";
import type { UsuarioSesion } from "@/modulos/autenticacion/tipos/sesion.tipos";
import { authOptions } from "@/servicios/autenticacion/auth";

export async function obtenerSesion() {
  return getServerSession(authOptions);
}

export async function obtenerUsuarioActual(): Promise<UsuarioSesion | null> {
  const sesion = await obtenerSesion();
  if (!sesion?.user.id) return null;

  const identidad = await buscarIdentidadUsuarioPorId(sesion.user.id);
  if (!identidad || identidad.estado !== "ACTIVO") return null;

  return {
    id: identidad.id,
    nombres: identidad.nombres,
    apellidos: identidad.apellidos,
    correo: identidad.correo,
    roles: identidad.roles,
    permisos: identidad.permisos,
  };
}
