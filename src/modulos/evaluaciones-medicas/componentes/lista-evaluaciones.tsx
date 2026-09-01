import Link from "next/link";
import { FileHeart } from "lucide-react";

import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { Badge } from "@/componentes/ui/badge";
import { buttonVariants } from "@/componentes/ui/button-variants";
import type { EvaluacionResumenDto } from "@/modulos/evaluaciones-medicas/tipos";
import { cn } from "@/utilidades/clases";

export function ListaEvaluaciones({ items }: { items: EvaluacionResumenDto[] }) {
  if (!items.length) {
    return (
      <EstadoVacio
        icono={FileHeart}
        titulo="Sin evaluaciones médicas"
        descripcion="No existen registros para mostrar."
      />
    );
  }

  return (
    <div className="max-w-full overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b bg-muted/70">
            <tr>
              <th>Trabajador</th>
              <th>Empresa histórica</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th className="w-24 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td>
                  <span className="font-medium">{item.trabajador}</span>
                  <small className="block text-muted-foreground">{item.documento}</small>
                </td>
                <td>
                  {item.empresa}
                  <small className="block text-muted-foreground">{item.departamento}</small>
                </td>
                <td className="whitespace-nowrap">{item.fechaAtencion ?? "—"}</td>
                <td>
                  <Badge
                    variant={
                      item.estado === "ANULADA"
                        ? "destructive"
                        : item.estado === "FINALIZADA"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {item.estado}
                  </Badge>
                </td>
                <td className="text-right">
                  <Link
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    href={`/trabajadores/${item.trabajadorId}/evaluaciones-medicas/${item.id}`}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
