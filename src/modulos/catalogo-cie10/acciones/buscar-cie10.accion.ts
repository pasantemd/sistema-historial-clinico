"use server";

import { z } from "zod";

import { buscarCie10 } from "@/modulos/catalogo-cie10/servicios/buscar-cie10.servicio";
import type { ResultadoCie10 } from "@/modulos/catalogo-cie10/tipos";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

type ResultadoBusqueda =
  | { exito: true; datos: ResultadoCie10[] }
  | { exito: false; mensaje: string };

export async function buscarCie10Accion(entrada: unknown): Promise<ResultadoBusqueda> {
  try {
    await requerirPermiso(PERMISOS_FICHA.ver);
    return { exito: true, datos: await buscarCie10(entrada) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { exito: false, mensaje: error.issues[0]?.message ?? "Búsqueda inválida." };
    }
    console.error("Error al buscar en CIE-10", error);
    return { exito: false, mensaje: "No fue posible consultar el catálogo CIE-10." };
  }
}
