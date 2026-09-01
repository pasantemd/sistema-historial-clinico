import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/componentes/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Badge } from "@/componentes/ui/badge";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { obtenerResumenAuditoria, obtenerRegistrosAuditoria } from "@/servicios/auditoria/consultas/obtener-registros";
import type { FiltrosAuditoria, RegistroAuditoria } from "@/modulos/auditoria/tipos";

function BadgeResultado({ resultado }: { resultado: RegistroAuditoria["resultado"] }) {
  const variant = resultado === "EXITOSO" ? "success" : "destructive";
  return <Badge variant={variant}>{resultado}</Badge>;
}

export async function PaginaAuditoria({ filtros }: { filtros: FiltrosAuditoria }) {
  const [resumen, resultadoRegistros] = await Promise.all([
    obtenerResumenAuditoria(filtros),
    obtenerRegistrosAuditoria(filtros),
  ]);
  const registros = resultadoRegistros.registros;

  const pagina = filtros.pagina ?? 1;
  const tamano = filtros.take ?? 50;
  const totalPaginas = Math.max(1, Math.ceil(resumen.total / tamano));

  function enlacePagina(nuevaPagina: number) {
    const nuevos = new URLSearchParams();
    if (filtros.usuario) nuevos.set("usuario", filtros.usuario);
    if (filtros.modulo) nuevos.set("modulo", filtros.modulo);
    if (filtros.fechaDesde) nuevos.set("fechaDesde", filtros.fechaDesde);
    if (filtros.fechaHasta) nuevos.set("fechaHasta", filtros.fechaHasta);
    if (filtros.severidad) nuevos.set("resultado", filtros.severidad);
    if (nuevaPagina > 1) {
      nuevos.set("pagina", String(nuevaPagina));
    } else {
      nuevos.delete("pagina");
    }
    return `/auditoria?${nuevos.toString()}`;
  }

  return (
    <div className="space-y-7">
      <EncabezadoPagina
        titulo="Auditoría"
        descripcion="Registro de todas las acciones realizadas en el sistema."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total de registros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{resumen.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Acciones exitosas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-success">{resumen.exitos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Errores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">{resumen.errores}</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Registro de actividades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {registros.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No hay registros de auditoría con los filtros aplicados.
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha y hora</th>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Módulo</th>
                    <th className="px-4 py-3 text-left">Acción</th>
                    <th className="px-4 py-3 text-left">Entidad</th>
                    <th className="px-4 py-3 text-left">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        {formatearFecha(log.fecha)} {log.fecha.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 font-medium">{log.usuario}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.modulo}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{log.accion}</Badge>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3">{log.entidad}</td>
                      <td className="px-4 py-3">
                        <BadgeResultado resultado={log.resultado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Página {pagina} de {totalPaginas}</p>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={pagina <= 1}
            tabIndex={pagina <= 1 ? -1 : undefined}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), pagina <= 1 && "pointer-events-none opacity-50")}
            href={enlacePagina(Math.max(1, pagina - 1))}
          >
            <ChevronLeft aria-hidden /> Anterior
          </Link>
          <Link
            aria-disabled={pagina >= totalPaginas}
            tabIndex={pagina >= totalPaginas ? -1 : undefined}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), pagina >= totalPaginas && "pointer-events-none opacity-50")}
            href={enlacePagina(Math.min(totalPaginas, pagina + 1))}
          >
            Siguiente <ChevronRight aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
