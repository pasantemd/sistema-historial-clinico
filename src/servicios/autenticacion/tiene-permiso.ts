import type { UsuarioSesion } from "@/modulos/autenticacion/tipos/sesion.tipos";

export function tienePermiso(usuario: UsuarioSesion, permiso: string): boolean {
  return usuario.permisos.includes(permiso);
}
