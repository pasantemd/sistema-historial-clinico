import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { buttonVariants } from "@/componentes/ui/button-variants";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { cn } from "@/utilidades/clases";
import { FiltrosTrabajadores } from "@/modulos/trabajadores/componentes/filtros-trabajadores";
import { PaginacionTrabajadores } from "@/modulos/trabajadores/componentes/paginacion-trabajadores";
import { TablaTrabajadores } from "@/modulos/trabajadores/componentes/tabla-trabajadores";
import {
  consultarCatalogoOrganizacional,
  consultarTrabajadores,
  filtrosTrabajadoresSchema,
} from "@/modulos/trabajadores";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function valorSimple(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function TrabajadoresPage({ searchParams }: Props) {
  const usuario = await requerirPermiso("trabajador.ver");
  const puedeCrear = tienePermiso(usuario, "trabajador.crear");
  const parametrosEntrada = await searchParams;
  const filtros = filtrosTrabajadoresSchema.parse({
    busqueda: valorSimple(parametrosEntrada.busqueda),
    empresaId: valorSimple(parametrosEntrada.empresaId),
    estado: valorSimple(parametrosEntrada.estado),
    departamentoId: valorSimple(parametrosEntrada.departamentoId),
    pagina: valorSimple(parametrosEntrada.pagina),
    tamanoPagina: valorSimple(parametrosEntrada.tamanoPagina),
  });
  const [resultado, catalogo] = await Promise.all([
    consultarTrabajadores(usuario.id, filtros),
    consultarCatalogoOrganizacional(usuario.id),
  ]);
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametrosEntrada)) {
    const simple = valorSimple(valor);
    if (simple) parametros.set(clave, simple);
  }

  return (
    <div className="space-y-8">
      <BotonRegresar rutaRespaldo="/inicio" />
      <Migas />
      <EncabezadoPagina
        titulo="Trabajadores"
        descripcion="Consulte y gestione el personal registrado y sus vínculos laborales."
        acciones={puedeCrear ? (
          <Link href="/trabajadores/nuevo" className={cn(buttonVariants())}>
            <Plus aria-hidden /> Nuevo trabajador
          </Link>
        ) : undefined}
      />
      <FiltrosTrabajadores catalogo={catalogo} />
      {resultado.trabajadores.length ? (
        <>
          <TablaTrabajadores trabajadores={resultado.trabajadores} />
          <PaginacionTrabajadores
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
            total={resultado.total}
            tamanoPagina={resultado.tamanoPagina}
            parametros={parametros}
          />
        </>
      ) : (
        <EstadoVacio
          icono={Users}
          titulo="No se encontraron trabajadores"
          descripcion="Cambie los filtros o registre el primer trabajador."
          accion={puedeCrear ? (
            <Link href="/trabajadores/nuevo" className={cn(buttonVariants())}>
              <Plus aria-hidden /> Nuevo trabajador
            </Link>
          ) : undefined}
        />
      )}
    </div>
  );
}
