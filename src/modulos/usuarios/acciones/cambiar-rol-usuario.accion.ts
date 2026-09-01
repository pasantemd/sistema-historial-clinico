"use server";

import { z } from "zod";
import { cambiarRolUsuario } from "@/modulos/usuarios/servicios/cambiar-rol-usuario.servicio";
import {
  ErrorUsuarioNoEncontrado,
  ErrorRolNoEncontrado,
  ErrorSinAdministradorActivo,
  ErrorAutoCambioRol,
  ErrorPermisoDenegadoRol,
} from "@/modulos/usuarios/errores";
import type { CambioRolResultado } from "@/modulos/usuarios/tipos";

const schema = z.object({
  usuarioId: z.string().uuid(),
  nuevoRolId: z.string().uuid(),
});

type Resultado =
  | CambioRolResultado
  | { exito: false; mensaje: string };

export async function cambiarRolUsuarioAccion(entrada: unknown): Promise<Resultado> {
  try {
    const { usuarioId, nuevoRolId } = schema.parse(entrada);
    return await cambiarRolUsuario(usuarioId, nuevoRolId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { exito: false, mensaje: "Datos inválidos." };
    }
    if (
      error instanceof ErrorUsuarioNoEncontrado ||
      error instanceof ErrorRolNoEncontrado ||
      error instanceof ErrorSinAdministradorActivo ||
      error instanceof ErrorAutoCambioRol ||
      error instanceof ErrorPermisoDenegadoRol
    ) {
      return { exito: false, mensaje: error.message };
    }
    console.error("Error al cambiar rol:", error);
    return { exito: false, mensaje: "No fue posible cambiar el rol." };
  }
}