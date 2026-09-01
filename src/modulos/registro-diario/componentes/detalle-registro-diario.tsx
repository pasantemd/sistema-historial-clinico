import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/componentes/ui/badge";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import type { RegistroDiarioDetalleDto } from "@/modulos/registro-diario/tipos";
import { BotonAnularRegistro } from "@/modulos/registro-diario/componentes/acciones-registro-diario";
import { cn } from "@/utilidades/clases";
import { EnlacePdf } from "@/componentes/documentos/enlace-pdf";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

export function DetalleRegistroDiario({ registro }: { registro: RegistroDiarioDetalleDto }) {
  const esBorrador = registro.estado === "BORRADOR";
  const origen = `registroDiarioId=${registro.id}&trabajadorId=${registro.trabajadorId}`;
  return <div className="space-y-6 print:bg-white print:text-black">
    <div className="print:hidden"><Migas /></div>
    <EncabezadoPagina titulo={`Registro diario ${registro.numeroRegistro}`} descripcion={`${registro.nombreCompleto} · ${formatearFecha(registro.fechaAtencion)}`} acciones={<div className="flex flex-wrap gap-2 print:hidden">
      <BotonRegresar rutaRespaldo="/registro-diario" />
      {esBorrador && <Link href={`/registro-diario/${registro.id}/editar`} className={cn(buttonVariants({ variant: "outline" }))}>Editar</Link>}
      <EnlacePdf ruta={`/api/registro-diario/${registro.id}/pdf`} className={cn(buttonVariants({ variant: "outline" }))}>Ver / Imprimir PDF</EnlacePdf>
      <a href={`/api/registro-diario/${registro.id}/excel`} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>Descargar Excel</a>
      {esBorrador && <BotonAnularRegistro id={registro.id} />}
    </div>} />
    <div className="flex flex-wrap gap-2 print:hidden">
      <Link href={`/evaluaciones-medicas/nueva?${origen}`} className={cn(buttonVariants())}><Plus aria-hidden /> Crear evaluación médica</Link>
      <Link href={`/fichas-ocupacionales/nueva?${origen}`} className={cn(buttonVariants({ variant: "outline" }))}><Plus aria-hidden /> Crear ficha ocupacional</Link>
      {registro.recetaAsociada ? (
        <Link href={`/recetas/${registro.recetaAsociada.id}`} className={cn(buttonVariants({ variant: "outline" }))}>
          Ver receta
        </Link>
      ) : (
        <Link href={`/recetas/nueva?${origen}`} className={cn(buttonVariants({ variant: "outline" }))}><Plus aria-hidden /> Crear receta</Link>
      )}
    </div>
    {registro.recetaAsociada && (
      <Card className="print:rounded-none print:border-black print:shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">
            Receta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-tight">{registro.recetaAsociada.numeroReceta}</p>
            <p className="text-sm text-muted-foreground">
              Estado: <span className="font-medium text-foreground capitalize">{registro.recetaAsociada.estado.toLowerCase()}</span>
            </p>
          </div>
          <Link
            href={`/recetas/${registro.recetaAsociada.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Ver receta
          </Link>
        </CardContent>
      </Card>
    )}
    <Card className="print:rounded-none print:border-black print:shadow-none"><CardHeader><CardTitle>Datos</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><p><b>Trabajador:</b><br />{registro.nombreCompleto}</p><p><b>Cédula:</b><br />{registro.numeroDocumento}</p><p><b>Fecha de nacimiento:</b><br />{formatearFecha(registro.fechaNacimiento)}</p><p><b>Día de atención:</b><br />{formatearFecha(registro.fechaAtencion)}</p><p><b>Empresa:</b><br />{registro.empresa}</p><p><b>Departamento:</b><br />{registro.departamento ?? "—"}</p><p><b>Profesional:</b><br />{registro.profesional ?? "—"}</p><p><b>Estado:</b><br /><Badge>{registro.estado}</Badge></p></CardContent></Card>
    <Card className="print:rounded-none print:border-black print:shadow-none"><CardContent className="grid gap-5 pt-6 sm:grid-cols-2"><p><b>ATENCIÓN MORBILIDAD</b><br />{registro.atencionMorbilidad}</p><p><b>MEDICACIÓN</b><br />{registro.medicacion ?? "—"}</p><p><b>PROCEDIMIENTO</b><br />{registro.procedimiento ?? "—"}</p><p><b>FIRMA</b><br />{registro.firmaConfirmada ? "CONFIRMADA" : "NO CONFIRMADA"}</p>{registro.observaciones && <p className="sm:col-span-2"><b>OBSERVACIONES</b><br />{registro.observaciones}</p>}</CardContent></Card>
  </div>;
}
