import { notFound } from "next/navigation";
import { DetalleDocumentoClinico } from "@/modulos/documentos-clinicos/componentes/detalle-documento-clinico";
import { consultarDocumentoClinico } from "@/modulos/documentos-clinicos/consultas/documentos-clinicos.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export default async function Page({
  params,
}: {
  params: Promise<{ documentoId: string }>;
}) {
  const usuario = await requerirPermiso("documento-clinico.ver");
  const { documentoId } = await params;
  const documento = await consultarDocumentoClinico(usuario.id, documentoId);
  if (!documento) notFound();
  return <DetalleDocumentoClinico documento={documento} />;
}
