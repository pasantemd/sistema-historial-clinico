import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { PaginaAuditoria } from "@/modulos/auditoria/componentes/pagina-auditoria";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requerirPermiso("auditoria.ver");
  const p = await searchParams;
  const uno = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/inicio" />
      <PaginaAuditoria
        filtros={{
          usuario: uno(p.usuario),
          modulo: uno(p.modulo),
          fechaDesde: uno(p.fechaDesde),
          fechaHasta: uno(p.fechaHasta),
          severidad: uno(p.resultado),
          pagina: Number(uno(p.pagina) ?? 1),
        }}
      />
    </div>
  );
}
