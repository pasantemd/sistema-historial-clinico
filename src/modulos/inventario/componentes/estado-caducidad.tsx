import { Badge } from "@/componentes/ui/badge";
import { clasificarCaducidad } from "@/modulos/inventario/servicios/clasificar-caducidad";
import { cn } from "@/utilidades/clases";

const ESTILOS = {
  VENCIDO: "border-destructive/40 bg-destructive-soft text-destructive",
  ROJO: "border-destructive/40 bg-destructive-soft text-destructive",
  AMARILLO: "border-warning/35 bg-warning-soft text-warning",
  VERDE: "border-success/30 bg-success-soft text-success",
  SIN_FECHA: "border-border bg-muted text-muted-foreground",
} as const;

const FORMATEADOR_FECHA = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatearFecha(fecha: string): string {
  return FORMATEADOR_FECHA.format(new Date(`${fecha}T00:00:00.000Z`));
}

export function EstadoCaducidad({ fecha }: { fecha: string | null }) {
  const estado = clasificarCaducidad(fecha);
  const etiqueta = fecha
    ? `${formatearFecha(fecha)}${estado === "VENCIDO" ? " · Vencido" : ""}`
    : "Sin registrar";

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap font-semibold", ESTILOS[estado])}>
      {etiqueta}
    </Badge>
  );
}
