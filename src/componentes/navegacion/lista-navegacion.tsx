"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utilidades/clases";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import { NAVEGACION_PRINCIPAL } from "@/configuracion/navegacion";
import type { UsuarioSesion } from "@/modulos/autenticacion/tipos/sesion.tipos";

interface ListaNavegacionProps {
  colapsada?: boolean;
  alNavegar?: () => void;
  usuario?: UsuarioSesion;
}

function tienePermisoNav(
  usuario: UsuarioSesion | undefined,
  permiso?: string,
): boolean {
  if (!permiso) return true;
  if (!usuario) return true;
  if (usuario.roles.includes("ADMINISTRADOR")) return true;
  return usuario.permisos.includes(permiso);
}

function ElementoNav({
  elemento,
  activo,
  colapsada,
  alNavegar,
}: {
  elemento: (typeof NAVEGACION_PRINCIPAL)[number];
  activo: boolean;
  colapsada: boolean;
  alNavegar?: () => void;
}) {
  const Icono = elemento.icono;

  const contenido = (
    <>
      <Icono
        className={cn(
          "size-5 shrink-0 transition-colors",
          activo
            ? "text-primary-foreground"
            : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80",
        )}
        aria-hidden
      />
      <span className={cn("truncate", colapsada && "sr-only")}>
        {elemento.etiqueta}
      </span>
      {!elemento.disponible && !colapsada && (
        <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          Próximamente
        </span>
      )}
    </>
  );

  const clasesBase = cn(
    "group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
    colapsada && "justify-center px-0",
    !colapsada && "mx-1",
  );

  if (!elemento.disponible) {
    const deshabilitado = (
      <span
        aria-disabled="true"
        title="Próximamente"
        className={cn(
          clasesBase,
          "cursor-not-allowed text-muted-foreground/55",
        )}
      >
        {contenido}
      </span>
    );

    if (colapsada) {
      return (
        <Tooltip key={elemento.ruta}>
          <TooltipTrigger render={deshabilitado} />
          <TooltipContent side="right">
            {elemento.etiqueta} · Próximamente
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div key={elemento.ruta}>{deshabilitado}</div>;
  }

  const enlace = (
    <Link
      href={elemento.ruta}
      onClick={alNavegar}
      aria-current={activo ? "page" : undefined}
      className={cn(
        clasesBase,
        activo
          ? "bg-primary font-semibold text-primary-foreground shadow-sm"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      {contenido}
    </Link>
  );

  if (colapsada) {
    return (
      <Tooltip key={elemento.ruta}>
        <TooltipTrigger render={enlace} />
        <TooltipContent side="right">{elemento.etiqueta}</TooltipContent>
      </Tooltip>
    );
  }

  return <div key={elemento.ruta}>{enlace}</div>;
}

export function ListaNavegacion({
  colapsada = false,
  alNavegar,
  usuario,
}: ListaNavegacionProps) {
  const rutaActual = usePathname();

  const puedeAdministrarConfiguracion = tienePermisoNav(
    usuario,
    "empresa.ver",
  );
  const itemsVisibles = NAVEGACION_PRINCIPAL.filter(
    (e) =>
      e.ruta !== "/configuracion" &&
      !(e.ruta === "/mi-perfil" && puedeAdministrarConfiguracion) &&
      tienePermisoNav(usuario, e.permiso),
  );
  const configuracion = NAVEGACION_PRINCIPAL.find(
    (e) => e.ruta === "/configuracion",
  );
  const mostrarConfig =
    configuracion && tienePermisoNav(usuario, configuracion.permiso);

  return (
    <nav className="flex h-full flex-col" aria-label="Navegación principal">
      <div className="flex-1 space-y-0.5 px-2 py-4">
        {itemsVisibles.map((elemento) => (
          <ElementoNav
            key={elemento.ruta}
            elemento={elemento}
            activo={
              rutaActual === elemento.ruta ||
              rutaActual.startsWith(`${elemento.ruta}/`)
            }
            colapsada={colapsada}
            alNavegar={alNavegar}
          />
        ))}
      </div>

      {mostrarConfig && (
        <div className="space-y-0.5 border-t border-sidebar-border px-2 py-2">
          <ElementoNav
            elemento={configuracion}
            activo={
              rutaActual === configuracion.ruta ||
              rutaActual.startsWith(`${configuracion.ruta}/`)
            }
            colapsada={colapsada}
            alNavegar={alNavegar}
          />
        </div>
      )}
    </nav>
  );
}
