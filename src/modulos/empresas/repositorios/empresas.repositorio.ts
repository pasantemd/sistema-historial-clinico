import { prisma } from "@/servicios/base-datos/prisma";

export async function validarEmpresaActivaParaUsuario(
  usuarioId: string,
  empresaId: string,
) {
  const acceso = await prisma.usuarioEmpresa.findFirst({
    where: {
      usuarioId,
      empresaId,
      usuario: { estado: "ACTIVO" },
      empresa: { estado: "ACTIVO" },
    },
    select: { usuarioId: true },
  });
  return Boolean(acceso);
}

export async function listarEmpresaIdsAutorizadas(usuarioId: string) {
  const accesos = await prisma.usuarioEmpresa.findMany({
    where: {
      usuarioId,
      usuario: { estado: "ACTIVO" },
      empresa: { estado: "ACTIVO" },
    },
    select: { empresaId: true },
  });
  return accesos.map((acceso) => acceso.empresaId);
}
