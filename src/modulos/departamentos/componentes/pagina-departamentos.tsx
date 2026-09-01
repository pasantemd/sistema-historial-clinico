import Link from "next/link";
import { Network, Plus } from "lucide-react";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { Paginacion } from "@/componentes/visualizacion-datos/paginacion";
import { consultarEmpresasAutorizadas } from "@/modulos/empresas";
import { FiltrosDepartamentos } from "@/modulos/departamentos/componentes/filtros-departamentos";
import { TablaDepartamentos } from "@/modulos/departamentos/componentes/tabla-departamentos";
import {
  OPCIONES_TAMANO_PAGINA_DEPARTAMENTOS,
} from "@/modulos/departamentos/constantes";
import { consultarDepartamentos, filtrosDepartamentosSchema } from "@/modulos/departamentos";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";
import { cn } from "@/utilidades/clases";

export default async function DepartamentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await requerirPermiso("departamento.ver");
  const entrada = await searchParams;
  const simple = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

  const filtros = filtrosDepartamentosSchema.parse({
    busqueda: simple(entrada.busqueda),
    empresaId: simple(entrada.empresaId),
    pagina: simple(entrada.page) ?? simple(entrada.pagina),
    tamanoPagina: simple(entrada.pageSize) ?? simple(entrada.tamanoPagina),
  });

  const [resultado, empresas] = await Promise.all([
    consultarDepartamentos(usuario.id, filtros),
    consultarEmpresasAutorizadas(usuario.id),
  ]);

  const parametros = new URLSearchParams();
  if (filtros.busqueda) parametros.set("busqueda", filtros.busqueda);
  if (filtros.empresaId) parametros.set("empresaId", filtros.empresaId);
  parametros.set("pageSize", String(resultado.tamanoPagina));

  return (
    <div className="space-y-8">
      <BotonRegresar rutaRespaldo="/configuracion" />
      <Migas />
      <EncabezadoPagina
        titulo="Departamentos"
        descripcion="Estructura departamental de sus empresas autorizadas."
        acciones={
          tienePermiso(usuario, "departamento.crear") ? (
            <Link href="/configuracion/departamentos/nuevo" className={cn(buttonVariants())}>
              <Plus aria-hidden />
              Nuevo departamento
            </Link>
          ) : undefined
        }
      />

      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <FiltrosDepartamentos empresas={empresas} />
      </div>

      {resultado.departamentos.length ? (
        <>
          <TablaDepartamentos
            datos={resultado.departamentos}
            puedeEditar={tienePermiso(usuario, "departamento.editar")}
            puedeCambiarEstado={tienePermiso(usuario, "departamento.desactivar")}
          />
          <Paginacion
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
            total={resultado.total}
            parametros={parametros.toString()}
            tamanoPagina={resultado.tamanoPagina}
            opcionesTamano={[...OPCIONES_TAMANO_PAGINA_DEPARTAMENTOS]}
            rutaBase="/configuracion/departamentos"
          />
        </>
      ) : (
        <EstadoVacio
          icono={Network}
          titulo="No se encontraron departamentos"
          descripcion="Cambie los filtros o cree el primer departamento."
        />
      )}
    </div>
  );
}
