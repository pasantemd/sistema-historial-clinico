"use server";

import { z } from "zod";
import { actualizarPermisosRol } from "@/modulos/roles/servicios/roles-permisos.servicio";

const esquema = z.object({
  rolId: z.string().uuid(),
  permisoIds: z.array(z.string().uuid()),
});

export type EstadoAccion = { exito?: boolean; error?: string } | null;

export async function actualizarPermisosRolAccion(
  _estadoAnterior: EstadoAccion,
  datos: FormData
): Promise<{ exito?: boolean; error?: string } | null> {
  try {
    const rolId = datos.get("rolId") as string;
    const permisoIdsRaw = datos.get("permisoIds") as string;
    const permisoIds: string[] = permisoIdsRaw ? JSON.parse(permisoIdsRaw) : [];

    const parsed = esquema.safeParse({ rolId, permisoIds });
    if (!parsed.success) {
      return { error: "Datos inválidos." };
    }

    await actualizarPermisosRol(parsed.data.rolId, parsed.data.permisoIds);

    return { exito: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Error inesperado al actualizar permisos." };
  }
}