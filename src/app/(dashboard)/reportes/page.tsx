import { notFound } from "next/navigation";
import { consultarCatalogoOrganizacional } from "@/modulos/trabajadores/consultas/trabajadores.consulta";
import { PaginaReportes } from "@/modulos/reportes/componentes/pagina-reportes";
import { consultarReportes } from "@/modulos/reportes/consultas/reportes.consulta";
import { normalizarFiltrosReportes } from "@/modulos/reportes/servicios/resolver-periodo-reportes";
import type { FiltrosReportes, PeriodoReporte } from "@/modulos/reportes/tipos";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";
import { AccesoEmpresaDenegadoError } from "@/modulos/empresas/errores";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirPermiso("reporte.ver");
  const usuario = await requerirUsuario();
  const p = await searchParams;
  const uno = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;
  const filtros = normalizarFiltrosReportes({
    periodo: uno(p.periodo) as PeriodoReporte | undefined,
    fechaReferencia: uno(p.fechaReferencia),
    fechaDesde: uno(p.fechaDesde),
    fechaHasta: uno(p.fechaHasta),
    empresaId: uno(p.empresaId),
    departamentoId: uno(p.departamentoId),
    trabajadorId: uno(p.trabajadorId),
    profesionalId: uno(p.profesionalId),
    estado: uno(p.estado),
  } satisfies FiltrosReportes);
  let data;
  try {
    data = await consultarReportes(usuario.id, filtros);
  } catch (error) {
    if (error instanceof AccesoEmpresaDenegadoError) notFound();
    throw error;
  }
  const catalogo = await consultarCatalogoOrganizacional(usuario.id);
  return <PaginaReportes filtros={filtros} data={data} catalogo={catalogo} />;
}
