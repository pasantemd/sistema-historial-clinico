"use server";

import { buscarMorbilidadesEnCatalogo } from "@/modulos/morbilidades/consultas/morbilidades.consulta";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";

export type ResultadoBusquedaMorbilidades =
  | { exito: true; datos: string[] }
  | { exito: false; mensaje: string };

/**
 * Server Action para consultar sugerencias de morbilidades desde el catálogo común.
 */
export async function buscarMorbilidadesAccion(
  termino: string,
): Promise<ResultadoBusquedaMorbilidades> {
  try {
    await requerirUsuario();
    if (!termino || termino.trim().length < 2) {
      return { exito: true, datos: [] };
    }
    const datos = await buscarMorbilidadesEnCatalogo(termino, { limite: 20 });
    return { exito: true, datos };
  } catch (error) {
    console.error("Error al buscar morbilidades:", error);
    return { exito: false, mensaje: "No fue posible consultar el catálogo de morbilidades." };
  }
}
