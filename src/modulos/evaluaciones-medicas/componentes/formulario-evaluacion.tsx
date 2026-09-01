"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Trash2 } from "lucide-react";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Button } from "@/componentes/ui/button";
import { BarraAccionesFormulario } from "@/componentes/formularios/barra-acciones-formulario";
import { useProteccionSalida } from "@/componentes/formularios/use-proteccion-salida";
import { useToastGuardado } from "@/componentes/retroalimentacion/toast-guardado";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";
import { AlertaAlergias } from "@/modulos/evaluaciones-medicas/componentes/alerta-alergias";
import type { ContextoEvaluacionDto } from "@/modulos/evaluaciones-medicas/tipos";
import type { MedicamentoInventarioBusquedaDto } from "@/modulos/inventario/tipos";
import { etiquetaUnidadInventario } from "@/modulos/inventario/constantes";
import { coincideAlergiaMedicamento } from "@/modulos/evaluaciones-medicas/utilidades/normalizar-sustancia";
import { evaluacionBorradorSchema, evaluacionFinalizarSchema, type EntradaEvaluacion, type DatosEvaluacion } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";
import { buscarMedicamentosEvaluacionAccion, crearEvaluacionAccion, guardarEvaluacionAccion, finalizarEvaluacionAccion } from "@/modulos/evaluaciones-medicas/acciones/evaluaciones.acciones";
import { BuscadorCie10 } from "@/modulos/catalogo-cie10/componentes/buscador-cie10";
import { CampoMorbilidad } from "@/modulos/morbilidades/componentes/campo-morbilidad";

function Campo({etiqueta,error,required:req,children}:{etiqueta:string;error?:string;required?:boolean;children:React.ReactNode}){return <label className="grid gap-1 text-sm font-medium"><EtiquetaCampo etiqueta={etiqueta} required={req} />{children}{error&&<span className="text-xs text-destructive">{error}</span>}</label>}

