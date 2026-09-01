import { AlertTriangle } from "lucide-react";

interface EstadoErrorProps {
  titulo?: string;
  descripcion?: string;
  accion?: React.ReactNode;
}

export function EstadoError({
  titulo = "Ocurrió un error",
  descripcion = "No fue posible completar la operación. Inténtalo nuevamente.",
  accion,
}: EstadoErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-card px-5 py-8 text-center shadow-xs sm:px-8 sm:py-10"
    >
      <span className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{titulo}</p>
        <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
          {descripcion}
        </p>
      </div>
      {accion}
    </div>
  );
}
