"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { FieldPath, Resolver } from "react-hook-form";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/componentes/ui/button";
import { EnlacePdf } from "@/componentes/documentos/enlace-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { cn } from "@/utilidades/clases";
import { Campo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { SeccionAEstablecimientoUsuario } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-a-establecimiento-usuario";
import { SeccionBMotivoConsulta } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-b-motivo-consulta";
import { SeccionCAntecedentesPersonales } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-c-antecedentes-personales";
import { SeccionDProblemaActual } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-d-problema-actual";
import { SeccionEConstantesVitales } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-e-constantes-vitales";
import { SeccionFExamenFisico } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-f-examen-fisico";
import { SeccionGFactoresRiesgo } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-g-factores-riesgo";
import { SeccionHAntecedentesLaborales } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-h-antecedentes-laborales";
import { SeccionIActividadesExtralaborales } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-i-actividades-extralaborales";
import { SeccionJResultadosExamenes } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-j-resultados-examenes";
import { SeccionKDiagnosticos } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-k-diagnosticos";
import { SeccionLAptitudMedica } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-l-aptitud-medica";
import { SeccionMRecomendaciones } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-m-recomendaciones";
import { SeccionNRetiro } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-n-retiro";
import { SeccionODatosProfesional } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-o-datos-profesional";
import { SeccionPFirmaTrabajador } from "@/modulos/fichas-ocupacionales/componentes/secciones/seccion-p-firma-trabajador";
import { ESTADOS_FICHA, TIPOS_EVALUACION } from "@/modulos/fichas-ocupacionales/constantes";
import { BarraAccionesFormulario } from "@/componentes/formularios/barra-acciones-formulario";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { useProteccionSalida } from "@/componentes/formularios/use-proteccion-salida";
import type { CatalogoFicha, TrabajadorParaFicha } from "@/modulos/fichas-ocupacionales/tipos";
import {
  fichaBorradorSchema,
  fichaCamposSchema,
  fichaFinalizarSchema,
  type EntradaFicha,
} from "@/modulos/fichas-ocupacionales/validaciones/ficha.schema";
import {
  crearFichaAccion,
  finalizarFichaAccion,
  guardarBorradorFichaAccion,
} from "@/modulos/fichas-ocupacionales/acciones/fichas.acciones";

const selector = "min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm";

interface PropiedadesFormularioFicha {
  trabajador: TrabajadorParaFicha;
  catalogo: CatalogoFicha;
  valoresIniciales: EntradaFicha;
  fichaId?: string;
  estado?: string;
  permitirEdicion: boolean;
  mensajeInicial?: string;
}

export function FormularioFicha({
  trabajador,
  catalogo,
  valoresIniciales,
  fichaId,
  estado = "BORRADOR",
  permitirEdicion,
  mensajeInicial,
}: PropiedadesFormularioFicha) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [idActual, setIdActual] = useState(fichaId);
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [exito, setExito] = useState<string | undefined>(mensajeInicial);
  const [camposPendientes, setCamposPendientes] = useState<string[]>([]);

  const methods = useForm<EntradaFicha>({
    defaultValues: valoresIniciales,
    disabled: !permitirEdicion,
    mode: "onBlur",
    resolver: zodResolver(fichaCamposSchema) as Resolver<EntradaFicha>,
  });
  const permitirSalida = useProteccionSalida(methods.formState.isDirty);
  const {
    register,
    control,
    setValue,
    getValues,
    setError,
    setFocus,
    clearErrors,
    formState: { errors },
  } = methods;

  const empresaId = useWatch({ control, name: "empresaId" });
  const departamentoId = useWatch({ control, name: "departamentoId" });
  const tipoEvaluacion = useWatch({ control, name: "tipoEvaluacion" });
  const empresa = catalogo.empresas.find((item) => item.id === empresaId);
  const departamentos = useMemo(
    () => catalogo.departamentos.filter((item) => item.empresaId === empresaId),
    [catalogo.departamentos, empresaId],
  );

  function seleccionarEmpresa(id: string) {
    const seleccionada = catalogo.empresas.find((item) => item.id === id);
    setValue("ruc", seleccionada?.ruc ?? "", { shouldDirty: true });
    setValue("ciiu", seleccionada?.actividadEconomicaCodigo ?? "", { shouldDirty: true });
    setValue("establecimiento", seleccionada?.nombreComercial || seleccionada?.razonSocial || "", { shouldDirty: true });

    const departamentoVinculo = trabajador.empresaId === id ? trabajador.departamentoId : "";
    const existeDepartamento = catalogo.departamentos.some(
      (item) => item.id === departamentoVinculo && item.empresaId === id,
    );
    setValue("departamentoId", existeDepartamento ? departamentoVinculo : "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function aplicarErrores(error: z.ZodError): void {
    clearErrors();
    const mensajes = [...new Set(error.issues.map((issue) => issue.message))].slice(0, 8);
    setCamposPendientes(mensajes);
    for (const issue of error.issues) {
      const ruta = issue.path.join(".") as FieldPath<EntradaFicha>;
      if (ruta) setError(ruta, { type: "manual", message: issue.message });
    }
    const primeraRuta = error.issues[0]?.path.join(".") as FieldPath<EntradaFicha> | undefined;
    if (primeraRuta) requestAnimationFrame(() => setFocus(primeraRuta));
  }

  function aplicarErroresServidor(errores?: Record<string, string[]>): void {
    if (!errores) return;
    const entradas = Object.entries(errores).filter(([, mensajes]) => mensajes.length > 0);
    setCamposPendientes([...new Set(entradas.flatMap(([, mensajes]) => mensajes))].slice(0, 8));
    for (const [campo, mensajes] of entradas) {
      setError(campo as FieldPath<EntradaFicha>, { type: "server", message: mensajes[0] });
    }
    const primero = entradas[0]?.[0] as FieldPath<EntradaFicha> | undefined;
    if (primero) requestAnimationFrame(() => setFocus(primero));
  }

  async function guardarFicha(finalizar: boolean): Promise<void> {
    setErrorGeneral(undefined);
    setExito(undefined);
    setCamposPendientes([]);
    clearErrors();
    const esquema = finalizar ? fichaFinalizarSchema : fichaBorradorSchema;
    const resultado = esquema.safeParse(getValues());
    if (!resultado.success) {
      aplicarErrores(resultado.error);
      setErrorGeneral(finalizar
        ? "Hay campos obligatorios pendientes. Revise la lista y los mensajes junto a cada campo."
        : "Revise los campos mínimos del borrador.");
      return;
    }

    iniciar(async () => {
      try {
        if (finalizar) {
          const respuesta = await finalizarFichaAccion(idActual ?? null, resultado.data);
          if (!respuesta.exito) {
            aplicarErroresServidor(respuesta.erroresCampos);
            setErrorGeneral(respuesta.mensaje);
            return;
          }
          if (!respuesta.datos?.id) {
            setErrorGeneral("No se pudo identificar la ficha finalizada.");
            return;
          }
          permitirSalida();
          router.push(`/trabajadores/${trabajador.id}/fichas/${respuesta.datos.id}/certificado`);
          return;
        }

        const respuesta = idActual
          ? await guardarBorradorFichaAccion(idActual, resultado.data)
          : await crearFichaAccion(resultado.data);
        if (!respuesta.exito) {
          aplicarErroresServidor(respuesta.erroresCampos);
          setErrorGeneral(respuesta.mensaje);
          return;
        }
        if (!respuesta.datos?.id) {
          setErrorGeneral("No se pudo identificar el borrador.");
          return;
        }
        const eraNueva = !idActual;
        methods.reset(resultado.data);
        setIdActual(respuesta.datos.id);
        setExito("Borrador guardado correctamente.");
        if (eraNueva) {
          window.history.replaceState(
            window.history.state,
            "",
            `/trabajadores/${trabajador.id}/fichas/${respuesta.datos.id}/editar?guardado=1`,
          );
        }
      } catch (error) {
        setErrorGeneral(error instanceof Error ? error.message : "No fue posible guardar la ficha.");
      }
    });
  }

  const esFinalizada = estado === "FINALIZADA";
  const propsSeccion = { register, errors, control, watch: methods.watch };
  const etiquetaTipo = TIPOS_EVALUACION.find((item) => item.valor === tipoEvaluacion)?.etiqueta ?? "—";
  const etiquetaEstado = ESTADOS_FICHA.find((item) => item.valor === (estado as never))?.etiqueta ?? estado;
  const departamento = departamentos.find((item) => item.id === departamentoId);
  const puedeExportar = fichaId !== undefined;

  return (
    <FormProvider {...methods}>
      <form className="space-y-4 pb-56 sm:pb-28" onSubmit={(evento) => evento.preventDefault()} noValidate>
        <Card>
          <CardHeader><CardTitle>Datos de la evaluación</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Dato etiqueta="Trabajador" valor={`${trabajador.apellidos} ${trabajador.nombres}`} />
              <Dato etiqueta="Empresa" valor={empresa?.razonSocial ?? "—"} />
              <Dato etiqueta="Departamento" valor={departamento?.nombre ?? "—"} />
              <Dato etiqueta="Tipo" valor={etiquetaTipo} />
              <Dato etiqueta="Estado" valor={etiquetaEstado} />
            </dl>

            {!trabajador.tieneOrganizacionActiva && (
              <div role="status" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                Trabajador sin vínculo laboral activo coincidente. Seleccione empresa y departamento manualmente.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Empresa" required error={errors.empresaId?.message}>
                <select
                  className={selector}
                  {...register("empresaId", {
                    onChange: (evento) => seleccionarEmpresa(evento.target.value),
                  })}
                >
                  <option value="">Seleccione una empresa</option>
                  {catalogo.empresas.map((item) => <option key={item.id} value={item.id}>{item.razonSocial}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Departamento" required error={errors.departamentoId?.message}>
                <select className={selector} disabled={!empresaId || !permitirEdicion} {...register("departamentoId")}>
                  <option value="">{empresaId ? "Seleccione un departamento" : "Seleccione primero una empresa"}</option>
                  {departamentos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
              </Campo>
            </div>
          </CardContent>
        </Card>

        {errorGeneral && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">{errorGeneral}</p>
            {camposPendientes.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {camposPendientes.map((mensaje) => <li key={mensaje}>{mensaje}</li>)}
              </ul>
            )}
          </div>
        )}
        {exito && <div role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">{exito}</div>}

        <SeccionAEstablecimientoUsuario {...propsSeccion} empresa={empresa} numeroDocumento={trabajador.numeroDocumento} />
        <SeccionBMotivoConsulta {...propsSeccion} />
        <SeccionCAntecedentesPersonales {...propsSeccion} />
        <SeccionDProblemaActual {...propsSeccion} />
        <SeccionEConstantesVitales {...propsSeccion} />
        <SeccionFExamenFisico {...propsSeccion} />
        <SeccionGFactoresRiesgo {...propsSeccion} />
        <SeccionHAntecedentesLaborales {...propsSeccion} />
        <SeccionIActividadesExtralaborales {...propsSeccion} />
        <SeccionJResultadosExamenes {...propsSeccion} />
        <SeccionKDiagnosticos {...propsSeccion} />
        <SeccionLAptitudMedica {...propsSeccion} />
        <SeccionMRecomendaciones {...propsSeccion} />
        <SeccionNRetiro {...propsSeccion} />
        <SeccionODatosProfesional {...propsSeccion} />
        <SeccionPFirmaTrabajador {...propsSeccion} />

        {esFinalizada ? (
          <div className="sticky bottom-0 z-30 border-t border-border bg-background shadow-[0_-8px_24px_-18px_rgba(0,0,0,0.55)]">
            <div className="mx-auto flex max-w-(--contenedor-formulario) flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <BotonRegresar rutaRespaldo="/fichas-ocupacionales" />
              <div className="flex flex-wrap gap-2">
                {fichaId && (
                  <>
                    <EnlacePdf ruta={`/api/fichas/${fichaId}/pdf`} className={cn(buttonVariants({ variant: "outline" }))}>
                      <FileDown aria-hidden /> Ver / Imprimir ficha PDF
                    </EnlacePdf>
                    {puedeExportar && (
                      <>
                        <EnlacePdf ruta={`/api/fichas/${fichaId}/certificado/pdf`} className={cn(buttonVariants({ variant: "outline" }))}>
                          <FileDown aria-hidden /> Ver / Imprimir certificado PDF
                        </EnlacePdf>
                        <a href={`/api/fichas/${fichaId}/exportar/excel`} className={cn(buttonVariants({ variant: "outline" }))}>
                          <FileSpreadsheet aria-hidden /> Descargar Excel
                        </a>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <BarraAccionesFormulario
            rutaRegreso="/fichas-ocupacionales"
            secundario={
              permitirEdicion ? (
                <Button type="button" variant="outline" disabled={pendiente} onClick={() => guardarFicha(false)}>
                  {pendiente ? "Guardando…" : "Guardar borrador"}
                </Button>
              ) : undefined
            }
            principal={
              permitirEdicion ? (
                <Button type="button" disabled={pendiente} onClick={() => guardarFicha(true)}>
                  {pendiente ? "Procesando…" : "Finalizar ficha"}
                </Button>
              ) : undefined
            }
          />
        )}
      </form>
    </FormProvider>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-1 font-medium">{valor}</dd>
    </div>
  );
}
