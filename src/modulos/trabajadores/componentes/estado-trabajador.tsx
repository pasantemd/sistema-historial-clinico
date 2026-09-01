import { Badge } from "@/componentes/ui/badge";
import { ESTADOS_TRABAJADOR } from "@/modulos/trabajadores/constantes";
import type { EstadoTrabajadorValor, EstadoVinculoValor } from "@/modulos/trabajadores/tipos";

export function EstadoTrabajador({ estado }: { estado: EstadoTrabajadorValor | EstadoVinculoValor }) {
  const etiqueta = ESTADOS_TRABAJADOR.find((opcion) => opcion.valor === estado)?.etiqueta ?? estado;
  const variante = estado === "ACTIVO" ? "success" : estado === "SUSPENDIDO" ? "warning" : "secondary";

  return <Badge variant={variante}>{etiqueta}</Badge>;
}
