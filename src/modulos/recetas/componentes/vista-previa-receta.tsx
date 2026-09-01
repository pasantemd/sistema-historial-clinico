import { notFound } from "next/navigation";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { consultarRecetaRepositorio } from "@/modulos/recetas/repositorios/recetas.repositorio";
import { DetalleReceta } from "@/modulos/recetas/componentes/detalle-receta";
import { VistaPreviaDocumento } from "@/componentes/documentos/vista-previa-documento";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import type {
  RecetaDetalleDto,
  RecetaMedicamentoDto,
} from "@/modulos/recetas/tipos";

interface Props {
  recetaId: string;
}

export async function VistaPreviaReceta({ recetaId }: Props) {
  const usuario = await requerirPermiso("receta.exportar");
  const receta = await consultarRecetaRepositorio(usuario.id, recetaId);
  if (!receta) notFound();

  const detalle: RecetaDetalleDto = {
    id: receta.id,
    numeroReceta: receta.numeroReceta,
    fechaEmision: receta.fechaEmision,
    estado: receta.estado,
    indicacionesGenerales: receta.indicacionesGenerales,
    recomendaciones: receta.recomendaciones,
    observaciones: receta.observaciones,
    trabajadorNombreHistorico: receta.trabajadorNombreHistorico,
    trabajadorDocumentoHistorico: receta.trabajadorDocumentoHistorico,
    empresaNombreHistorico: receta.empresaNombreHistorico,
    empresaRucHistorico: receta.empresaRucHistorico,
    empresaDireccionHistorica: receta.empresaDireccionHistorica,
    empresaTelefonoHistorico: receta.empresaTelefonoHistorico,
    departamentoNombreHistorico: receta.departamentoNombreHistorico,
    trabajadorSexoHistorico: receta.trabajadorSexoHistorico,
    trabajadorNacimientoHistorico: receta.trabajadorNacimientoHistorico,
    profesionalNombreHistorico: receta.profesionalNombreHistorico,
    profesionalCodigoHistorico: receta.profesionalCodigoHistorico,
    profesionalEspecialidadHistorica: receta.profesionalEspecialidadHistorica,
    diagnosticosHistoricos: receta.diagnosticosHistoricos,
    alergiaConfirmada: receta.alergiaConfirmada,
    justificacionAlergia: receta.justificacionAlergia,
    registroDiarioId: receta.registroDiarioId,
    evaluacionId: receta.evaluacionId,
    fichaOcupacionalId: receta.fichaOcupacionalId,
    documentoClinicoId: receta.documentoClinicoId,
    medicamentos: receta.medicamentos as RecetaMedicamentoDto[],
  };

  const rutaDestino = receta.registroDiarioId
    ? `/registro-diario/${receta.registroDiarioId}`
    : "/recetas";
  const etiquetaRegresar = receta.registroDiarioId
    ? "Volver al Registro Diario"
    : "Regresar";

  return (
    <>
      <BotonRegresar
        rutaDirecta={rutaDestino}
        rutaRespaldo={rutaDestino}
        etiqueta={etiquetaRegresar}
      />
      <VistaPreviaDocumento
        titulo={`Receta ${receta.numeroReceta}`}
        subtitulo={`${receta.trabajadorNombreHistorico} · ${receta.fechaEmision.toISOString().slice(0, 10)}`}
        tipo="html"
        rutaPdf={`/api/recetas/${receta.id}/pdf`}
        rutaRegreso={`/recetas/${receta.id}`}
      >
        <div className="print-area">
          <DetalleReceta receta={detalle} />
        </div>
      </VistaPreviaDocumento>
    </>
  );
}