export function FormularioEvaluacion({contexto,valores,evaluacionId}:{contexto:ContextoEvaluacionDto;valores:EntradaEvaluacion;evaluacionId?:string}){
 const router=useRouter();
 const [pendiente,iniciar]=useTransition();const [mensaje,setMensaje]=useState("");const {mostrar:mostrarGuardado}=useToastGuardado();
 const [busquedaMedicamento,setBusquedaMedicamento]=useState("");
 const [resultadosMedicamentos,setResultadosMedicamentos]=useState<MedicamentoInventarioBusquedaDto[]>([]);
 const form=useForm<EntradaEvaluacion,unknown,DatosEvaluacion>({resolver:zodResolver(evaluacionBorradorSchema),defaultValues:valores});
 const diagnosticos=useFieldArray({control:form.control,name:"diagnosticos"});const medicamentos=useFieldArray({control:form.control,name:"medicamentos"});
 const diagnosticosActuales=useWatch({control:form.control,name:"diagnosticos"})??[];
 const medicamentosActuales=useWatch({control:form.control,name:"medicamentos"})??[];
 const alergiasMedicamentos=useMemo(()=>contexto.alergias.filter(a=>a.tipo==="MEDICAMENTO"),[contexto.alergias]);

 useEffect(()=>{
  if(busquedaMedicamento.trim().length<2)return;
  const temporizador=setTimeout(async()=>setResultadosMedicamentos(await buscarMedicamentosEvaluacionAccion(busquedaMedicamento)),300);
  return()=>clearTimeout(temporizador);
 },[busquedaMedicamento]);

 function agregarMedicamento(item:MedicamentoInventarioBusquedaDto){
  const existentes=form.getValues("medicamentos")??[];
  if(existentes.some(medicamento=>medicamento.nombreGenerico===item.nombre&&medicamento.presentacion===etiquetaUnidadInventario(item.unidad))){
   setMensaje("Ese medicamento ya fue agregado a la evaluación.");return;
  }
  medicamentos.append({nombreGenerico:item.nombre,nombreComercial:"",presentacion:etiquetaUnidadInventario(item.unidad),cantidad:1,dosis:"",frecuencia:"",duracion:"",viaAdministracion:"",indicaciones:"",alertaAlergiaConfirmada:false,justificacionAlergia:"",origen:"EVALUACION"});
  setBusquedaMedicamento("");setResultadosMedicamentos([]);setMensaje("");
 }
 
 const errores=form.formState.errors;
 const enviar=(finalizar:boolean)=>form.handleSubmit((datos)=>iniciar(async()=>{setMensaje("");if(finalizar){const completo=evaluacionFinalizarSchema.safeParse(datos);if(!completo.success){for(const issue of completo.error.issues){const campo=issue.path.join(".") as keyof EntradaEvaluacion;form.setError(campo,{message:issue.message})}setMensaje("Complete los campos obligatorios para finalizar.");return}}
   const r=finalizar?await finalizarEvaluacionAccion(evaluacionId??null,datos):evaluacionId?await guardarEvaluacionAccion(evaluacionId,datos):await crearEvaluacionAccion(datos);
    if(!r.exito){setMensaje(r.mensaje);for(const[c,m]of Object.entries(r.erroresCampos??{}))form.setError(c as keyof EntradaEvaluacion,{message:m[0]});return}const id=r.datos?.id;if(!id)return;form.reset(datos);mostrarGuardado(finalizar?"Evaluación finalizada":"Borrador guardado");router.push(finalizar?`/evaluaciones-medicas/${id}`:`/evaluaciones-medicas/${id}/editar?guardado=1`)}))();
  useProteccionSalida(form.formState.isDirty);
 return <form className="space-y-5 pb-56 sm:pb-28" onSubmit={e=>e.preventDefault()} noValidate>
  <AlertaAlergias alergias={contexto.alergias}/>
  <Card><CardHeader><CardTitle>A. Datos generales</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><p><b>Trabajador:</b> {contexto.trabajador.nombre}</p><p><b>Documento:</b> {contexto.trabajador.documento}</p><p><b>Sexo:</b> {contexto.trabajador.sexo}</p><p><b>Fecha de nacimiento:</b> {contexto.trabajador.fechaNacimiento??"—"}</p><p><b>Empresa:</b> {contexto.asignacion.empresa}</p><p><b>Departamento:</b> {contexto.asignacion.departamento}</p><Campo etiqueta="Fecha de atención" required error={errores.fechaAtencion?.message}><Input type="date" required aria-required="true" aria-invalid={Boolean(errores.fechaAtencion)} {...form.register("fechaAtencion")}/></Campo><Campo etiqueta="Profesional responsable" required error={errores.profesionalResponsable?.message}><Input readOnly aria-readonly="true" required aria-required="true" aria-invalid={Boolean(errores.profesionalResponsable)} {...form.register("profesionalResponsable")}/></Campo></CardContent></Card>
  <Card><CardHeader><CardTitle>B. Motivo</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><CampoMorbilidad form={form} name="morbilidad" etiqueta="Morbilidad" requerido error={errores.morbilidad?.message} placeholder="Escriba la morbilidad (ej. Dolor abdominal)" /><Campo etiqueta="Motivo de consulta" required error={errores.motivoConsulta?.message}><Textarea required aria-required="true" aria-invalid={Boolean(errores.motivoConsulta)} {...form.register("motivoConsulta")}/></Campo><Campo etiqueta="Síntomas"><Textarea {...form.register("sintomas")}/></Campo><Campo etiqueta="Tiempo de evolución"><Input {...form.register("tiempoEvolucion")}/></Campo><Campo etiqueta="Observaciones"><Textarea {...form.register("observacionesMotivo")}/></Campo></CardContent></Card>
  <Card><CardHeader><CardTitle>C. Evaluación</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">{([['temperatura','Temperatura'],['presionArterial','Presión arterial'],['frecuenciaCardiaca','F. cardiaca'],['frecuenciaRespiratoria','F. respiratoria'],['saturacionOxigeno','Saturación'],['peso','Peso'],['talla','Talla']] as const).map(([n,l])=><Campo key={n} etiqueta={l}><Input type={n==='presionArterial'?'text':'number'} step="any" {...form.register(n)}/></Campo>)}</div><Campo etiqueta="Antecedentes relevantes"><Textarea {...form.register("antecedentesRelevantes")}/></Campo><Campo etiqueta="Examen físico" required error={errores.examenFisico?.message}><Textarea required aria-required="true" aria-invalid={Boolean(errores.examenFisico)} {...form.register("examenFisico")}/></Campo><Campo etiqueta="Observaciones clínicas"><Textarea {...form.register("observacionesClinicas")}/></Campo></CardContent></Card>
  <Card><CardHeader><CardTitle>D. Diagnóstico</CardTitle></CardHeader><CardContent className="space-y-3"><BuscadorCie10 onSeleccionar={(r) => {if(!(form.getValues("diagnosticos")??[]).some(d=>d.enfermedadId===r.id))diagnosticos.append({enfermedadId:r.id,codigo:r.codigo,descripcion:r.descripcion,pre:true,def:false})}} />{diagnosticos.fields.map((d,i)=><div className="flex flex-wrap items-center gap-2 rounded border p-2" key={d.id}><span className="flex-1">{d.codigo} — {d.descripcion}</span><Button type="button" size="sm" variant={diagnosticosActuales[i]?.pre?"default":"outline"} onClick={()=>{form.setValue(`diagnosticos.${i}.pre`,true);form.setValue(`diagnosticos.${i}.def`,false)}}>PRE</Button><Button type="button" size="sm" variant={diagnosticosActuales[i]?.def?"default":"outline"} onClick={()=>{form.setValue(`diagnosticos.${i}.pre`,false);form.setValue(`diagnosticos.${i}.def`,true)}}>DEF</Button><Button type="button" size="icon" variant="ghost" onClick={()=>diagnosticos.remove(i)} aria-label="Eliminar diagnóstico"><Trash2/></Button></div>)}{errores.diagnosticos?.message&&<p className="text-sm text-destructive">{errores.diagnosticos.message}</p>}<Campo etiqueta="Observaciones diagnósticas"><Textarea {...form.register("observacionesDiagnostico")}/></Campo></CardContent></Card>
  <Card><CardHeader><CardTitle>E. Tratamiento</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Campo etiqueta="Indicaciones"><Textarea {...form.register("indicaciones")}/></Campo><Campo etiqueta="Recomendaciones"><Textarea {...form.register("recomendaciones")}/></Campo><Campo etiqueta="Días de reposo"><Input type="number" {...form.register("reposoDias")}/></Campo><Campo etiqueta="Seguimiento"><Input {...form.register("seguimiento")}/></Campo><Campo etiqueta="Próxima consulta"><Input type="date" {...form.register("proximaConsulta")}/></Campo></CardContent></Card>
  <Card className="overflow-visible">
   <CardHeader>
    <CardTitle>F. Medicamentos</CardTitle>
   </CardHeader>
   <CardContent className="space-y-4">
    <div className="space-y-2">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <EtiquetaCampo etiqueta="Medicamentos indicados" />
      <span className="text-xs text-muted-foreground">Solo se registra en la evaluación. No descuenta inventario.</span>
     </div>
     <div className="relative z-20">
      <Search aria-hidden className="absolute left-3 top-3 size-4 text-muted-foreground" />
      <Input className="pl-9" value={busquedaMedicamento} onChange={evento=>{const valor=evento.target.value;setBusquedaMedicamento(valor);if(valor.trim().length<2)setResultadosMedicamentos([])}} placeholder="Buscar medicamento" />
      {busquedaMedicamento.trim().length>=2&&resultadosMedicamentos.length>0&&(
       <div role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
        {resultadosMedicamentos.map(item=>(
         <button key={item.id} type="button" role="option" aria-selected="false" className="flex min-h-11 w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent" onClick={()=>agregarMedicamento(item)}>
          <span className="font-medium">{item.nombre}</span>
          <span className="text-muted-foreground">{etiquetaUnidadInventario(item.unidad)}</span>
         </button>
        ))}
       </div>
      )}
     </div>
    </div>
    <div className="space-y-2">
     {medicamentos.fields.map((medicamento,i)=>{
      const actual=medicamentosActuales[i];
      const alerta=alergiasMedicamentos.find(a=>coincideAlergiaMedicamento(actual?.nombreGenerico??"",a.sustancia));
      return <div className="space-y-3 rounded-lg border bg-muted/10 p-3" key={medicamento.id}>
       <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
        <div className="space-y-2">
         {actual?.origen==="REGISTRO_DIARIO"&&<p className="text-xs font-medium text-primary">Precargado desde el registro diario</p>}
         <Campo etiqueta="Nombre" required error={errores.medicamentos?.[i]?.nombreGenerico?.message}><Input {...form.register(`medicamentos.${i}.nombreGenerico`)}/></Campo>
         <p className="text-xs text-muted-foreground">Unidad: {actual?.presentacion??"—"}</p>
         <input type="hidden" {...form.register(`medicamentos.${i}.nombreComercial`)}/>
         <input type="hidden" {...form.register(`medicamentos.${i}.presentacion`)}/>
         <input type="hidden" {...form.register(`medicamentos.${i}.frecuencia`)}/>
         <input type="hidden" {...form.register(`medicamentos.${i}.duracion`)}/>
         <input type="hidden" {...form.register(`medicamentos.${i}.origen`)}/>
        </div>
        <Campo etiqueta={actual?.origen==="REGISTRO_DIARIO"?"Cantidad entregada":"Cantidad"} required error={errores.medicamentos?.[i]?.cantidad?.message}>
         <Input type="number" min="1" step="1" {...form.register(`medicamentos.${i}.cantidad`)}/>
        </Campo>
        <Button type="button" variant="ghost" size="sm" onClick={()=>medicamentos.remove(i)}><Trash2 className="size-4"/> Quitar</Button>
       </div>
       <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Dosis"><Input placeholder="Ej. 1 tableta cada 8 horas" {...form.register(`medicamentos.${i}.dosis`)}/></Campo>
        <Campo etiqueta="Vía"><Input placeholder="Ej. Oral" {...form.register(`medicamentos.${i}.viaAdministracion`)}/></Campo>
       </div>
       <Campo etiqueta="Indicaciones opcionales"><Input {...form.register(`medicamentos.${i}.indicaciones`)}/></Campo>
       {alerta&&<div role="alert" className="space-y-2 rounded border border-red-500 bg-red-500/10 p-3 text-sm"><b>Alerta: alergia {alerta.severidad.toLowerCase()} a {alerta.sustancia}.</b><label className="flex gap-2"><input type="checkbox" {...form.register(`medicamentos.${i}.alertaAlergiaConfirmada`)}/>Confirmo continuar bajo criterio clínico.</label><Campo etiqueta="Justificación clínica" error={errores.medicamentos?.[i]?.justificacionAlergia?.message}><Textarea {...form.register(`medicamentos.${i}.justificacionAlergia`)}/></Campo></div>}
      </div>;
     })}
     {medicamentos.fields.length===0&&<p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No hay medicamentos indicados.</p>}
    </div>
   </CardContent>
  </Card>
  {mensaje&&<p role="alert" className="text-sm text-destructive">{mensaje}</p>}<BarraAccionesFormulario rutaRegreso="/evaluaciones-medicas" cancelar={<Button type="button" variant="ghost" onClick={()=>history.back()}>Cancelar</Button>} secundario={<Button type="button" variant="outline" disabled={pendiente} onClick={()=>enviar(false)}>Guardar borrador</Button>} principal={<Button type="button" disabled={pendiente} onClick={()=>enviar(true)}>Finalizar evaluación</Button>} /></form>
}
