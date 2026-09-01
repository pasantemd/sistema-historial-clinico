"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { BarraAccionesFormulario } from "@/componentes/formularios/barra-acciones-formulario";
import { useProteccionSalida } from "@/componentes/formularios/use-proteccion-salida";
import { useToastGuardado } from "@/componentes/retroalimentacion/toast-guardado";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";
import { coincideAlergiaMedicamento } from "@/modulos/evaluaciones-medicas/utilidades/normalizar-sustancia";
import { VIAS_ADMINISTRACION } from "@/modulos/recetas/constantes";
import type { ContextoRecetaDto } from "@/modulos/recetas/tipos";
import { crearRecetaAccion, editarRecetaAccion, emitirRecetaAccion } from "@/modulos/recetas/acciones/recetas.acciones";
import {
  crearRecetaSchema,
  recetaBorradorSchema,
  type EntradaFormularioReceta,
  type EntradaMedicamentoReceta,
  type EntradaReceta,
} from "@/modulos/recetas/validaciones/receta.schema";

function Campo({ etiqueta, error, required, children }: { etiqueta: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <EtiquetaCampo etiqueta={etiqueta} required={required} />
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

interface PropiedadesFormularioReceta {
  contexto: ContextoRecetaDto;
  valoresIniciales: EntradaReceta;
  recetaId?: string;
  estado?: string;
  permitirEdicion: boolean;
}

export function FormularioReceta({ contexto, valoresIniciales, recetaId, estado = "BORRADOR", permitirEdicion }: PropiedadesFormularioReceta) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [justificacion, setJustificacion] = useState("");
  const [confirmarAlergia, setConfirmarAlergia] = useState(false);
  const [alertas, setAlertas] = useState<Array<{ sustancia: string; severidad: string; reaccion: string }>>([]);
  const methods = useForm<EntradaFormularioReceta, unknown, EntradaReceta>({
    resolver: zodResolver(recetaBorradorSchema),
    defaultValues: valoresIniciales,
    disabled: !permitirEdicion,
  });
  const { register, control, getValues, setError, clearErrors, formState: { errors } } = methods;
  const medicamentos = useFieldArray({ control, name: "medicamentos" });
  const medicamentosActuales = useWatch({ control, name: "medicamentos" }) ?? [];

  function evaluarAlergias() {
    const detectadas: Array<{ sustancia: string; severidad: string; reaccion: string }> = [];
    medicamentosActuales.forEach((medicamento) => {
      const nombre = medicamento?.nombreMedicamentoHistorico ?? "";
      for (const alergia of contexto.alergias) {
        if (coincideAlergiaMedicamento(nombre, alergia.sustancia)) {
          detectadas.push({ sustancia: alergia.sustancia, severidad: alergia.severidad, reaccion: alergia.descripcion ?? "" });
          break;
        }
      }
    });
    setAlertas(detectadas);
    if (detectadas.length === 0) setConfirmarAlergia(false);
    return detectadas;
  }

  async function guardarReceta(finalizar: boolean) {
    setErrorGeneral(undefined);
    clearErrors();
    const datos = getValues();
    const resultado = (finalizar ? crearRecetaSchema : recetaBorradorSchema).safeParse(datos);
    if (!resultado.success) {
      for (const issue of resultado.error.issues) {
        const ruta = issue.path.join(".") as never;
        if (ruta) setError(ruta, { type: "manual", message: issue.message });
      }
      setErrorGeneral("Revise los campos marcados en rojo.");
      return;
    }
    const alertasDetectadas = evaluarAlergias();
    if (finalizar && alertasDetectadas.length > 0 && (!confirmarAlergia || !justificacion.trim())) {
      setErrorGeneral("Confirme la alerta y escriba la justificación clínica antes de emitir.");
      return;
    }
    iniciar(async () => {
      const respuesta = recetaId ? await editarRecetaAccion(recetaId, resultado.data) : await crearRecetaAccion(resultado.data);
      if (!respuesta.exito) {
        setErrorGeneral(respuesta.mensaje);
        return;
      }
      if (!respuesta.datos?.id) return;
      if (finalizar) {
        const emitir = await emitirRecetaAccion(respuesta.datos.id, confirmarAlergia, justificacion);
        if (!emitir.exito) {
          setErrorGeneral(emitir.mensaje);
          router.replace(`/recetas/${respuesta.datos.id}`);
          return;
        }
        mostrarGuardado("Receta emitida");
      } else {
        mostrarGuardado("Receta guardada");
      }
      router.replace(`/recetas/${respuesta.datos.id}`);
    });
  }

  const { mostrar: mostrarGuardado } = useToastGuardado();
  useProteccionSalida(methods.formState.isDirty);

  const medicamentoVacio: EntradaMedicamentoReceta = {
    nombreMedicamentoHistorico: "",
    nombreGenericoHistorico: "",
    nombreComercialHistorico: "",
    presentacionHistorica: "",
    concentracionHistorica: "",
    cantidad: "",
    dosis: "",
    frecuencia: "",
    intervaloHoras: null,
    duracion: "",
    viaAdministracion: "",
    indicaciones: "",
    observaciones: "",
    orden: medicamentos.fields.length,
  };

  return (
    <form className="space-y-4 pb-56 sm:pb-28" onSubmit={(evento) => evento.preventDefault()} noValidate>
      {errorGeneral && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errorGeneral}</div>}
      <Card>
        <CardHeader><CardTitle>Datos de la receta</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Dato etiqueta="Trabajador" valor={contexto.trabajador.nombre} />
          <Dato etiqueta="Documento" valor={contexto.trabajador.documento} />
          <Dato etiqueta="Empresa" valor={contexto.empresa?.nombre ?? "—"} />
          <Dato etiqueta="RUC" valor={contexto.empresa?.ruc ?? "—"} />
          <Dato etiqueta="Departamento" valor={contexto.departamento?.nombre ?? "—"} />
          <Dato etiqueta="Estado" valor={estado} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Datos generales</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Fecha de emisión" required error={errors.fechaEmision?.message}>
            <Input type="date" required aria-required="true" aria-invalid={Boolean(errors.fechaEmision)} {...register("fechaEmision")} />
          </Campo>
          <Campo etiqueta="Médico responsable" required error={errors.profesionalId?.message}>
            {contexto.evaluacion ? (
              <>
                <input type="hidden" {...register("profesionalId")} />
                <Input readOnly aria-readonly="true" value={contexto.profesionales.find((p) => p.id === contexto.evaluacion?.profesionalId)?.nombre ?? "Profesional de la evaluación"} />
              </>
            ) : (
              <select required aria-required="true" aria-invalid={Boolean(errors.profesionalId)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register("profesionalId")}>
                <option value="">Seleccione un médico</option>
                {contexto.profesionales.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            )}
          </Campo>
        </CardContent>
      </Card>
      {contexto.alergias.length > 0 && (
        <div
          role="alert"
          aria-label="Aviso de alergias activas del paciente"
          className="space-y-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-950 shadow-xs dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <p className="text-sm font-semibold tracking-tight text-amber-900 dark:text-amber-200">
              Aviso clínico: Alergias activas del paciente
            </p>
          </div>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
            Tenga en cuenta las siguientes sustancias registradas antes de prescribir medicamentos:
          </p>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {contexto.alergias.map((a) => (
              <Badge
                key={a.id}
                variant={
                  a.severidad === "GRAVE"
                    ? "destructive"
                    : a.severidad === "MODERADA"
                      ? "warning"
                      : "secondary"
                }
                className="gap-1.5 px-3 py-1 text-xs shadow-xs"
              >
                <span className="font-semibold">{a.sustancia}</span>
                <span className="text-[11px] opacity-80">({a.severidad})</span>
                {a.descripcion && (
                  <span className="text-[11px] opacity-75">· {a.descripcion}</span>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {alertas.length > 0 && (
        <div role="alert" className="space-y-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-destructive"><AlertTriangle className="size-4" /> Alerta de alergia</p>
          <ul className="list-disc space-y-1 pl-5">
            {alertas.map((a) => (
              <li key={a.sustancia}>
                {a.sustancia} — {a.severidad}
                {a.reaccion ? ` (${a.reaccion})` : ""}
              </li>
            ))}
          </ul>
          <label className="flex min-h-11 items-center gap-2 font-medium"><input type="checkbox" checked={confirmarAlergia} onChange={(evento) => setConfirmarAlergia(evento.target.checked)} />Confirmo que revisé las alergias y asumo la decisión clínica</label>
          <Campo etiqueta="Justificación clínica obligatoria"><Textarea value={justificacion} onChange={(evento) => setJustificacion(evento.target.value)} /></Campo>
        </div>
      )}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Medicamentos</CardTitle>
          {permitirEdicion && <Button type="button" variant="outline" size="sm" onClick={() => medicamentos.append(medicamentoVacio)}><Plus className="size-4" /> Agregar medicamento</Button>}
        </CardHeader>
        <CardContent className="space-y-4">
          {medicamentos.fields.map((campo, indice) => (
            <div key={campo.id} className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Medicamento {indice + 1}</p>
                {permitirEdicion && <Button type="button" variant="ghost" size="sm" onClick={() => medicamentos.remove(indice)}><Trash2 className="size-4" /> Eliminar</Button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                <Campo etiqueta="Nombre" required error={errors.medicamentos?.[indice]?.nombreMedicamentoHistorico?.message}>
                  <Input required aria-required="true" placeholder="Nombre del medicamento" {...register(`medicamentos.${indice}.nombreMedicamentoHistorico` as const)} onBlur={evaluarAlergias} />
                </Campo>
                <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                  <Campo etiqueta="Cantidad">
                    <Input placeholder="Ej. 5" {...register(`medicamentos.${indice}.cantidad` as const)} />
                  </Campo>
                  {medicamentosActuales[indice]?.presentacionHistorica && (
                    <span className="mb-3 shrink-0 text-xs font-medium text-muted-foreground">
                      {medicamentosActuales[indice]?.presentacionHistorica}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Dosis" required error={errors.medicamentos?.[indice]?.dosis?.message}>
                  <Input required aria-required="true" placeholder="Ej. Cada 8 horas" {...register(`medicamentos.${indice}.dosis` as const)} />
                </Campo>
                <Campo etiqueta="Vía" required error={errors.medicamentos?.[indice]?.viaAdministracion?.message}>
                  <select required aria-required="true" className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register(`medicamentos.${indice}.viaAdministracion` as const)}>
                    <option value="">Seleccione una vía</option>
                    {VIAS_ADMINISTRACION.map((via) => <option key={via} value={via}>{via}</option>)}
                  </select>
                </Campo>
              </div>
              <Campo etiqueta="Indicaciones (opcional)">
                <Textarea placeholder="Indicaciones específicas para este medicamento (opcional)" {...register(`medicamentos.${indice}.indicaciones` as const)} />
              </Campo>
            </div>
          ))}
          {medicamentos.fields.length === 0 && <p className="text-sm text-muted-foreground">No hay medicamentos agregados.</p>}
        </CardContent>
      </Card>
      <BarraAccionesFormulario
        rutaRegreso={contexto.registroDiarioId ? `/registro-diario/${contexto.registroDiarioId}` : "/recetas"}
        cancelar={<Button type="button" variant="outline" onClick={() => router.push(contexto.registroDiarioId ? `/registro-diario/${contexto.registroDiarioId}` : "/recetas")} disabled={pendiente}>Cancelar</Button>}
        secundario={permitirEdicion ? <Button type="button" variant="outline" disabled={pendiente} onClick={() => guardarReceta(false)}>{pendiente ? "Guardando…" : "Guardar borrador"}</Button> : undefined}
        principal={permitirEdicion ? <Button type="button" disabled={pendiente} onClick={() => guardarReceta(true)}>{pendiente ? "Emitiendo…" : "Emitir receta"}</Button> : undefined}
      />
    </form>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</dt><dd className="mt-1 font-medium">{valor}</dd></div>;
}
