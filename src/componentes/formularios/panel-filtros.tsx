import type { ReactNode } from "react";
import { cn } from "@/utilidades/clases";

interface PanelFiltrosProps {
  children: ReactNode;
  className?: string;
  columnas?: 2 | 3 | 4 | 5 | 6 | 7;
}

export function PanelFiltros({ children, className, columnas = 4 }: PanelFiltrosProps) {
  const columnasClase = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-5",
    6: "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6",
    7: "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7",
  }[columnas];

  return (
    <div
      className={cn(
        "grid gap-3 rounded-xl border bg-card p-4 shadow-xs",
        columnasClase,
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CampoFiltroWrapperProps {
  children: ReactNode;
  className?: string;
  /** Usar en inputs/autocompletes que necesitan span completo */
  spanCompleto?: boolean;
}

export function CampoFiltroWrapper({ children, className, spanCompleto }: CampoFiltroWrapperProps) {
  return (
    <div className={cn(spanCompleto && "sm:col-span-2", className)}>
      {children}
    </div>
  );
}
