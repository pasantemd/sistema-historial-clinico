import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import {
  requerirPermiso,
  tienePermiso,
} from "@/servicios/autenticacion/requerir-permiso";
import { consultarRecetaRepositorio } from "@/modulos/recetas/repositorios/recetas.repositorio";
import { DetalleReceta } from "@/modulos/recetas/componentes/detalle-receta";
import { AccionesReceta } from "@/modulos/recetas/componentes/acciones-receta";
import type {
  RecetaDetalleDto,
  RecetaMedicamentoDto,
} from "@/modulos/recetas/tipos";
import { coincideAlergiaMedicamento } from "@/modulos/evaluaciones-medicas/utilidades/normalizar-sustancia";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const usuario = await requerirPermiso("receta.ver");
  const { id } = await params;
  const receta = await consultarRecetaRepositorio(usuario.id, id);
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

  const alergias = receta.trabajador.alergias.map((a) => ({
    sustancia: a.sustancia,
    severidad: a.severidad,
  }));
  const tieneConflictoAlergia = detalle.medicamentos.some((medicamento) =>
    alergias.some(
      (alergia) =>
        coincideAlergiaMedicamento(
          medicamento.nombreMedicamentoHistorico,
          alergia.sustancia,
        ) ||
        coincideAlergiaMedicamento(
          medicamento.nombreGenericoHistorico ?? "",
          alergia.sustancia,
        ),
    ),
  );

  const puedeEmitir = tienePermiso(usuario, "receta.emitir");
  const puedeAnular = tienePermiso(usuario, "receta.anular");
  const puedeEditar = tienePermiso(usuario, "receta.editar");
  const puedeExportar = tienePermiso(usuario, "receta.exportar");

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="space-y-6 print:hidden">
        <Migas />
        <EncabezadoPagina
          titulo={`Receta ${receta.numeroReceta}`}
          descripcion={`${receta.trabajadorNombreHistorico} · ${receta.fechaEmision.toISOString().slice(0, 10)}`}
          acciones={
            <AccionesReceta
              receta={detalle}
              puedeEmitir={puedeEmitir}
              puedeAnular={puedeAnular}
              puedeEditar={puedeEditar}
              puedeExportar={puedeExportar}
              tieneConflictoAlergia={tieneConflictoAlergia}
            />
          }
        />
      </div>

      <DetalleReceta receta={detalle} />
    </div>
  );
}
