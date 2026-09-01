import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/componentes/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { AlertaAlergias } from "@/modulos/evaluaciones-medicas/componentes/alerta-alergias";
import { BotonAnularEvaluacion } from "@/modulos/evaluaciones-medicas/componentes/boton-anular-evaluacion";
import type { AlergiaDto } from "@/modulos/evaluaciones-medicas/tipos";
import { obtenerEtiquetaMorbilidad } from "@/modulos/evaluaciones-medicas/constantes/morbilidades";
import { cn } from "@/utilidades/clases";
import { EnlacePdf } from "@/componentes/documentos/enlace-pdf";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";

type Evaluacion = NonNullable<Awaited<ReturnType<typeof import("@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta").consultarEvaluacion>>>;

interface Props {
  evaluacion: Evaluacion;
  alergias: AlergiaDto[];
  puedeEditar: boolean;
  puedeAnular: boolean;
  puedeCrearReceta: boolean;
  recetaExistenteId: string | null;
}

export function DetalleEvaluacion({ evaluacion, alergias, puedeEditar, puedeAnular, puedeCrearReceta, recetaExistenteId }: Props) {
  const esBorrador = evaluacion.estado === "BORRADOR";
  const esFinalizada = evaluacion.estado === "FINALIZADA";

  return (
    <div className="space-y-5">
      <AlertaAlergias alergias={alergias} />
      <div className="flex flex-wrap items-center gap-2">
        <BotonRegresar rutaRespaldo="/evaluaciones-medicas" />
        <Badge>{evaluacion.estado}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {esBorrador && puedeEditar && (
          <Link className={cn(buttonVariants({ variant: "outline" }))} href={`/evaluaciones-medicas/${evaluacion.id}/editar`}>Editar</Link>
        )}
        <EnlacePdf className={cn(buttonVariants({ variant: "outline" }))} ruta={`/api/evaluaciones-medicas/${evaluacion.id}/pdf`}>Ver / Imprimir PDF</EnlacePdf>
        {esBorrador && puedeAnular && <BotonAnularEvaluacion id={evaluacion.id} />}
        {esFinalizada && puedeCrearReceta && !recetaExistenteId && (
          <Link className={cn(buttonVariants())} href={`/recetas/nueva?trabajadorId=${evaluacion.trabajadorId}&evaluacionId=${evaluacion.id}`}>
            <Plus aria-hidden /> Crear receta
          </Link>
        )}
        {esFinalizada && recetaExistenteId && (
          <Link className={cn(buttonVariants({ variant: "outline" }))} href={`/recetas/${recetaExistenteId}`}>
            Ver receta
          </Link>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Datos históricos</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <p><b>Trabajador:</b> {evaluacion.trabajadorNombreHistorico}</p>
          <p><b>Documento:</b> {evaluacion.trabajadorDocumentoHistorico}</p>
          <p><b>Empresa:</b> {evaluacion.empresaNombreHistorico}</p>
          <p><b>RUC:</b> {evaluacion.empresaRucHistorico}</p>
          <p><b>Departamento:</b> {evaluacion.departamentoNombreHistorico}</p>
          <p><b>Profesional:</b> {evaluacion.profesionalNombreHistorico ?? "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Consulta y evaluación</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><b>Morbilidad:</b> {obtenerEtiquetaMorbilidad(evaluacion.morbilidad)}</p>
          <p><b>Motivo:</b> {evaluacion.motivoConsulta ?? "—"}</p>
          <p><b>Síntomas:</b> {evaluacion.sintomas ?? "—"}</p>
          <p><b>Antecedentes:</b> {evaluacion.antecedentesRelevantes ?? "—"}</p>
          <p><b>Examen físico:</b> {evaluacion.examenFisico ?? "—"}</p>
          <p><b>Observaciones:</b> {evaluacion.observacionesClinicas ?? "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Diagnósticos CIE-10</CardTitle></CardHeader>
        <CardContent>
          {evaluacion.diagnosticos.length ? (
            <ul className="list-disc pl-5">
              {evaluacion.diagnosticos.map((d) => (
                <li key={d.id}>{d.enfermedad.codigo} — {d.enfermedad.descripcion} ({d.pre ? "PRE" : "DEF"})</li>
              ))}
            </ul>
          ) : (
            <p>Sin diagnósticos.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tratamiento y medicamentos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><b>Indicaciones:</b> {evaluacion.indicaciones ?? "—"}</p>
          {evaluacion.medicamentos.map((m) => (
            <div key={m.id} className="rounded border p-3">
              <b>{m.medicamento.nombreGenerico} {m.medicamento.presentacion}</b>
              <p>Cantidad: {m.cantidad?.toString() ?? "—"}</p>
              {m.indicaciones && <p>Indicaciones: {m.indicaciones}</p>}
              {m.alertaAlergiaConfirmada && <p className="text-destructive">Alerta confirmada: {m.justificacionAlergia}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
