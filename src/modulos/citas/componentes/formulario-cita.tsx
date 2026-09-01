"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Search } from "lucide-react";

import { crearCitaSchema, type CrearCitaSchema } from "@/modulos/citas/validaciones/cita.schema";
import { crearCitaAccion, editarCitaAccion, obtenerSelectoresCitaAccion } from "@/modulos/citas/acciones/citas.acciones";
import { DURACIONES_SUGERIDAS, HORAS_DISPONIBLES, ETIQUETAS_ESTADO_CITA } from "@/modulos/citas/constantes";
import { BarraAccionesFormulario } from "@/componentes/formularios/barra-acciones-formulario";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Textarea } from "@/componentes/ui/textarea";
import type { EntradaCita } from "@/modulos/citas/tipos";
import type { EstadoCita } from "@/modulos/citas/constantes";

interface Opcion {
  id: string;
  nombre: string;
  correo?: string;
  documento?: string;
  empresa?: string;
  departamento?: string;
  alergias?: Array<{ sustancia: string; severidad: string }>;
  ultimaEvaluacion?: { fecha: string; motivo: string | null } | null;
  proximaCita?: { fecha: string; hora: string } | null;
}

interface PropiedadesFormularioCita {
  profesionales: Opcion[];
  trabajadores: Opcion[];
  valoresIniciales: EntradaCita;
  citaId?: string;
  estado?: EstadoCita;
  permitirEdicion: boolean;
}

