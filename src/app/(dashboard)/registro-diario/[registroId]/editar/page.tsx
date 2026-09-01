import { notFound, redirect } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioRegistroDiario } from "@/modulos/registro-diario/componentes/formulario-registro-diario";
import {
  consultarRegistroDiario,
  consultarTrabajadorParaRegistro,
} from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function Page({
  params,
}: {
  params: Promise<{ registroId: string }>;
}) {
  const usuario = await requerirPermiso("registro-diario.editar");
  const { registroId } = await params;
  const registro = await consultarRegistroDiario(usuario.id, registroId);
  if (!registro) notFound();
  if (registro.estado === "ANULADO") redirect(`/registro-diario/${registroId}`);
  const trabajador = await consultarTrabajadorParaRegistro(
    usuario.id,
    registro.trabajadorId,
  );
  if (!trabajador) notFound();
  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo={`Editar ${registro.numeroRegistro}`}
        descripcion="Los snapshots históricos se conservarán"
      />
      <FormularioRegistroDiario
        registroId={registroId}
        trabajadorInicial={trabajador}
        valores={{
          trabajadorId: registro.trabajadorId,
          fechaAtencion: registro.fechaAtencion,
          atencionMorbilidad: registro.atencionMorbilidad,
          medicacion: registro.medicacion ?? "",
          medicamentos: (registro.medicamentos ?? []).map((m) => ({
            medicamentoInventarioId: m.medicamentoInventarioId,
            nombreSnapshot: m.nombreSnapshot,
            unidadSnapshot: m.unidadSnapshot,
            cantidadEntregada: Number(m.cantidadEntregada),
          })),
          procedimiento: registro.procedimiento ?? "",
          firmaConfirmada: registro.firmaConfirmada,
          observaciones: registro.observaciones ?? "",
        }}
      />
    </div>
  );
}
