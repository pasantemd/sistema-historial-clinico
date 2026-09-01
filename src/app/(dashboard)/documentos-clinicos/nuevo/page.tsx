import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioDocumentoClinico } from "@/modulos/documentos-clinicos/componentes/formulario-documento-clinico";
import {
  consultarRegistroDiario,
  consultarTrabajadorParaRegistro,
} from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await requerirPermiso("documento-clinico.crear");
  const p = await searchParams;
  const valor = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : "";
  const registroId = valor(p.registroDiarioId);
  const registro = registroId
    ? await consultarRegistroDiario(usuario.id, registroId)
    : null;
  const trabajadorId = registro?.trabajadorId ?? valor(p.trabajadorId);
  const trabajador = trabajadorId
    ? await consultarTrabajadorParaRegistro(usuario.id, trabajadorId)
    : null;
  if (trabajadorId && !trabajador) notFound();
  const observaciones = registro
    ? [
        registro.medicacion ? `Medicación inicial: ${registro.medicacion}` : "",
        registro.procedimiento
          ? `Procedimiento realizado: ${registro.procedimiento}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";
  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Nuevo documento clínico"
        descripcion="Hoja médica asociada directamente al trabajador"
      />
      <FormularioDocumentoClinico
        trabajadorInicial={trabajador}
        valores={{
          trabajadorId: trabajador?.id ?? "",
          registroDiarioId: registro?.id ?? "",
          evaluacionMedicaId: valor(p.evaluacionMedicaId),
          fichaOcupacionalId: valor(p.fichaOcupacionalId),
          fechaDocumento:
            registro?.fechaAtencion ?? new Date().toISOString().slice(0, 10),
          motivoConsulta: registro?.atencionMorbilidad ?? "",
          evolucion: "",
          observaciones,
          diagnosticos: [],
          tratamientos: [],
        }}
      />
    </div>
  );
}