export function FormularioCita({ profesionales, trabajadores, valoresIniciales, citaId, estado = "PROGRAMADA", permitirEdicion }: PropiedadesFormularioCita) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [listaTrabajadores, setListaTrabajadores] = useState<Opcion[]>(trabajadores);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CrearCitaSchema>({
    resolver: zodResolver(crearCitaSchema),
    defaultValues: valoresIniciales,
  });
  const trabajadorId = useWatch({ control, name: "trabajadorId" });
  const profesionalId = useWatch({ control, name: "profesionalId" });
  const horaInicio = useWatch({ control, name: "horaInicio" });
  const duracionMinutos = useWatch({ control, name: "duracionMinutos" });

  useEffect(() => {
    const id = setTimeout(async () => {
      if (busqueda.trim().length >= 3) {
        const res = await obtenerSelectoresCitaAccion(busqueda.trim());
        setListaTrabajadores(res.trabajadores);
      } else {
        setListaTrabajadores(trabajadores);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [busqueda, trabajadores]);

  const soloLectura = !permitirEdicion || (estado !== "PROGRAMADA" && estado !== "CONFIRMADA" && !!citaId);
  const trabajadorSeleccionado = listaTrabajadores.find(
    (trabajador) => trabajador.id === trabajadorId,
  );

  function guardarCita(data: CrearCitaSchema) {
    setError(null);
    const entrada: EntradaCita = {
      trabajadorId: data.trabajadorId,
      profesionalId: data.profesionalId ?? "",
      fecha: data.fecha,
      horaInicio: data.horaInicio,
      duracionMinutos: Number(data.duracionMinutos),
      motivo: data.motivo,
      observaciones: data.observaciones ?? "",
      recordatorio: data.recordatorio,
    };

    iniciar(async () => {
      const respuesta = citaId ? await editarCitaAccion(citaId, entrada) : await crearCitaAccion(entrada);
      if (!respuesta.exito) {
        setError(respuesta.mensaje ?? "No fue posible guardar la cita.");
        return;
      }
      router.push(citaId ? `/citas/${citaId}` : "/citas");
    });
  }

  return (
    <form onSubmit={handleSubmit(guardarCita)} className="space-y-6 pb-56 sm:pb-28" noValidate>
      {soloLectura && (
        <div className="rounded-md border border-warning bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
          Esta cita está {estado ? ETIQUETAS_ESTADO_CITA[estado].toLowerCase() : "cerrada"} y no puede editarse.
        </div>
      )}
      {error && (
        <div className="rounded-md border border-destructive bg-destructive-soft px-4 py-3 text-sm text-destructive-foreground">{error}</div>
      )}

      <fieldset disabled={soloLectura || pendiente} className="space-y-6">
        {!citaId && (
          <p className="rounded-lg border bg-muted/30 p-3 text-sm">
            <b>Estado inicial:</b> Programada
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="busqueda"><EtiquetaCampo etiqueta="Trabajador" required /></Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden />
              <Input
                id="busqueda"
                placeholder="Buscar por nombre o documento"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              aria-label="Seleccionar trabajador para la cita"
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={trabajadorId}
              onChange={(e) => setValue("trabajadorId", e.target.value, { shouldValidate: true })}
            >
              <option value="">Seleccione un trabajador</option>
              {listaTrabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} · {t.documento}
                  {t.empresa ? ` · ${t.empresa}` : ""}
                </option>
              ))}
            </select>
            {errors.trabajadorId && <p className="text-sm text-destructive">{errors.trabajadorId.message}</p>}
            {trabajadorSeleccionado && (
              <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
                <p><b>Empresa actual:</b> {trabajadorSeleccionado.empresa ?? "—"}</p>
                <p><b>Departamento:</b> {trabajadorSeleccionado.departamento ?? "—"}</p>
                <p>
                  <b>Alergias:</b>{" "}
                  {trabajadorSeleccionado.alergias?.length
                    ? trabajadorSeleccionado.alergias.map((alergia) => `${alergia.sustancia} (${alergia.severidad})`).join(", ")
                    : "Sin alergias activas registradas"}
                </p>
                <p><b>Última evaluación:</b> {trabajadorSeleccionado.ultimaEvaluacion ? `${trabajadorSeleccionado.ultimaEvaluacion.fecha} · ${trabajadorSeleccionado.ultimaEvaluacion.motivo ?? "Sin motivo"}` : "Sin evaluaciones"}</p>
                <p><b>Próxima cita:</b> {trabajadorSeleccionado.proximaCita ? `${trabajadorSeleccionado.proximaCita.fecha} ${trabajadorSeleccionado.proximaCita.hora}` : "Sin próxima cita"}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profesionalId"><EtiquetaCampo etiqueta="Profesional" /></Label>
            <select
              id="profesionalId"
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={profesionalId ?? ""}
              onChange={(e) => setValue("profesionalId", e.target.value, { shouldValidate: true })}
            >
              <option value="">Sin asignar</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fecha"><EtiquetaCampo etiqueta="Fecha" required /></Label>
            <Input id="fecha" type="date" {...register("fecha")} />
            {errors.fecha && <p className="text-sm text-destructive">{errors.fecha.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="horaInicio"><EtiquetaCampo etiqueta="Hora de inicio" required /></Label>
            <select
              id="horaInicio"
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={horaInicio}
              onChange={(e) => setValue("horaInicio", e.target.value, { shouldValidate: true })}
            >
              {HORAS_DISPONIBLES.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            {errors.horaInicio && <p className="text-sm text-destructive">{errors.horaInicio.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="duracionMinutos"><EtiquetaCampo etiqueta="Duración" required /></Label>
            <select
              id="duracionMinutos"
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={String(duracionMinutos)}
              onChange={(e) => setValue("duracionMinutos", Number(e.target.value), { shouldValidate: true })}
            >
              {DURACIONES_SUGERIDAS.map((d) => (
                <option key={d.valor} value={String(d.valor)}>{d.etiqueta}</option>
              ))}
            </select>
            {errors.duracionMinutos && <p className="text-sm text-destructive">{errors.duracionMinutos.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivo"><EtiquetaCampo etiqueta="Motivo" required /></Label>
          <Input id="motivo" placeholder="Motivo de la cita" {...register("motivo")} />
          {errors.motivo && <p className="text-sm text-destructive">{errors.motivo.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="observaciones"><EtiquetaCampo etiqueta="Observaciones" /></Label>
          <Textarea id="observaciones" rows={3} {...register("observaciones")} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("recordatorio")} className="size-4" />
          Marcar para recordatorio
        </label>
      </fieldset>

      <BarraAccionesFormulario
        cancelarHref={citaId ? `/citas/${citaId}` : "/citas"}
        cargando={pendiente}
        textoFinalizar={citaId ? "Guardar cambios" : "Programar cita"}
        deshabilitadoFinalizar={soloLectura}
        iconoFinalizar={pendiente ? <Loader2 className="size-4 animate-spin" /> : citaId ? undefined : <Plus className="size-4" aria-hidden />}
      />
    </form>
  );
}
