import { notFound } from "next/navigation";
import { DetalleRegistroDiario } from "@/modulos/registro-diario/componentes/detalle-registro-diario";
import { consultarRegistroDiario } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export default async function Page({
  params,
}: {
  params: Promise<{ registroId: string }>;
}) {
  const usuario = await requerirPermiso("registro-diario.ver");
  const { registroId } = await params;
  const registro = await consultarRegistroDiario(usuario.id, registroId);
  if (!registro) notFound();
  return <DetalleRegistroDiario registro={registro} />;
}
