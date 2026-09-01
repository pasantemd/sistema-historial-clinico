import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioRegistroDiario } from "@/modulos/registro-diario/componentes/formulario-registro-diario";
import { consultarTrabajadorParaRegistro } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ trabajadorId?: string | string[] }>;
}) {
  const usuario = await requerirPermiso("registro-diario.crear");
  const parametros = await searchParams;
  const trabajadorId =
    typeof parametros.trabajadorId === "string"
      ? parametros.trabajadorId
      : undefined;
  const trabajador = trabajadorId
    ? await consultarTrabajadorParaRegistro(usuario.id, trabajadorId)
    : null;

  if (trabajadorId && !trabajador) notFound();

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Nuevo registro diario"
        descripcion="Atención rápida de morbilidad"
      />
      <FormularioRegistroDiario
        trabajadorInicial={trabajador}
        valores={{
          trabajadorId: trabajador?.id ?? "",
          fechaAtencion: new Date().toISOString().slice(0, 10),
          atencionMorbilidad: "",
          medicacion: "",
          medicamentos: [],
          procedimiento: "",
          firmaConfirmada: false,
          observaciones: "",
        }}
      />
    </div>
  );
}
