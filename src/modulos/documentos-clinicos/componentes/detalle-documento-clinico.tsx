"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { anularDocumentoClinicoAccion } from "@/modulos/documentos-clinicos/acciones/documentos-clinicos.acciones";
import type { DocumentoClinicoDetalleDto } from "@/modulos/documentos-clinicos/tipos";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { EnlacePdf } from "@/componentes/documentos/enlace-pdf";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
export function DetalleDocumentoClinico({ documento }: { documento: DocumentoClinicoDetalleDto }) {
  const [mensaje, setMensaje] = useState("");
  const [pendiente, iniciar] = useTransition();
  return (
    <div className="space-y-6 print:bg-white print:text-black">
      <EncabezadoPagina
        titulo={`Documento clínico ${documento.numeroDocumento}`}
        descripcion={`${documento.trabajador} · ${formatearFecha(documento.fecha)}`}
        acciones={
          <div className="flex flex-wrap gap-2 print:hidden">
            <BotonRegresar rutaRespaldo="/documentos-clinicos" />
            {documento.estado === "BORRADOR" && <Link href={`/documentos-clinicos/${documento.id}/editar`} className={cn(buttonVariants())}>Editar</Link>}
            <EnlacePdf ruta={`/api/documentos-clinicos/${documento.id}/pdf`} className={cn(buttonVariants({ variant: "outline" }))}>Ver / Imprimir PDF</EnlacePdf>
            {documento.estado !== "ANULADO" && (
              <Button variant="destructive" disabled={pendiente} onClick={() => {
                const motivo = prompt("Motivo de anulación");
                if (!motivo) return;
                iniciar(async () => {
                  const r = await anularDocumentoClinicoAccion(documento.id, motivo);
                  if (!r.exito) setMensaje(r.mensaje ?? "No se pudo anular.");
                  else location.reload();
                });
              }}>Anular</Button>
            )}
          </div>
        }
      />
      {mensaje && <p role="alert" className="text-destructive">{mensaje}</p>}
      <Card className="print:rounded-none print:border-black">
        <CardHeader><CardTitle>Datos</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <p><b>Trabajador</b><br />{documento.trabajador}</p>
          <p><b>Cédula</b><br />{documento.documento}</p>
          <p><b>Fecha de nacimiento</b><br />{documento.fechaNacimiento ? formatearFecha(documento.fechaNacimiento) : "—"}</p>
          <p><b>Fecha</b><br />{formatearFecha(documento.fecha)}</p>
          <p><b>Empresa</b><br />{documento.empresa}</p>
          <p><b>Departamento</b><br />{documento.departamento ?? "—"}</p>
          <p><b>Profesional</b><br />{documento.profesional ?? "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Detalle de evolución</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><b>Motivo de consulta:</b><br />{documento.motivoConsulta ?? "—"}</p>
          <p><b>Evolución:</b><br />{documento.evolucion ?? "—"}</p>
          <p><b>Observaciones:</b><br />{documento.observaciones ?? "—"}</p>
        </CardContent>
      </Card>
      {documento.diagnosticos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Diagnósticos</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {documento.diagnosticos.map((dx) => (
                <li key={dx.id}>{dx.codigo} — {dx.descripcion} {dx.observacion ? `(${dx.observacion})` : ""}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {documento.tratamientos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Tratamiento</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {documento.tratamientos.map((t) => (
              <div key={t.id} className="rounded border p-3">
                <p><b>{t.nombre}</b> {t.concentracion ? `— ${t.concentracion}` : ""}</p>
                <p className="text-sm text-muted-foreground">{t.dosis} · {t.cantidad} · {t.frecuencia ?? "—"} · {t.via ?? "—"}</p>
                {t.indicaciones && <p className="text-sm">{t.indicaciones}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
