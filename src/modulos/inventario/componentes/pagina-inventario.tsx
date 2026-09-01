import Link from "next/link";
import { AlertCircle, AlertTriangle, Package, Plus } from "lucide-react";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { Badge } from "@/componentes/ui/badge";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { Card, CardContent } from "@/componentes/ui/card";
import { Paginacion } from "@/componentes/visualizacion-datos/paginacion";
import { etiquetaUnidadInventario } from "@/modulos/inventario/constantes";
import { listarInventario } from "@/modulos/inventario/consultas/inventario.consulta";
import { AccionesInventario } from "@/modulos/inventario/componentes/acciones-inventario";
import { EstadoCaducidad } from "@/modulos/inventario/componentes/estado-caducidad";
import { FiltrosInventario as BarraFiltrosInventario } from "@/modulos/inventario/componentes/filtros-inventario";
import { clasificarCaducidad } from "@/modulos/inventario/servicios/clasificar-caducidad";
import type { FiltrosInventario } from "@/modulos/inventario/tipos";
import { cn } from "@/utilidades/clases";

export async function PaginaInventario({ filtros, permisos, parametros }: { filtros: FiltrosInventario; permisos: { crear: boolean; editar: boolean; movimiento: boolean; desactivar: boolean }; parametros: string }) {
  const pagina = await listarInventario(filtros);
  const aPuntoDeVencer = pagina.medicamentos.filter(
    (item) => clasificarCaducidad(item.fechaCaducidad) === "ROJO",
  );
  const vencidos = pagina.medicamentos.filter(
    (item) => clasificarCaducidad(item.fechaCaducidad) === "VENCIDO",
  );

  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/inicio" />
      <Migas />
      <EncabezadoPagina
        titulo="Inventario de medicamentos"
        descripcion="Administre los medicamentos disponibles para el registro diario."
        acciones={permisos.crear ? <Link className={cn(buttonVariants())} href="/inventario/nuevo"><Plus className="size-4" /> Nuevo medicamento</Link> : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador titulo="Medicamentos activos" valor={pagina.indicadores.activos} />
        <Indicador titulo="Unidades disponibles" valor={pagina.indicadores.unidadesDisponibles} />
        <Indicador titulo="Sin stock" valor={pagina.indicadores.sinStock} />
        <Indicador titulo="Stock bajo" valor={pagina.indicadores.stockBajo} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <BarraFiltrosInventario
            key={`${filtros.busqueda ?? ""}:${filtros.estado ?? ""}:${Boolean(filtros.sinStock)}:${Boolean(filtros.stockBajo)}`}
            filtros={filtros}
          />
        </CardContent>
      </Card>

      {vencidos.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive-soft p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">
              {vencidos.length === 1
                ? `Alerta: El medicamento "${vencidos[0].nombre}" ya se encuentra vencido.`
                : `Alerta: Hay ${vencidos.length} medicamentos vencidos.`}
            </p>
            <p className="text-xs text-destructive/90">
              {vencidos.map((m) => m.nombre).join(", ")}
            </p>
          </div>
        </div>
      )}

      {aPuntoDeVencer.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive-soft p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">
              {aPuntoDeVencer.length === 1
                ? `Aviso: El medicamento "${aPuntoDeVencer[0].nombre}" está a punto de vencer.`
                : `Aviso: Hay ${aPuntoDeVencer.length} medicamentos a punto de vencer.`}
            </p>
            <p className="text-xs text-destructive/90">
              {aPuntoDeVencer.map((m) => m.nombre).join(", ")}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {pagina.medicamentos.length === 0 ? (
            <EstadoVacio icono={Package} titulo="Sin medicamentos" descripcion="No hay medicamentos de inventario para los filtros seleccionados." />
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-3">Medicamento</th>
                    <th className="py-3 pr-3">Cantidad disponible</th>
                    <th className="py-3 pr-3">Unidad</th>
                    <th className="py-3 pr-3">Fecha de caducidad</th>
                    <th className="py-3 pr-3">Estado</th>
                    <th className="py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagina.medicamentos.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/40">
                      <td className="py-3 pr-3 font-medium">
                        <Link className="hover:text-primary hover:underline" href={`/inventario/${item.id}`}>
                          {item.nombre}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">{item.cantidadDisponible}</td>
                      <td className="py-3 pr-3">{etiquetaUnidadInventario(item.unidad)}</td>
                      <td className="py-3 pr-3"><EstadoCaducidad fecha={item.fechaCaducidad} /></td>
                      <td className="py-3 pr-3"><Badge variant={item.estado === "ACTIVO" ? "default" : "secondary"}>{item.estado === "ACTIVO" ? "Activo" : "Inactivo"}</Badge></td>
                      <td className="py-3 text-right">
                        <AccionesInventario
                          id={item.id}
                          nombre={item.nombre}
                          cantidadDisponible={item.cantidadDisponible}
                          unidad={etiquetaUnidadInventario(item.unidad)}
                          estado={item.estado}
                          puedeEditar={permisos.editar}
                          puedeMovimiento={permisos.movimiento}
                          puedeDesactivar={permisos.desactivar}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4">
            <Paginacion pagina={pagina.pagina} totalPaginas={pagina.totalPaginas} total={pagina.total} parametros={parametros} etiquetaSingular="medicamento" etiquetaPlural="medicamentos" tamanoPagina={filtros.tamanoPagina ?? 20} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
        <p className="mt-2 text-2xl font-bold">{valor}</p>
      </CardContent>
    </Card>
  );
}
