"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import { CampoError } from "@/componentes/formularios/campo-error";
import { Button } from "@/componentes/ui/button";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Input } from "@/componentes/ui/input";
import {
  cambiarEstadoAlergiaAccion,
  guardarAlergiaAccion,
} from "@/modulos/evaluaciones-medicas/acciones/evaluaciones.acciones";
import { AlertaAlergias } from "@/modulos/evaluaciones-medicas/componentes/alerta-alergias";
import type { AlergiaDto } from "@/modulos/evaluaciones-medicas/tipos";
import {
  alergiaSchema,
  type DatosAlergia,
} from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";

interface Props {
  trabajadorId: string;
  alergias: AlergiaDto[];
  puedeCrear: boolean;
  puedeEditar: boolean;
}

export function GestionAlergias({
  trabajadorId,
  alergias,
  puedeCrear,
  puedeEditar,
}: Props) {
  const [editando, setEditando] = useState<AlergiaDto | null>(null);
  const [mostrar, setMostrar] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState("");
  const form = useForm<DatosAlergia>({
    resolver: zodResolver(alergiaSchema),
    defaultValues: valoresAlergia(trabajadorId, null),
  });

  useEffect(() => {
    form.reset(valoresAlergia(trabajadorId, editando));
  }, [editando, form, trabajadorId]);

  const guardar = form.handleSubmit((datos) =>
    iniciar(async () => {
      setMensaje("");
      const respuesta = await guardarAlergiaAccion(datos, editando?.id);
      if (!respuesta.exito) {
        setMensaje(respuesta.mensaje);
        return;
      }
      location.reload();
    }),
  );

  return (
    <div className="space-y-4">
      <AlertaAlergias alergias={alergias.filter((item) => item.activa)} />

      <div className="space-y-2">
        {alergias.length ? (
          alergias.map((alergia) => (
            <div
              key={alergia.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border bg-card/60 p-3 text-sm"
            >
              <b className="min-w-0 flex-1">
                {alergia.tipo}: {alergia.sustancia} — {alergia.severidad}
              </b>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {alergia.activa ? "Activa" : "Inactiva"}
              </span>
              {puedeEditar && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditando(alergia);
                      setMostrar(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      iniciar(async () => {
                        setMensaje("");
                        const respuesta = await cambiarEstadoAlergiaAccion(
                          alergia.id,
                          trabajadorId,
                          !alergia.activa,
                        );
                        if (!respuesta.exito) {
                          setMensaje(respuesta.mensaje);
                          return;
                        }
                        location.reload();
                      })
                    }
                  >
                    {alergia.activa ? "Desactivar" : "Activar"}
                  </Button>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Sin alergias registradas.
          </p>
        )}
      </div>

      {mensaje && (
        <p role="alert" className="text-sm text-destructive">
          {mensaje}
        </p>
      )}

      {puedeCrear && !mostrar && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEditando(null);
            setMostrar(true);
          }}
        >
          <Plus aria-hidden /> Agregar alergia
        </Button>
      )}

      {mostrar && (
        <form
          className="grid gap-4 rounded-lg border bg-card/40 p-4 sm:grid-cols-2"
          onSubmit={guardar}
        >
          <CampoAlergia etiqueta="Tipo" requerido>
            <select
              className="min-h-11 w-full rounded-md border bg-background px-3"
              {...form.register("tipo")}
            >
              <option value="MEDICAMENTO">Medicamento</option>
              <option value="ALIMENTO">Alimento</option>
              <option value="AMBIENTAL">Ambiental</option>
              <option value="OTRA">Otra</option>
            </select>
          </CampoAlergia>

          <CampoAlergia etiqueta="Severidad" requerido>
            <select
              className="min-h-11 w-full rounded-md border bg-background px-3"
              {...form.register("severidad")}
            >
              <option value="LEVE">Leve</option>
              <option value="MODERADA">Moderada</option>
              <option value="GRAVE">Grave</option>
            </select>
          </CampoAlergia>

          <CampoAlergia
            etiqueta="Sustancia"
            requerido
            error={form.formState.errors.sustancia?.message}
          >
            <Input {...form.register("sustancia")} />
          </CampoAlergia>

          <CampoAlergia etiqueta="Descripción de reacción">
            <Input {...form.register("descripcion")} />
          </CampoAlergia>

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button disabled={pendiente} type="submit">
              Guardar alergia
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMostrar(false)}
            >
              Cancelar
            </Button>
          </div>

        </form>
      )}
    </div>
  );
}

function CampoAlergia({
  etiqueta,
  requerido,
  error,
  children,
}: {
  etiqueta: string;
  requerido?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <EtiquetaCampo etiqueta={etiqueta} required={requerido} />
      {children}
      <CampoError mensaje={error} />
    </label>
  );
}

function valoresAlergia(
  trabajadorId: string,
  alergia: AlergiaDto | null,
): DatosAlergia {
  return {
    trabajadorId,
    tipo: alergia?.tipo ?? "MEDICAMENTO",
    sustancia: alergia?.sustancia ?? "",
    descripcion: alergia?.descripcion ?? undefined,
    severidad: alergia?.severidad ?? "MODERADA",
  };
}
