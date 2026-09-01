"use client";
import { useState, useTransition } from "react";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { anularEvaluacionAccion } from "@/modulos/evaluaciones-medicas/acciones/evaluaciones.acciones";
export function BotonAnularEvaluacion({id}:{id:string}){const[abierto,setAbierto]=useState(false);const[motivo,setMotivo]=useState("");const[mensaje,setMensaje]=useState("");const[p,iniciar]=useTransition();if(!abierto)return <Button variant="destructive" onClick={()=>setAbierto(true)}>Anular</Button>;return <div className="flex flex-wrap gap-2"><Input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Motivo obligatorio"/><Button disabled={p} variant="destructive" onClick={()=>iniciar(async()=>{const r=await anularEvaluacionAccion(id,motivo);if(!r.exito){setMensaje(r.mensaje);return}location.reload()})}>Confirmar anulación</Button>{mensaje&&<p className="w-full text-sm text-destructive">{mensaje}</p>}</div>}
