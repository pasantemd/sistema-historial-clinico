import type { ComponentType, ReactNode } from "react";

export function CampoFiltro({
  etiqueta,
  icono: Icono,
  children,
}: {
  etiqueta: string;
  icono: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: ReactNode;
}) {
  return (
    <label className="group grid gap-1.5 rounded-lg border bg-card px-3 py-2.5 shadow-xs transition-colors focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 dark:bg-card/80">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Icono className="size-3.5" aria-hidden />
        {etiqueta}
      </span>
      {children}
    </label>
  );
}
