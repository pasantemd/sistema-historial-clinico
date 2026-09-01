"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";

import { BarraAccionesFormulario } from "@/componentes/formularios/barra-acciones-formulario";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { useProteccionSalida } from "@/componentes/formularios/use-proteccion-salida";
import { useToastGuardado } from "@/componentes/retroalimentacion/toast-guardado";
import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";
import { etiquetaUnidadInventario } from "@/modulos/inventario/constantes";
import type { MedicamentoInventarioBusquedaDto } from "@/modulos/inventario/tipos";
import { CampoMorbilidad } from "@/modulos/morbilidades/componentes/campo-morbilidad";
import {
  buscarMedicamentosInventarioAccion,
  buscarTrabajadoresRegistroAccion,
  guardarRegistroDiarioAccion,
} from "@/modulos/registro-diario/acciones/registro-diario.acciones";
import type { TrabajadorRegistroDto } from "@/modulos/registro-diario/tipos";
import { obtenerRutaRegistroDiarioGuardado } from "@/modulos/registro-diario/navegacion/registro-diario.navegacion";
import {
  registroDiarioBorradorSchema,
  registroDiarioSchema,
  type EntradaRegistroDiario,
} from "@/modulos/registro-diario/validaciones/registro-diario.schema";

function Campo({ etiqueta, requerido, error, className, children }: { etiqueta: string; requerido?: boolean; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`space-y-1.5 text-sm font-medium ${className ?? ""}`}>
      <EtiquetaCampo etiqueta={etiqueta} required={requerido} />
      {children}
      {error && <span role="alert" className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function FormularioRegistroDiario({
  registroId,
  trabajadorInicial,
  valores,
}: {
  registroId?: string;
  trabajadorInicial?: TrabajadorRegistroDto | null;
  valores: EntradaRegistroDiario;
}) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [trabajador, setTrabajador] = useState<TrabajadorRegistroDto | null>(trabajadorInicial ?? null);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<TrabajadorRegistroDto[]>([]);
  const [busquedaMedicamento, setBusquedaMedicamento] = useState("");
  const [resultadosMedicamentos, setResultadosMedicamentos] = useState<MedicamentoInventarioBusquedaDto[]>([]);
  const [mensaje, setMensaje] = useState("");
  const envioEnCursoRef = useRef(false);
  const form = useForm<EntradaRegistroDiario>({
    resolver: zodResolver(registroDiarioBorradorSchema),
    defaultValues: { ...valores, medicamentos: valores.medicamentos ?? [] },
  });
  const medicamentos = useFieldArray({ control: form.control, name: "medicamentos" });
  const medicamentosActuales = useWatch({ control: form.control, name: "medicamentos" }) ?? [];
  const errores = form.formState.errors;
  const { mostrar: mostrarGuardado } = useToastGuardado();
  const permitirSalida = useProteccionSalida(form.formState.isDirty && !pendiente);

  useEffect(() => {
    if (busqueda.trim().length < 2) return;
    const timer = setTimeout(async () => setResultados(await buscarTrabajadoresRegistroAccion(busqueda)), 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    if (busquedaMedicamento.trim().length < 2) return;
    const timer = setTimeout(async () => setResultadosMedicamentos(await buscarMedicamentosInventarioAccion(busquedaMedicamento)), 300);
    return () => clearTimeout(timer);
  }, [busquedaMedicamento]);

  function agregarMedicamento(item: MedicamentoInventarioBusquedaDto) {
    const existentes = form.getValues("medicamentos") ?? [];
    if (existentes.some((medicamento) => medicamento.medicamentoInventarioId === item.id)) {
      setMensaje("Ese medicamento ya fue agregado al registro.");
      return;
    }
    medicamentos.append({
      medicamentoInventarioId: item.id,
      nombreSnapshot: item.nombre,
      unidadSnapshot: etiquetaUnidadInventario(item.unidad),
      cantidadEntregada: 1,
    });
    setBusquedaMedicamento("");
    setResultadosMedicamentos([]);
  }

  const guardar = (finalizar: boolean) =>
    form.handleSubmit((entrada) =>
      iniciarTransicion(async () => {
        if (envioEnCursoRef.current) return;
        envioEnCursoRef.current = true;
        setMensaje("");
        const validacion = (finalizar ? registroDiarioSchema : registroDiarioBorradorSchema).safeParse(entrada);
        if (!validacion.success) {
          validacion.error.issues.forEach((issue) =>
            form.setError(issue.path.join(".") as keyof EntradaRegistroDiario, { message: issue.message }),
          );
          setMensaje("Revise los campos obligatorios.");
          envioEnCursoRef.current = false;
          return;
        }
        try {
          const resultado = await guardarRegistroDiarioAccion(registroId ?? null, validacion.data, finalizar);
          if (!resultado.exito || !resultado.datos?.id) {
            setMensaje(resultado.mensaje ?? "No fue posible guardar.");
            envioEnCursoRef.current = false;
            return;
          }
          mostrarGuardado(finalizar ? "Registro guardado" : "Borrador guardado");
          permitirSalida();
          router.replace(obtenerRutaRegistroDiarioGuardado(resultado.datos.id));
        } catch {
          setMensaje("No fue posible guardar el registro diario.");
          envioEnCursoRef.current = false;
        }
      }),
    )();

  return (
    <form className="space-y-5 pb-56 sm:pb-28" onSubmit={(evento) => evento.preventDefault()} noValidate>
      <Card className="relative z-20 overflow-visible">
        <CardHeader><CardTitle>Datos del trabajador</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!trabajador && (
            <div className="relative">
              <Search aria-hidden className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input aria-label="Buscar trabajador" className="pl-9" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por cédula, nombres o apellidos" />
              {busqueda.trim().length >= 2 && resultados.length > 0 && (
                <div role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
                  {resultados.map((item) => (
                    <button key={item.id} type="button" role="option" aria-selected="false" className="min-h-11 w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setTrabajador(item); form.setValue("trabajadorId", item.id, { shouldDirty: true }); setResultados([]); setBusqueda(""); }}>
                      <span className="block font-medium">{item.nombreCompleto}</span>
                      <span className="text-muted-foreground">{item.numeroDocumento} · {item.empresa} · {item.departamento}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {trabajador && (
            <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-4">
              <p><span className="block text-xs text-muted-foreground">Trabajador</span>{trabajador.nombreCompleto}</p>
              <p><span className="block text-xs text-muted-foreground">Cédula</span>{trabajador.numeroDocumento}</p>
              <p><span className="block text-xs text-muted-foreground">Nacimiento / edad</span>{trabajador.fechaNacimiento ?? "—"} · {trabajador.edad ?? "—"} años</p>
              <p><span className="block text-xs text-muted-foreground">Empresa / departamento</span>{trabajador.empresa} · {trabajador.departamento}</p>
              {!registroId && <Button type="button" variant="ghost" className="w-fit" onClick={() => { setTrabajador(null); form.setValue("trabajadorId", "", { shouldDirty: true }); }}>Cambiar trabajador</Button>}
            </div>
          )}
          {trabajador && trabajador.alergias.length > 0 && (
            <div role="alert" className="rounded-md border border-amber-500/60 bg-amber-500/10 p-3 text-sm">
              <strong>Alergias activas:</strong>{" "}
              {trabajador.alergias.map((item) => `${item.sustancia} (${item.severidad}${item.reaccion ? `, ${item.reaccion}` : ""})`).join("; ")}
            </div>
          )}
          {errores.trabajadorId?.message && <p className="text-sm text-destructive">{errores.trabajadorId.message}</p>}
        </CardContent>
      </Card>

      <Card className="relative z-10 overflow-visible">
        <CardHeader><CardTitle>Registro de atención</CardTitle></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <Campo etiqueta="Día de atención" requerido error={errores.fechaAtencion?.message}>
            <Input type="date" required aria-required="true" aria-invalid={Boolean(errores.fechaAtencion)} {...form.register("fechaAtencion")} />
          </Campo>
          <CampoMorbilidad
            form={form}
            name="atencionMorbilidad"
            etiqueta="Atención morbilidad"
            requerido
            error={errores.atencionMorbilidad?.message}
            placeholder="Escriba la morbilidad (ej. Dolor abdominal)"
            className="lg:row-span-2"
          />
          <div className="space-y-3 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <EtiquetaCampo etiqueta="Medicamentos entregados" />
              <span className="text-xs text-muted-foreground">Se descuenta stock al guardar el registro.</span>
            </div>
            <div className="relative">
              <Search aria-hidden className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input className="pl-9" value={busquedaMedicamento} onChange={(evento) => setBusquedaMedicamento(evento.target.value)} placeholder="Buscar medicamento de inventario" />
              {busquedaMedicamento.trim().length >= 2 && resultadosMedicamentos.length > 0 && (
                <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
                  {resultadosMedicamentos.map((item) => (
                    <button key={item.id} type="button" className="flex min-h-11 w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent" onClick={() => agregarMedicamento(item)}>
                      <span className="font-medium">{item.nombre}</span>
                      <span className="text-muted-foreground">{item.cantidadDisponible} {etiquetaUnidadInventario(item.unidad)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {medicamentos.fields.map((campo, indice) => (
                <div key={campo.id} className="grid gap-3 rounded-lg border bg-muted/10 p-3 md:grid-cols-[1fr_160px_auto] md:items-end">
                  <div>
                    <p className="font-medium">{medicamentosActuales[indice]?.nombreSnapshot ?? "Medicamento"}</p>
                    <p className="text-xs text-muted-foreground">Unidad: {medicamentosActuales[indice]?.unidadSnapshot ?? "—"}</p>
                    <input type="hidden" {...form.register(`medicamentos.${indice}.medicamentoInventarioId` as const)} />
                    <input type="hidden" {...form.register(`medicamentos.${indice}.nombreSnapshot` as const)} />
                    <input type="hidden" {...form.register(`medicamentos.${indice}.unidadSnapshot` as const)} />
                  </div>
                  <Campo etiqueta="Cantidad" error={errores.medicamentos?.[indice]?.cantidadEntregada?.message}>
                    <Input type="number" min="1" step="1" {...form.register(`medicamentos.${indice}.cantidadEntregada` as const)} />
                  </Campo>
                  <Button type="button" variant="ghost" size="sm" onClick={() => medicamentos.remove(indice)}><Trash2 className="size-4" /> Quitar</Button>
                </div>
              ))}
              {medicamentos.fields.length === 0 && <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No hay medicamentos entregados.</p>}
            </div>
          </div>
          <Campo etiqueta="Procedimiento" error={errores.procedimiento?.message}><Textarea className="min-h-24 resize-y" {...form.register("procedimiento")} /></Campo>
          <Campo etiqueta="Observaciones" error={errores.observaciones?.message}><Textarea className="min-h-24 resize-y" {...form.register("observaciones")} /></Campo>
          <label className="flex min-h-16 items-center gap-3 rounded-lg border bg-muted/20 px-4 text-sm font-medium">
            <input type="checkbox" className="size-4" {...form.register("firmaConfirmada")} />
            Firma confirmada
          </label>
        </CardContent>
      </Card>

      {mensaje && <p role="alert" className="text-sm text-destructive">{mensaje}</p>}

      <BarraAccionesFormulario
        rutaRegreso="/registro-diario"
        cancelar={<BotonRegresar etiqueta="Volver al listado" rutaRespaldo="/registro-diario" />}
        secundario={<Button type="button" variant="outline" disabled={pendiente} onClick={() => guardar(false)}>Guardar borrador</Button>}
        principal={<Button type="button" disabled={pendiente} onClick={() => guardar(true)}>Guardar registro</Button>}
      />
    </form>
  );
}
