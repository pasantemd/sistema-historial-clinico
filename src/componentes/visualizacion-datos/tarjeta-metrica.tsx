import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/componentes/ui/card";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";

type EstadoMetrica =
  | { tipo: "proximamente" }
  | { tipo: "enlace"; href: string; etiqueta: string };

interface TarjetaMetricaProps {
  titulo: string;
  valor?: string;
  icono: LucideIcon;
  color?: string;
  estado?: EstadoMetrica;
}

export function TarjetaMetrica({
  titulo,
  valor,
  icono: Icono,
  color = "var(--primary)",
  estado,
}: TarjetaMetricaProps) {
  return (
    <Card className={cn(
      "overflow-hidden transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
      estado?.tipo === "enlace" &&
        "cursor-pointer motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-primary/25 hover:shadow-md",
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
            <p className="text-3xl font-bold tabular-nums tracking-tight">{valor ?? "—"}</p>
          </div>
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: color ? `${color}18` : undefined, color: color ?? undefined }}
          >
            <Icono className="size-5" aria-hidden />
          </span>
        </div>
        {estado?.tipo === "proximamente" && (
          <p className="mt-2 text-xs text-muted-foreground">Próximamente</p>
        )}
        {estado?.tipo === "enlace" && (
          <Link href={estado.href} className={cn(buttonVariants({ variant: "link", size: "sm" }), "mt-2 h-auto p-0 text-xs")}>
            {estado.etiqueta}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
