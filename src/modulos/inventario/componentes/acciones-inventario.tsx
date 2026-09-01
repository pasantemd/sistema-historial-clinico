"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Minus, MoreVertical, Pencil, Plus, Power } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import { DialogoAgregarCantidad } from "@/modulos/inventario/componentes/dialogo-agregar-cantidad";
import { DialogoCambiarEstadoInventario } from "@/modulos/inventario/componentes/dialogo-cambiar-estado-inventario";
import { DialogoEliminarCantidad } from "@/modulos/inventario/componentes/dialogo-eliminar-cantidad";

interface Props {
  id: string;
  nombre: string;
  cantidadDisponible: string;
  unidad: string;
  estado: "ACTIVO" | "INACTIVO";
  puedeEditar: boolean;
  puedeMovimiento: boolean;
  puedeDesactivar: boolean;
}

type DialogoActivo = "agregar" | "retirar" | "estado" | null;

export function AccionesInventario({
  id,
  nombre,
  cantidadDisponible,
  unidad,
  estado,
  puedeEditar,
  puedeMovimiento,
  puedeDesactivar,
}: Props) {
  const router = useRouter();
  const [dialogoActivo, setDialogoActivo] = useState<DialogoActivo>(null);
  const activo = estado === "ACTIVO";

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="ghost" size="icon" aria-label={`Acciones para ${nombre}`} />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => router.push(`/inventario/${id}`)}>
              <Eye className="size-4" />
              Ver detalle
            </DropdownMenuItem>
            {puedeEditar && (
              <DropdownMenuItem onClick={() => router.push(`/inventario/${id}/editar`)}>
                <Pencil className="size-4" />
                Editar medicamento
              </DropdownMenuItem>
            )}
            {puedeMovimiento && activo && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDialogoActivo("agregar")}>
                  <Plus className="size-4" />
                  Añadir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDialogoActivo("retirar")}
                  disabled={Number(cantidadDisponible) <= 0}
                >
                  <Minus className="size-4" />
                  Retirar
                </DropdownMenuItem>
              </>
            )}
            {puedeDesactivar && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={activo ? "destructive" : "default"}
                  onClick={() => setDialogoActivo("estado")}
                >
                  <Power className="size-4" />
                  {activo ? "Desactivar medicamento" : "Activar medicamento"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DialogoAgregarCantidad
        medicamentoId={id}
        nombre={nombre}
        cantidadDisponible={cantidadDisponible}
        unidad={unidad}
        abierto={dialogoActivo === "agregar"}
        alCambiarAbierto={(abierto) => setDialogoActivo(abierto ? "agregar" : null)}
      />
      <DialogoEliminarCantidad
        medicamentoId={id}
        nombre={nombre}
        cantidadDisponible={cantidadDisponible}
        unidad={unidad}
        abierto={dialogoActivo === "retirar"}
        alCambiarAbierto={(abierto) => setDialogoActivo(abierto ? "retirar" : null)}
      />
      <DialogoCambiarEstadoInventario
        medicamentoId={id}
        nombre={nombre}
        activar={!activo}
        abierto={dialogoActivo === "estado"}
        alCambiarAbierto={(abierto) => setDialogoActivo(abierto ? "estado" : null)}
      />
    </>
  );
}
