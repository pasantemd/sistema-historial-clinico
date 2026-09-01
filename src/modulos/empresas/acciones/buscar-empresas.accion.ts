"use server";

import { prisma } from "@/servicios/base-datos/prisma";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export async function buscarEmpresasAccion(termino: string) {
  const usuario = await requerirPermiso("empresa.ver");
  const q = termino.trim();
  if (q.length < 2) return [];
  const datos = await prisma.empresa.findMany({
    where: {
      estado: "ACTIVO",
      usuariosAutorizados: { some: { usuarioId: usuario.id } },
      OR: [
        { razonSocial: { contains: q, mode: "insensitive" } },
        { nombreComercial: { contains: q, mode: "insensitive" } },
        { ruc: { contains: q } },
      ],
    },
    select: { id: true, razonSocial: true, ruc: true },
    orderBy: [{ razonSocial: "asc" }],
    take: 15,
  });
  return datos.map((e) => ({ id: e.id, label: e.razonSocial, descripcion: e.ruc }));
}
