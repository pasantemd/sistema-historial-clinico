"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/componentes/ui/button";
import { BarraAccionesFormulario } from "@/componentes/formularios/barra-acciones-formulario";
import { crearTrabajadorAccion, editarTrabajadorAccion } from "@/modulos/trabajadores/acciones/trabajadores.acciones";
import type { CatalogoOrganizacional, TrabajadorDetalle } from "@/modulos/trabajadores/tipos";
import { trabajadorSchema, type DatosTrabajador, type EntradaTrabajador } from "@/modulos/trabajadores/validaciones/trabajador.schema";
import { SeccionContacto } from "./seccion-contacto";
import { SeccionDatosLaborales } from "./seccion-datos-laborales";
import { SeccionDatosPersonales } from "./seccion-datos-personales";

function iniciales(trabajador: TrabajadorDetalle | undefined): EntradaTrabajador {
  return {
    vinculoId: trabajador ? (trabajador.vinculos.find((item) => item.activa)?.id ?? trabajador.vinculos[0]?.id ?? "") : "",
    tipoDocumento: trabajador?.tipoDocumento ?? "CEDULA",
    numeroDocumento: trabajador?.numeroDocumento ?? "",
    nombres: trabajador?.nombres ?? "",
    apellidos: trabajador?.apellidos ?? "",
    fechaNacimiento: trabajador?.fechaNacimiento ?? "",
    sexo: trabajador?.sexo ?? "NO_ESPECIFICADO",
    telefono: trabajador?.telefono ?? "",
    correo: trabajador?.correo ?? "",
    direccion: trabajador?.direccion ?? "",
    puestoLaboral: trabajador?.puestoLaboral ?? "",
    estadoLaboral: trabajador?.estadoLaboral ?? "ACTIVO",
    empresaId: trabajador?.empresaId ?? "",
    departamentoId: trabajador?.departamentoId ?? "",
  };
}

export function FormularioTrabajador({ catalogo, trabajador }: { catalogo: CatalogoOrganizacional; trabajador?: TrabajadorDetalle }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const valoresIniciales = useMemo(() => iniciales(trabajador), [trabajador]);
  const { register, handleSubmit, control, setValue, getValues, reset, setError, formState: { errors } } = useForm<EntradaTrabajador, unknown, DatosTrabajador>({ resolver: zodResolver(trabajadorSchema), defaultValues: valoresIniciales });
  const empresaId = useWatch({ control, name: "empresaId" });
  const departamentos = useMemo(() => catalogo.departamentos.filter((item) => item.empresaId === empresaId), [catalogo.departamentos, empresaId]);
  useEffect(() => {
    reset(valoresIniciales);
  }, [reset, valoresIniciales]);
  useEffect(() => {
    const departamentoActual = getValues("departamentoId");
    if (departamentoActual && !departamentos.some((item) => item.id === departamentoActual)) {
      setValue("departamentoId", "");
    }
  }, [departamentos, getValues, setValue]);
  const enviar = handleSubmit((datos) => iniciar(async () => {
    setErrorGeneral(undefined);
    const resultado = trabajador ? await editarTrabajadorAccion(trabajador.id, datos) : await crearTrabajadorAccion(datos);
    if (!resultado.exito) { setErrorGeneral(resultado.mensaje); for (const [campo, mensajes] of Object.entries(resultado.erroresCampos ?? {})) setError(campo as keyof EntradaTrabajador, { message: mensajes[0] }); return; }
    router.push(`/trabajadores/${resultado.datos?.id}`); router.refresh();
  }));

  return <form onSubmit={enviar} className="space-y-6 pb-56 sm:pb-28" noValidate>
    <input type="hidden" {...register("vinculoId")} />
    {errorGeneral && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errorGeneral}</div>}
    <SeccionDatosPersonales register={register} errors={errors} />
    <SeccionContacto register={register} errors={errors} />
    <SeccionDatosLaborales register={register} errors={errors} empresaId={empresaId} empresas={catalogo.empresas} departamentos={departamentos} modoEdicion={Boolean(trabajador)} />
    <BarraAccionesFormulario
      cancelar={<Button type="button" variant="outline" onClick={() => router.back()} disabled={pendiente}>Cancelar</Button>}
      principal={<Button type="submit" disabled={pendiente}>{!pendiente && !trabajador && <Plus aria-hidden />}{pendiente ? "Guardando…" : trabajador ? "Guardar cambios" : "Crear trabajador y vínculo"}</Button>}
    />
  </form>;
}
