import type { LucideIcon } from "lucide-react";

interface EstadoVacioProps {
  icono?: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}

export function EstadoVacio({
  icono: Icono,
  titulo,
  descripcion,
  accion,
}: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card/70 px-5 py-8 text-center shadow-xs sm:px-8 sm:py-10">
      {Icono && (
        <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icono className="size-7" aria-hidden />
        </span>
      )}
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{titulo}</p>
        {descripcion && (
          <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
            {descripcion}
          </p>
        )}
      </div>
      {accion}
    </div>
  );
}
