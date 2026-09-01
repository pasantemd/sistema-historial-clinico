import { Badge } from "@/componentes/ui/badge";

const MAPA_ESTADOS: Record<string, "success" | "warning" | "destructive" | "info" | "secondary"> = {
  ACTIVO: "success",
  FINALIZADO: "success",
  FINALIZADA: "success",
  EMITIDO: "info",
  EMITIDA: "info",
  REGISTRADO: "info",
  CONFIRMADA: "success",
  PROGRAMADA: "info",
  ATENDIDA: "success",
  BORRADOR: "warning",
  PENDIENTE: "warning",
  ANULADO: "destructive",
  ANULADA: "destructive",
  CANCELADO: "destructive",
  CANCELADA: "destructive",
  INACTIVO: "secondary",
};

export function BadgeEstado({ estado }: { estado: string }) {
  const variante = MAPA_ESTADOS[estado] ?? "secondary";
  return <Badge variant={variante}>{estado}</Badge>;
}
