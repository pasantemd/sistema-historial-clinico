"use server";

import { z } from "zod";
import { crearUsuarioServicio } from "@/modulos/usuarios/servicios/crear-usuario.servicio";
import { crearUsuarioSchema } from "@/modulos/usuarios/validaciones/crear-usuario.schema";

export async function crearUsuarioAccion(entrada: unknown) {
  try {
    const datos = crearUsuarioSchema.parse(entrada);
    const usuario = await crearUsuarioServicio(datos);
    return { exito: true as const, datos: usuario };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        exito: false as const,
        mensaje: "Revise los datos del usuario.",
        erroresCampos: z.flattenError(error).fieldErrors,
      };
    }
    return {
      exito: false as const,
      mensaje: error instanceof Error ? error.message : "No fue posible crear el usuario.",
    };
  }
}
