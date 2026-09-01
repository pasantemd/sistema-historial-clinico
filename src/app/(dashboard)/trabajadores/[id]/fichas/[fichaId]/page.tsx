import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Stamp } from "lucide-react";

import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";

import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";
import {
  consultarCatalogoFicha,
  consultarFichaDetalle,
  consultarTrabajadorParaFicha,
  obtenerFichaParaEditar,
} from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { FormularioFicha } from "@/modulos/fichas-ocupacionales/componentes/formulario-ficha";
import { BotonAnularFicha } from "@/modulos/fichas-ocupacionales/componentes/boton-anular-ficha";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";

interface Props {
  params: Promise<{ id: string; fichaId: string }>;
}

export default async function PaginaDetalleFicha({ params }: Props) {
  const usuario = await requerirPermiso(PERMISOS_FICHA.ver);
  const { id: trabajadorId, fichaId } = await params;
  const ficha = await consultarFichaDetalle(usuario.id, trabajadorId, fichaId);
  if (!ficha) notFound();
  const [valores, catalogo, trabajador] = await Promise.all([
    obtenerFichaParaEditar(usuario.id, trabajadorId, fichaId),
    consultarCatalogoFicha(usuario.id),
    consultarTrabajadorParaFicha(usuario.id, trabajadorId),
  ]);
  if (!trabajador) notFound();
  const nombre = `${ficha.trabajador.apellidos} ${ficha.trabajador.nombres}`;

  const acciones = (
    <div className="flex flex-wrap gap-2">
      {ficha.estado === "BORRADOR" &&
        tienePermiso(usuario, PERMISOS_FICHA.editar) && (
          <Link
            href={`/trabajadores/${trabajadorId}/fichas/${fichaId}/editar`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil aria-hidden /> Editar
          </Link>
        )}
      {ficha.estado === "FINALIZADA" &&
        tienePermiso(usuario, PERMISOS_FICHA.certificado) && (
          <Link
            href={`/trabajadores/${trabajadorId}/fichas/${fichaId}/certificado`}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            <Stamp aria-hidden /> Certificado
          </Link>
        )}
      {ficha.estado !== "FINALIZADA" &&
        ficha.estado !== "ANULADA" &&
        tienePermiso(usuario, PERMISOS_FICHA.anular) && (
          <BotonAnularFicha trabajadorId={trabajadorId} fichaId={fichaId} />
        )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo={`Ficha ocupacional — ${nombre}`}
        descripcion={`${ficha.empresa} · ${ficha.departamento}`}
        acciones={acciones}
      />
      <FormularioFicha
        trabajador={trabajador}
        catalogo={catalogo}
        valoresIniciales={valores}
        fichaId={fichaId}
        estado={ficha.estado}
        permitirEdicion={false}
      />
    </div>
  );
}
