"use client";

import Link from "next/link";
import { Download, Eye, FileSpreadsheet } from "lucide-react";
import { AcordeonItem } from "@/componentes/elemento-acordeon";
import { SeccionColapsable } from "@/componentes/seccion-colapsable";
import { Badge } from "@/componentes/ui/badge";
import { buttonVariants } from "@/componentes/ui/button";
import type { GrupoHistorialClinicoDto } from "@/modulos/trabajadores/tipos/historial-clinico";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

export function HistorialClinicoColapsable({ grupos }: { grupos: GrupoHistorialClinicoDto[] }) {
  if (grupos.length === 0) return <p className="text-sm text-muted-foreground">No existen documentos clínicos visibles para este trabajador.</p>;
  return <SeccionColapsable titulo="Historial clínico" cantidad={grupos.length} defaultOpen>
    <div className="space-y-3">{grupos.map((grupo) => <AcordeonItem key={grupo.clave} resumen={<span className="font-medium">{grupo.fecha ? formatearFecha(grupo.fecha) : "Sin fecha clínica"} <span className="text-muted-foreground">· {grupo.documentos.length} documento(s)</span></span>}>
      <ul className="space-y-3">{grupo.documentos.map((documento) => <li key={`${documento.tipo}-${documento.id}`} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-medium">{documento.etiqueta} · {documento.numero}</p><p className="text-sm text-muted-foreground">{documento.empresa} · {documento.profesional ?? "Sin profesional"}</p><Badge variant={documento.estado === "ANULADO" || documento.estado === "ANULADA" ? "destructive" : "secondary"}>{documento.estado}</Badge></div>
        <div className="flex flex-wrap gap-2"><Link href={documento.ruta} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><Eye aria-hidden /> Ver</Link>{documento.rutaPdf && <Link href={documento.rutaPdf} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><Download aria-hidden /> PDF</Link>}{documento.rutaExcel && <Link href={documento.rutaExcel} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><FileSpreadsheet aria-hidden /> Excel</Link>}</div>
      </li>)}</ul>
    </AcordeonItem>)}</div>
  </SeccionColapsable>;
}
