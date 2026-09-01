"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Button } from "@/componentes/ui/button";
import { Card, CardContent } from "@/componentes/ui/card";
import { CampoError } from "@/componentes/formularios/campo-error";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Textarea } from "@/componentes/ui/textarea";
import { crearDepartamentoAccion, editarDepartamentoAccion } from "@/modulos/departamentos/acciones/departamentos.acciones";
import { departamentoSchema, type DatosDepartamento, type EntradaDepartamento } from "@/modulos/departamentos/validaciones/departamento.schema";

const selector = "min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20";
type Empresa = { id: string; razonSocial: string };
type Departamento = { id: string; empresaId: string; nombre: string; descripcion: string | null };

export function FormularioDepartamento({ empresas, departamento }: { empresas: Empresa[]; departamento?: Departamento }) {
  const router = useRouter(); const [errorGeneral, setErrorGeneral] = useState<string>(); const [pendiente, iniciar] = useTransition();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<EntradaDepartamento, unknown, DatosDepartamento>({ resolver: zodResolver(departamentoSchema), defaultValues: { empresaId: departamento?.empresaId ?? empresas[0]?.id ?? "", nombre: departamento?.nombre ?? "", descripcion: departamento?.descripcion ?? "" } });
  const enviar = handleSubmit((datos) => iniciar(async () => { const resultado = departamento ? await editarDepartamentoAccion(departamento.id, datos) : await crearDepartamentoAccion(datos); if (!resultado.exito) { setErrorGeneral(resultado.mensaje); for (const [campo, mensajes] of Object.entries(resultado.erroresCampos ?? {})) setError(campo as keyof EntradaDepartamento, { message: mensajes[0] }); return; } router.push("/configuracion/departamentos"); router.refresh(); }));
  return <form onSubmit={enviar} className="space-y-6" noValidate>{errorGeneral&&<div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errorGeneral}</div>}<Card><CardContent className="space-y-4 pt-6"><div className="space-y-2"><Label htmlFor="empresaId"><EtiquetaCampo etiqueta="Empresa" required /></Label><select id="empresaId" className={selector} {...register("empresaId")}><option value="">Seleccione</option>{empresas.map((empresa)=><option key={empresa.id} value={empresa.id}>{empresa.razonSocial}</option>)}</select><CampoError mensaje={errors.empresaId?.message}/></div><div className="space-y-2"><Label htmlFor="nombre"><EtiquetaCampo etiqueta="Nombre" required /></Label><Input id="nombre" {...register("nombre")}/><CampoError mensaje={errors.nombre?.message}/></div><div className="space-y-2"><Label htmlFor="descripcion">Descripción</Label><Textarea id="descripcion" {...register("descripcion")}/><CampoError mensaje={errors.descripcion?.message}/></div></CardContent></Card><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>router.back()}>Cancelar</Button><Button disabled={pendiente}>{!pendiente&&!departamento&&<Plus aria-hidden />}{pendiente?"Guardando…":departamento?"Guardar cambios":"Crear departamento"}</Button></div></form>;
}
