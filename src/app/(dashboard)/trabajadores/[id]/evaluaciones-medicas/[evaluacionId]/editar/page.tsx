import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioEvaluacion } from "@/modulos/evaluaciones-medicas/componentes/formulario-evaluacion";
import {
  consultarContextoEvaluacion,
  consultarEvaluacion,
  obtenerEvaluacionParaFormulario,
} from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; evaluacionId: string }>;
}) {
  const usuario = await requerirPermiso("evaluacion-medica.editar");
  const { id, evaluacionId } = await params;
  const [evaluacion, contexto, valores] = await Promise.all([
    consultarEvaluacion(usuario.id, evaluacionId, id),
    consultarContextoEvaluacion(usuario.id, id),
    obtenerEvaluacionParaFormulario(usuario.id, evaluacionId, id),
  ]);
  if (!evaluacion || !valores) notFound();
  if (evaluacion.estado !== "BORRADOR")
    redirect(`/trabajadores/${id}/evaluaciones-medicas/${evaluacionId}`);
  if (!contexto) notFound();
  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Editar evaluación médica"
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
