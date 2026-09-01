import { notFound, redirect } from "next/navigation";
import { consultarFichaDetalle } from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export default async function Page({
  params,
}: {
  params: Promise<{ fichaId: string }>;
}) {
  const usuario = await requerirPermiso("ficha-ocupacional.ver");
  const { fichaId } = await params;
  const ficha = await consultarFichaDetalle(usuario.id, fichaId);
  if (!ficha) notFound();
  redirect(`/trabajadores/${ficha.trabajadorId}/fichas/${fichaId}`);
}
