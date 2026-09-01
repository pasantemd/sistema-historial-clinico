import {
  buscarUsuarioParaAutenticacion,
  registrarUltimoAcceso,
} from "@/modulos/autenticacion/repositorios/repositorio-autenticacion";
import { CredencialesInvalidasError } from "@/modulos/autenticacion/errores/credenciales-invalidas.error";
import { UsuarioInactivoError } from "@/modulos/autenticacion/errores/usuario-inactivo.error";
import type { UsuarioSesion } from "@/modulos/autenticacion/tipos/sesion.tipos";
import type { DatosInicioSesion } from "@/modulos/autenticacion/validaciones/iniciar-sesion.schema";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import {
  realizarDerivacionScryptSimulada,
  verificarClaveScrypt,
} from "@/servicios/seguridad/verificar-clave-scrypt";

interface ContextoAutenticacion {
  agenteUsuario?: string | null;
}

export async function autenticarUsuario(
  datos: DatosInicioSesion,
  contexto: ContextoAutenticacion = {},
): Promise<UsuarioSesion> {
  const usuario = await buscarUsuarioParaAutenticacion(datos.correo);

  if (!usuario) {
    realizarDerivacionScryptSimulada(datos.contrasena);
    await registrarAuditoriaSegura({
      accion: "INICIO_SESION_FALLIDO",
      modulo: "AUTENTICACION",
      entidad: "SESION",
      agenteUsuario: contexto.agenteUsuario,
      resultado: "FALLIDO",
    });
    throw new CredencialesInvalidasError();
  }

  const claveValida = verificarClaveScrypt(datos.contrasena, usuario.claveHash);
  if (!claveValida || usuario.estado !== "ACTIVO") {
    await registrarAuditoriaSegura({
      usuarioId: usuario.id,
      accion: "INICIO_SESION_FALLIDO",
      modulo: "AUTENTICACION",
      entidad: "SESION",
      entidadId: usuario.id,
      agenteUsuario: contexto.agenteUsuario,
      resultado: "FALLIDO",
    });
    if (usuario.estado !== "ACTIVO") throw new UsuarioInactivoError();
    throw new CredencialesInvalidasError();
  }

  try {
    await registrarUltimoAcceso(usuario.id);
  } catch {
    console.error("No fue posible actualizar la fecha de último acceso.");
  }

  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "INICIO_SESION_EXITOSO",
    modulo: "AUTENTICACION",
    entidad: "SESION",
    entidadId: usuario.id,
    agenteUsuario: contexto.agenteUsuario,
    resultado: "EXITOSO",
  });

  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    correo: usuario.correo,
    roles: usuario.roles,
    permisos: usuario.permisos,
  };
}
