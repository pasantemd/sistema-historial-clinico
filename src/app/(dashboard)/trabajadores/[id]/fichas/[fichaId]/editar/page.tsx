import { notFound, redirect } from "next/navigation";

import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";
import {
  consultarCatalogoFicha,
  consultarFichaDetalle,
  consultarTrabajadorParaFicha,
  obtenerFichaParaEditar,
} from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { FormularioFicha } from "@/modulos/fichas-ocupacionales/componentes/formulario-ficha";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";

interface Props {
  params: Promise<{ id: string; fichaId: string }>;
  searchParams: Promise<{ guardado?: string }>;
}

export default async function PaginaEditarFicha({
  params,
  searchParams,
}: Props) {
  const usuario = await requerirPermiso(PERMISOS_FICHA.editar);
  const { id: trabajadorId, fichaId } = await params;
  const ficha = await consultarFichaDetalle(usuario.id, trabajadorId, fichaId);
  if (!ficha) notFound();
  if (ficha.estado !== "BORRADOR")
    redirect(`/trabajadores/${trabajadorId}/fichas/${fichaId}`);
  const [valores, catalogo, trabajador] = await Promise.all([
    obtenerFichaParaEditar(usuario.id, trabajadorId, fichaId),
    consultarCatalogoFicha(usuario.id),
    consultarTrabajadorParaFicha(usuario.id, trabajadorId),
  ]);
  if (!trabajador) notFound();
  return (
    <FormularioFicha
      trabajador={trabajador}
      catalogo={catalogo}
      valoresIniciales={valores}
      fichaId={fichaId}
      estado={ficha.estado}
      permitirEdicion={tienePermiso(usuario, PERMISOS_FICHA.editar)}
      mensajeInicial={
        (await searchParams).guardado === "1"
          ? "Borrador guardado correctamente."
          : undefined
      }
    />
  );
}
