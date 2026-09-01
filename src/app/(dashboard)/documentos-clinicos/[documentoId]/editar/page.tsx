import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioDocumentoClinico } from "@/modulos/documentos-clinicos/componentes/formulario-documento-clinico";
import { obtenerDocumentoClinicoFormulario } from "@/modulos/documentos-clinicos/consultas/documentos-clinicos.consulta";
import { consultarTrabajadorParaRegistro } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export default async function Page({
  params,
}: {
  params: Promise<{ documentoId: string }>;
}) {
  const usuario = await requerirPermiso("documento-clinico.editar");
  const { documentoId } = await params;
  const d = await obtenerDocumentoClinicoFormulario(usuario.id, documentoId);
  if (!d) notFound();
  if (d.estado !== "BORRADOR") redirect(`/documentos-clinicos/${d.id}`);
  const trabajador = await consultarTrabajadorParaRegistro(usuario.id, d.trabajadorId);
  if (!trabajador) notFound();
  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo={`Editar ${d.numeroDocumento}`}
        descripcion="Documento clínico en borrador"
      />
      <FormularioDocumentoClinico
        documentoId={d.id}
        trabajadorInicial={trabajador}
        valores={{
          trabajadorId: d.trabajadorId,
          registroDiarioId: d.registroDiarioId ?? "",
          evaluacionMedicaId: d.evaluacionMedicaId ?? "",
          fichaOcupacionalId: d.fichaOcupacionalId ?? "",
          fechaDocumento: d.fechaDocumento.toISOString().slice(0, 10),
          motivoConsulta: d.motivoConsulta ?? "",
          evolucion: d.evolucion ?? "",
          observaciones: d.observaciones ?? "",
          diagnosticos: d.diagnosticos.map((x) => ({
            enfermedadId: x.enfermedadId,
            codigo: x.codigoHistorico,
            descripcion: x.descripcionHistorica,
            tipo: x.tipo,
            observacion: x.observacion ?? "",
          })),
          tratamientos: d.tratamientos.map((x) => ({
            nombre: x.nombreHistorico,
            concentracion: x.concentracion ?? "",
            dosis: x.dosis,
            cantidad: x.cantidad,
            frecuencia: x.frecuencia ?? "",
            intervaloHoras: x.intervaloHoras ?? "",
            duracion: x.duracion ?? "",
            via: x.via ?? "",
            indicaciones: x.indicaciones ?? "",
            observaciones: x.observaciones ?? "",
            alertaAlergiaConfirmada: x.alertaAlergiaConfirmada,
            justificacionAlergia: x.justificacionAlergia ?? "",
          })),
        }}
      />
    </div>
  );
}
