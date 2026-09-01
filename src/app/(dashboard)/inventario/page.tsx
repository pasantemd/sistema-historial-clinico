import { PERMISOS_INVENTARIO } from "@/modulos/inventario/constantes";
import { PaginaInventario } from "@/modulos/inventario/componentes/pagina-inventario";
import { normalizarFiltrosInventario } from "@/modulos/inventario/validaciones/inventario.schema";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const usuario = await requerirPermiso(PERMISOS_INVENTARIO.ver);
  const params = await searchParams;
  const uno = (valor: string | string[] | undefined) => (typeof valor === "string" ? valor : undefined);
  const filtros = normalizarFiltrosInventario({
    busqueda: uno(params.busqueda),
    estado: uno(params.estado),
    sinStock: uno(params.sinStock) === "1",
    stockBajo: uno(params.stockBajo) === "1",
    pagina: Number(uno(params.page) ?? uno(params.pagina) ?? 1),
    tamanoPagina: Number(uno(params.pageSize) ?? 20),
  });
  const consulta = new URLSearchParams();
  if (filtros.busqueda) consulta.set("busqueda", filtros.busqueda);
  if (filtros.estado) consulta.set("estado", filtros.estado);
  if (filtros.sinStock) consulta.set("sinStock", "1");
  if (filtros.stockBajo) consulta.set("stockBajo", "1");
  if ((filtros.pagina ?? 1) > 1) consulta.set("page", String(filtros.pagina));
  if ((filtros.tamanoPagina ?? 20) !== 20) consulta.set("pageSize", String(filtros.tamanoPagina));
  return (
    <PaginaInventario
      parametros={consulta.toString()}
      filtros={filtros}
      permisos={{
        crear: tienePermiso(usuario, PERMISOS_INVENTARIO.crear),
        editar: tienePermiso(usuario, PERMISOS_INVENTARIO.editar),
        movimiento: tienePermiso(usuario, PERMISOS_INVENTARIO.movimiento),
        desactivar: tienePermiso(usuario, PERMISOS_INVENTARIO.desactivar),
      }}
    />
  );
}
