import Link from "next/link";
import { FileText, Pencil, Plus, Stamp } from "lucide-react";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { Badge } from "@/componentes/ui/badge";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { Card, CardContent } from "@/componentes/ui/card";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

import { APTITUDES_MEDICAS, ESTADOS_FICHA, TIPOS_EVALUACION } from "@/modulos/fichas-ocupacionales/constantes";
import type { FichaResumen } from "@/modulos/fichas-ocupacionales/tipos";

const etiquetaTipo = (valor: string) => TIPOS_EVALUACION.find((item) => item.valor === valor)?.etiqueta ?? valor;
const etiquetaEstado = (valor: string) => ESTADOS_FICHA.find((item) => item.valor === valor)?.etiqueta ?? valor;
const etiquetaAptitud = (valor: string | null) => (valor ? APTITUDES_MEDICAS.find((item) => item.valor === valor)?.etiqueta ?? valor : "—");

const colorEstado: Record<string, string> = {
  BORRADOR: "secondary",
  FINALIZADA: "default",
  ANULADA: "destructive",
};

export function PaginaListaFichas({
  trabajadorId,
  trabajadorNombre,
  fichas,
  puedeCrear,
  puedeEditar,
  puedeCertificado,
}: {
  trabajadorId: string;
  trabajadorNombre: string;
  fichas: FichaResumen[];
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeCertificado: boolean;
}) {
  return (
    <div className="space-y-8">
      <BotonRegresar rutaRespaldo={`/trabajadores/${trabajadorId}`} />
      <Migas />
      <EncabezadoPagina
        titulo={`Fichas ocupacionales — ${trabajadorNombre}`}
        descripcion="Historia clínica ocupacional del trabajador."
        acciones={puedeCrear ? <Link href={`/trabajadores/${trabajadorId}/fichas/nueva`} className={cn(buttonVariants())}><Plus aria-hidden /> Nueva ficha</Link> : undefined}
      />
      <Card className="shadow-xs">
        <CardContent className="pt-6">
          {fichas.length === 0 ? (
            <p className="text-sm text-muted-foreground">El trabajador no tiene fichas ocupacionales registradas.</p>
          ) : (
            <div className="max-w-full overflow-hidden rounded-xl border">
              <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Tipo</th>
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2">Estado</th>
                    <th className="px-2 py-2">Aptitud</th>
                    <th className="px-2 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fichas.map((ficha) => (
                    <tr key={ficha.id} className="border-b transition-colors hover:bg-primary/[0.035]">
                      <td className="px-2 py-2">{etiquetaTipo(ficha.tipoEvaluacion)}</td>
                      <td className="px-2 py-2">{ficha.fechaAtencion ? formatearFecha(ficha.fechaAtencion) : "—"}</td>
                      <td className="px-2 py-2"><Badge variant={(colorEstado[ficha.estado] as never) ?? "secondary"}>{etiquetaEstado(ficha.estado)}</Badge></td>
                      <td className="px-2 py-2">{etiquetaAptitud(ficha.aptitudMedica)}</td>
                      <td className="px-2 py-2">
                        <div className="flex justify-end gap-2">
                          <Link href={`/trabajadores/${trabajadorId}/fichas/${ficha.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><FileText aria-hidden /> Ver</Link>
                          {ficha.estado === "BORRADOR" && puedeEditar && (
                            <Link href={`/trabajadores/${trabajadorId}/fichas/${ficha.id}/editar`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><Pencil aria-hidden /> Editar</Link>
                          )}
                          {ficha.estado === "FINALIZADA" && puedeCertificado && (
                            <Link href={`/trabajadores/${trabajadorId}/fichas/${ficha.id}/certificado`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}><Stamp aria-hidden /> Certificado</Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
