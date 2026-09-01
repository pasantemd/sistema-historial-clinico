"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";
import { UNIDADES_INVENTARIO } from "@/modulos/inventario/constantes";
import { guardarMedicamentoInventarioAccion } from "@/modulos/inventario/acciones/inventario.acciones";
import {
  medicamentoInventarioSchema,
  type EntradaMedicamentoInventario,
} from "@/modulos/inventario/validaciones/inventario.schema";

const ESTADOS = [
  { valor: "ACTIVO", etiqueta: "Activo" },
  { valor: "INACTIVO", etiqueta: "Inactivo" },
];

function Campo({ etiqueta, error, required, children }: { etiqueta: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <EtiquetaCampo etiqueta={etiqueta} required={required} />
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function FormularioMedicamentoInventario({
  medicamentoId,
  valores,
}: {
  medicamentoId?: string;
  valores: EntradaMedicamentoInventario;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState("");
  const form = useForm<EntradaMedicamentoInventario>({
    resolver: zodResolver(medicamentoInventarioSchema),
    defaultValues: valores,
  });
  const errores = form.formState.errors;

  function guardar(entrada: EntradaMedicamentoInventario) {
    iniciar(async () => {
      setMensaje("");
      const resultado = await guardarMedicamentoInventarioAccion(medicamentoId ?? null, entrada);
      if (!resultado.exito) {
        setMensaje(resultado.mensaje);
        for (const [campo, erroresCampo] of Object.entries(resultado.erroresCampos ?? {})) {
          form.setError(campo as keyof EntradaMedicamentoInventario, { message: erroresCampo[0] });
        }
        return;
      }
      router.push(`/inventario/${resultado.datos?.id ?? medicamentoId}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(guardar)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Datos del medicamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Campo etiqueta="Nombre del medicamento" required error={errores.nombre?.message}>
            <Input {...form.register("nombre")} aria-invalid={Boolean(errores.nombre)} />
          </Campo>
          <Campo etiqueta="Unidad" required error={errores.unidad?.message}>
            <select className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm" {...form.register("unidad")}>
              {UNIDADES_INVENTARIO.map((unidad) => (
                <option key={unidad.valor} value={unidad.valor}>
                  {unidad.etiqueta}
                </option>
              ))}
            </select>
          </Campo>
          {!medicamentoId && (
            <Campo etiqueta="Cantidad disponible inicial" required error={errores.cantidadDisponible?.message}>
              <Input type="number" step="1" min="0" {...form.register("cantidadDisponible")} />
            </Campo>
          )}
          <Campo etiqueta="Fecha de caducidad" required error={errores.fechaCaducidad?.message}>
            <Input
              type="date"
              {...form.register("fechaCaducidad")}
              aria-invalid={Boolean(errores.fechaCaducidad)}
            />
          </Campo>
          {medicamentoId && (
            <Campo etiqueta="Estado" error={errores.estado?.message}>
              <select className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm" {...form.register("estado")}>
                {ESTADOS.map((estado) => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
          )}
          <Campo etiqueta="Observaciones" error={errores.observaciones?.message}>
            <Textarea className="min-h-24" {...form.register("observaciones")} />
          </Campo>
        </CardContent>
      </Card>
      {mensaje && <p role="alert" className="text-sm text-destructive">{mensaje}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/inventario")} disabled={pendiente}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendiente}>
          {!pendiente && !medicamentoId && <Plus aria-hidden />}
          {pendiente ? "Guardando…" : medicamentoId ? "Guardar cambios" : "Crear medicamento"}
        </Button>
      </div>
    </form>
  );
}
