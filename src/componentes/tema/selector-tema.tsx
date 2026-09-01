"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/componentes/ui/button";

function suscribirVacio(): () => void {
  return () => {};
}

export function SelectorTema() {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = React.useSyncExternalStore(
    suscribirVacio,
    () => true,
    () => false,
  );

  const esOscuro = montado && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={esOscuro ? "Activar tema claro" : "Activar tema oscuro"}
      onClick={() => setTheme(esOscuro ? "light" : "dark")}
    >
      {esOscuro ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </Button>
  );
}
