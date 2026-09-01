import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioEvaluacion } from "@/modulos/evaluaciones-medicas/componentes/formulario-evaluacion";
import {
  construirContextoEvaluacionDesdeRegistro,
  consultarContextoEvaluacion,
  consultarEvaluacion,
  obtenerEvaluacionParaFormulario,
} from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export default async function Page({
  params,
}: {
  params: Promise<{ evaluacionId: string }>;
}) {
  const usuario = await requerirPermiso("evaluacion-medica.editar");
  const { evaluacionId } = await params;
  const evaluacion = await consultarEvaluacion(usuario.id, evaluacionId);
  if (!evaluacion) notFound();
  if (evaluacion.estado !== "BORRADOR")
    redirect(`/evaluaciones-medicas/${evaluacionId}`);
  const [origenRegistro, valores] = await Promise.all([
    evaluacion.registroDiarioId
      ? construirContextoEvaluacionDesdeRegistro(usuario.id, evaluacion.registroDiarioId)
      : null,
    obtenerEvaluacionParaFormulario(usuario.id, evaluacionId, evaluacion.trabajadorId),
  ]);
  const contexto = origenRegistro?.contexto ??
    await consultarContextoEvaluacion(usuario.id, evaluacion.trabajadorId);
  if (!contexto || !valores) notFound();
  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo={`Editar ${evaluacion.numeroEvaluacion ?? "evaluación"}`}
        descripcion={contexto.trabajador.nombre}
      />
      <FormularioEvaluacion
        contexto={contexto}
        valores={valores}
        evaluacionId={evaluacionId}
      />
    </div>
  );
}
