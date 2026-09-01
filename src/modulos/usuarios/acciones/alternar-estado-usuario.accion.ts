"use server";

import { z } from "zod";
import { alternarEstadoUsuario } from "@/modulos/usuarios/servicios/alternar-estado-usuario.servicio";
import { ErrorUsuarioNoEncontrado, ErrorSinAdministradorActivo, ErrorAutoCambioRol, ErrorPermisoDenegadoRol } from "@/modulos/usuarios/errores";

const schema = z.object({ usuarioId: z.string().uuid() });

export async function alternarEstadoUsuarioAccion(entrada: unknown): Promise<{ exito: true; nuevoEstado: string } | { exito: false; mensaje: string }> {
  try {
    const { usuarioId } = schema.parse(entrada);
    return await alternarEstadoUsuario(usuarioId);
  } catch (error) {
    if (error instanceof z.ZodError) return { exito: false, mensaje: "Datos inválidos." };
    if (error instanceof ErrorUsuarioNoEncontrado || error instanceof ErrorSinAdministradorActivo || error instanceof ErrorAutoCambioRol || error instanceof ErrorPermisoDenegadoRol) {
      return { exito: false, mensaje: error.message };
    }
    console.error("Error al alternar estado:", error);
    return { exito: false, mensaje: "No fue posible cambiar el estado." };
  }
}