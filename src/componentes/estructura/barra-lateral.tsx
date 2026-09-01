"use client";

import { useTransition } from "react";
import { LogOut, Menu, X } from "lucide-react";

import { cn } from "@/utilidades/clases";
import { useMenuLateral } from "@/componentes/menu-lateral/menu-lateral-desplegable";
import { ListaNavegacion } from "@/componentes/navegacion/lista-navegacion";
import { LogoAP } from "@/componentes/marca/logo-apracom";
import { Avatar, AvatarFallback } from "@/componentes/ui/avatar";
import { Button } from "@/componentes/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import { SelectorTema } from "@/componentes/tema/selector-tema";
import { cerrarSesionCliente } from "@/modulos/autenticacion/servicios/cerrar-sesion-cliente";
import type { UsuarioSesion } from "@/modulos/autenticacion/tipos/sesion.tipos";

interface BarraLateralProps {
  usuario?: UsuarioSesion;
}

export function BarraLateral({ usuario }: BarraLateralProps) {
  const { colapsada, alternarColapso } = useMenuLateral();
  const [procesando, iniciarTransicion] = useTransition();
  const iniciales = usuario
    ? `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase()
    : "AD";

  function cerrarSesion() {
    iniciarTransicion(async () => {
      await cerrarSesionCliente();
    });
  }

  return (
    <aside
      className={cn(
        "app-chrome hidden shrink-0 border-r border-sidebar-border bg-sidebar shadow-sm transition-[width] duration-200 md:flex md:flex-col",
        colapsada ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center",
          colapsada
            ? "h-24 flex-col justify-center gap-1 px-2"
            : "h-24 justify-between px-4",
        )}
      >
        <LogoAP
          width={colapsada ? 44 : 156}
          variante={colapsada ? "isotipo" : "completo"}
          className="object-contain"
        />
        {colapsada ? (
          <div className="flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    aria-label="Abrir menú"
                    onClick={alternarColapso}
                  >
                    <Menu className="size-4" aria-hidden />
                  </Button>
                }
              />
              <TooltipContent side="right">Abrir menú</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <SelectorTema />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    aria-label="Cerrar menú"
                    onClick={alternarColapso}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                }
              />
              <TooltipContent side="right">Cerrar menú</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ListaNavegacion colapsada={colapsada} usuario={usuario} />
      </div>
      {usuario && (
        <div
          className={cn(
            "shrink-0 border-t border-sidebar-border",
            colapsada ? "flex flex-col items-center gap-2 py-3" : "p-3",
          )}
        >
          {colapsada ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    aria-label="Cerrar sesión"
                    onClick={cerrarSesion}
                    disabled={procesando}
                  />
                }
              >
                <Avatar size="sm" className="ring-2 ring-primary/10">
                  <AvatarFallback className="text-xs">
                    {iniciales}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>
                  {usuario.nombres} {usuario.apellidos}
                </p>
                <p className="text-xs text-muted-foreground">
                  {usuario.correo}
                </p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar size="sm" className="shrink-0 ring-2 ring-primary/20">
                <AvatarFallback className="text-xs text-primary-foreground">
                  {iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {usuario.nombres} {usuario.apellidos}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {usuario.correo}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                aria-label="Cerrar sesión"
                onClick={cerrarSesion}
                disabled={procesando}
              >
                <LogOut className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
