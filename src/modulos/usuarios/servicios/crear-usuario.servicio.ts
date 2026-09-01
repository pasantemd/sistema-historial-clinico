import { crearUsuarioRepositorio } from "@/modulos/usuarios/repositorios/crear-usuario.repositorio";
import type { EntradaCrearUsuario } from "@/modulos/usuarios/validaciones/crear-usuario.schema";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export async function crearUsuarioServicio(datos: EntradaCrearUsuario) {
  const actor = await requerirPermiso("usuario.administrar");
  const usuario = await crearUsuarioRepositorio(datos, actor.id);
  await registrarAuditoriaSegura({
    usuarioId: actor.id,
    accion: "USUARIO_CREADO",
    modulo: "USUARIOS",
    entidad: "Usuario",
    entidadId: usuario.id,
    resultado: "EXITOSO",
    datosNuevos: { rolId: datos.rolId, empresaIds: datos.empresaIds.join(",") },
  });
  return usuario;
}
