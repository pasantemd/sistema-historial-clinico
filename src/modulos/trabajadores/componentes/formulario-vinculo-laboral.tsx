"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { CampoError } from "@/componentes/formularios/campo-error";
import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Label } from "@/componentes/ui/label";
import { crearVinculoLaboralAccion } from "@/modulos/trabajadores/acciones/trabajadores.acciones";
import type { CatalogoOrganizacional } from "@/modulos/trabajadores/tipos";
import {
  nuevoVinculoLaboralSchema,
  type DatosNuevoVinculoLaboral,
  type EntradaNuevoVinculoLaboral,
} from "@/modulos/trabajadores/validaciones/trabajador.schema";

const selector = "min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50";

export function FormularioVinculoLaboral({ trabajadorId, catalogo }: { trabajadorId: string; catalogo: CatalogoOrganizacional }) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const { register, handleSubmit, control, setValue, setError, formState: { errors } } = useForm<EntradaNuevoVinculoLaboral, unknown, DatosNuevoVinculoLaboral>({
    resolver: zodResolver(nuevoVinculoLaboralSchema),
    defaultValues: { trabajadorId, empresaId: "", departamentoId: "" },
  });
  const empresaId = useWatch({ control, name: "empresaId" });
  const departamentos = useMemo(
    () => catalogo.departamentos.filter((item) => item.empresaId === empresaId),
    [catalogo.departamentos, empresaId],
  );
  useEffect(() => setValue("departamentoId", ""), [empresaId, setValue]);

  const enviar = handleSubmit((datos) => {
    setErrorGeneral(undefined);
    iniciarTransicion(async () => {
      const resultado = await crearVinculoLaboralAccion(datos);
      if (!resultado.exito) {
        setErrorGeneral(resultado.mensaje);
        for (const [campo, mensajes] of Object.entries(resultado.erroresCampos ?? {})) {
          setError(campo as keyof EntradaNuevoVinculoLaboral, { message: mensajes[0] });
        }
        return;
      }
      router.push(`/trabajadores/${trabajadorId}`);
      router.refresh();
    });
  });

  return <form onSubmit={enviar} className="space-y-6" noValidate>
    <input type="hidden" {...register("trabajadorId")} />
    {errorGeneral && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errorGeneral}</div>}
    <Card>
      <CardHeader><CardTitle>Nueva asignación laboral</CardTitle></CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="empresaId"><EtiquetaCampo etiqueta="Empresa" required /></Label><select id="empresaId" className={selector} {...register("empresaId")}><option value="">Seleccione una empresa</option>{catalogo.empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.razonSocial}</option>)}</select><CampoError mensaje={errors.empresaId?.message} /></div>
        <div className="space-y-2"><Label htmlFor="departamentoId"><EtiquetaCampo etiqueta="Departamento" required /></Label><select id="departamentoId" className={selector} disabled={!empresaId} {...register("departamentoId")}><option value="">{empresaId ? "Seleccione un departamento" : "Seleccione primero una empresa"}</option>{departamentos.map((departamento) => <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>)}</select><CampoError mensaje={errors.departamentoId?.message} /></div>
      </CardContent>
    </Card>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => router.back()} disabled={pendiente}>Cancelar</Button><Button type="submit" disabled={pendiente}>{pendiente ? "Guardando…" : "Cambiar asignación laboral"}</Button></div>
  </form>;
}
