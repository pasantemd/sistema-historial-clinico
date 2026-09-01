import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { DetalleEvaluacion } from "@/modulos/evaluaciones-medicas/componentes/detalle-evaluacion";
import {
  consultarContextoEvaluacion,
  consultarEvaluacion,
} from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { consultarRecetaPorEvaluacion } from "@/modulos/recetas/repositorios/recetas.repositorio";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; evaluacionId: string }>;
}) {
  const u = await requerirPermiso("evaluacion-medica.ver");
  const { id, evaluacionId } = await params;
  const [evaluacion, contexto] = await Promise.all([
    consultarEvaluacion(u.id, evaluacionId, id),
    consultarContextoEvaluacion(u.id, id),
  ]);
  if (!evaluacion) notFound();

  const recetaExistenteId =
    evaluacion.estado === "FINALIZADA"
      ? await consultarRecetaPorEvaluacion(u.id, evaluacionId)
      : null;

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Evaluación médica"
        descripcion={`${evaluacion.trabajadorNombreHistorico} · ${evaluacion.fechaAtencion?.toISOString().slice(0, 10) ?? "Sin fecha"}`}
      />
      <DetalleEvaluacion
        evaluacion={evaluacion}
        alergias={contexto?.alergias ?? []}
        puedeEditar={tienePermiso(u, "evaluacion-medica.editar")}
        puedeAnular={tienePermiso(u, "evaluacion-medica.anular")}
        puedeCrearReceta={tienePermiso(u, "receta.crear")}
        recetaExistenteId={recetaExistenteId}
      />
    </div>
  );
}
