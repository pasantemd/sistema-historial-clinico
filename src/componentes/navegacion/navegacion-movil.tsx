"use client";

import { Menu } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/componentes/ui/sheet";
import { useMenuLateral } from "@/componentes/menu-lateral/menu-lateral-desplegable";
import { ListaNavegacion } from "@/componentes/navegacion/lista-navegacion";
import { LogoAP } from "@/componentes/marca/logo-apracom";
import type { UsuarioSesion } from "@/modulos/autenticacion/tipos/sesion.tipos";

interface Props {
  usuario?: UsuarioSesion;
}

export function NavegacionMovil({ usuario }: Props) {
  const { abiertaMovil, establecerAbiertaMovil } = useMenuLateral();

  return (
    <Sheet open={abiertaMovil} onOpenChange={establecerAbiertaMovil}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menú de navegación"
          />
        }
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="flex h-24 shrink-0 flex-row items-center justify-center border-b border-sidebar-border px-5">
          <LogoAP width={164} className="object-contain" />
          <SheetTitle className="sr-only">Navegación</SheetTitle>
        </SheetHeader>
        <ListaNavegacion
          alNavegar={() => establecerAbiertaMovil(false)}
          usuario={usuario}
        />
      </SheetContent>
    </Sheet>
  );
}
