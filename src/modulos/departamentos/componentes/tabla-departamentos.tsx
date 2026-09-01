"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Power } from "lucide-react";

import { Badge } from "@/componentes/ui/badge";
import { Button, buttonVariants } from "@/componentes/ui/button";
import { cambiarEstadoDepartamentoAccion } from "@/modulos/departamentos/acciones/departamentos.acciones";
import type { DepartamentoLista } from "@/modulos/departamentos/tipos";
import { cn } from "@/utilidades/clases";

interface TablaDepartamentosProps {
  datos: DepartamentoLista[];
  puedeEditar: boolean;
  puedeCambiarEstado: boolean;
}

export function TablaDepartamentos({
  datos,
  puedeEditar,
  puedeCambiarEstado,
}: TablaDepartamentosProps) {
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  function cambiar(departamento: DepartamentoLista) {
    const nuevoEstado = departamento.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    if (
      nuevoEstado === "INACTIVO" &&
      !window.confirm(`¿Desactivar el departamento “${departamento.nombre}”?`)
    ) {
      return;
    }

    iniciar(async () => {
      const resultado = await cambiarEstadoDepartamentoAccion(
        departamento.id,
        nuevoEstado,
      );
      if (!resultado.exito) setError(resultado.mensaje);
    });
  }

  return (
    <>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="max-w-full overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-muted/70">
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th className="w-28 text-right">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {datos.map((departamento) => (
                <tr key={departamento.id} className="border-b last:border-0">
                  <td className="font-medium">{departamento.nombre}</td>
                  <td>{departamento.empresa}</td>
                  <td className="max-w-xs text-muted-foreground">
                    <span className="block truncate" title={departamento.descripcion ?? "—"}>
                      {departamento.descripcion ?? "—"}
                    </span>
                  </td>
                  <td>
                    <Badge
                      variant={departamento.estado === "ACTIVO" ? "default" : "secondary"}
                    >
                      {departamento.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {puedeEditar && (
                        <Link
                          aria-label={`Editar ${departamento.nombre}`}
                          href={`/configuracion/departamentos/${departamento.id}/editar`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                        >
                          <Pencil aria-hidden />
                        </Link>
                      )}
                      {puedeCambiarEstado && (
                        <Button
                          aria-label={`${departamento.estado === "ACTIVO" ? "Desactivar" : "Activar"} ${departamento.nombre}`}
                          variant="ghost"
                          size="icon-sm"
                          disabled={pendiente}
                          onClick={() => cambiar(departamento)}
                        >
                          <Power aria-hidden />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
