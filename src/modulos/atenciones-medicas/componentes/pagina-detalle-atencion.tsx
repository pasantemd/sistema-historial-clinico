import Link from "next/link";
import { notFound } from "next/navigation";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { Badge } from "@/componentes/ui/badge";
import { buttonVariants } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { consultarAtencion } from "@/modulos/atenciones-medicas/consultas/atenciones.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

interface Props {
  params: Promise<{ id: string; atencionId: string }>;
}

export async function PaginaDetalleAtencion({ params }: Props) {
  const usuario = await requerirPermiso("trabajador.ver");
  const { id: trabajadorId, atencionId } = await params;
  const atencion = await consultarAtencion(atencionId, trabajadorId, usuario.id);
  if (!atencion) notFound();

  const documentos = [
    ...atencion.fichas.map((ficha) => ({
      id: ficha.id,
      etiqueta: `Ficha ocupacional (${ficha.tipoEvaluacion})`,
      estado: ficha.estado,
      ruta: `/trabajadores/${trabajadorId}/fichas/${ficha.id}`,
    })),
    ...atencion.evaluaciones.map((evaluacion) => ({
      id: evaluacion.id,
      etiqueta: "Evaluación médica",
      estado: evaluacion.estado,
      ruta: `/trabajadores/${trabajadorId}/evaluaciones-medicas/${evaluacion.id}`,
    })),
    ...atencion.recetas.map((receta) => ({
      id: receta.id,
      etiqueta: `Receta ${receta.numeroReceta}`,
      estado: receta.estado,
      ruta: `/recetas/${receta.id}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        <Migas />
        <BotonRegresar rutaRespaldo="/atenciones" />
        <EncabezadoPagina
          titulo={`Atención del ${formatearFecha(atencion.fechaAtencion)}`}
          descripcion={`${atencion.trabajadorNombreHistorico} · ${atencion.empresaNombreHistorico}`}
        />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Resumen de atención médica</CardTitle>
            <Badge>{atencion.estado}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta="Trabajador" valor={atencion.trabajadorNombreHistorico} />
            <Dato etiqueta="Documento" valor={atencion.trabajadorDocumentoHistorico} />
            <Dato etiqueta="Empresa" valor={atencion.empresaNombreHistorico} />
            <Dato etiqueta="Departamento" valor={atencion.departamentoNombreHistorico ?? "—"} />
            <Dato etiqueta="Fecha" valor={formatearFecha(atencion.fechaAtencion)} />
            <Dato etiqueta="Profesional" valor={atencion.profesionalNombreHistorico ?? "Sin asignar"} />
          </dl>
          {atencion.motivoGeneral && (
            <div>
              <h2 className="text-sm font-medium">Motivo general</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{atencion.motivoGeneral}</p>
            </div>
          )}
          <section>
            <h2 className="font-medium">Documentos de esta atención</h2>
            {documentos.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Todavía no hay documentos asociados.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {documentos.map((documento) => (
                  <li key={documento.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <Link href={documento.ruta} className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>{documento.etiqueta}</Link>
                    <Badge variant="secondary">{documento.estado}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</dt><dd className="mt-1 text-sm font-medium">{valor}</dd></div>;
}
