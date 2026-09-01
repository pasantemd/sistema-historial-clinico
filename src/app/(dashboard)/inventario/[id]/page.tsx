import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, FileDown } from "lucide-react";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { Badge } from "@/componentes/ui/badge";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { consultarMedicamentoInventario } from "@/modulos/inventario/consultas/inventario.consulta";
import { etiquetaUnidadInventario, etiquetaMovimiento, PERMISOS_INVENTARIO } from "@/modulos/inventario/constantes";
import { DialogoAgregarCantidad } from "@/modulos/inventario/componentes/dialogo-agregar-cantidad";
import { DialogoCambiarEstadoInventario } from "@/modulos/inventario/componentes/dialogo-cambiar-estado-inventario";
import { DialogoEliminarCantidad } from "@/modulos/inventario/componentes/dialogo-eliminar-cantidad";
import { EstadoCaducidad } from "@/modulos/inventario/componentes/estado-caducidad";
import { clasificarCaducidad } from "@/modulos/inventario/servicios/clasificar-caducidad";
import { EnlacePdf } from "@/componentes/documentos/enlace-pdf";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { cn } from "@/utilidades/clases";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requerirPermiso(PERMISOS_INVENTARIO.ver);
  const { id } = await params;
  const medicamento = await consultarMedicamentoInventario(id);
  if (!medicamento) notFound();
  const puedeEditar = tienePermiso(usuario, PERMISOS_INVENTARIO.editar);
  const puedeMovimiento = tienePermiso(usuario, PERMISOS_INVENTARIO.movimiento);
  const puedeDesactivar = tienePermiso(usuario, PERMISOS_INVENTARIO.desactivar);
  const activo = medicamento.estado === "ACTIVO";
  const unidad = etiquetaUnidadInventario(medicamento.unidad);
  const estadoCaducidad = clasificarCaducidad(medicamento.fechaCaducidad);
  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/inventario" />
      <Migas />
      <EncabezadoPagina
        titulo={medicamento.nombre}
        descripcion="Detalle de inventario y movimientos."
      />
      {estadoCaducidad === "ROJO" && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-sm font-medium text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>Aviso: Este medicamento está a punto de vencer ({formatearFechaCivil(medicamento.fechaCaducidad!)}).</span>
        </div>
      )}
      {estadoCaducidad === "VENCIDO" && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-sm font-medium text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>Aviso: Este medicamento se encuentra vencido ({formatearFechaCivil(medicamento.fechaCaducidad!)}).</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <EnlacePdf
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          ruta={`/api/inventario/${id}/movimientos/pdf`}
        >
          <FileDown className="size-4" />
          Ver / imprimir movimientos PDF
        </EnlacePdf>
        {puedeEditar && (
          <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`/inventario/${id}/editar`}>
            Editar
          </Link>
        )}
        {puedeMovimiento && activo && (
          <DialogoAgregarCantidad
            medicamentoId={id}
            nombre={medicamento.nombre}
            cantidadDisponible={medicamento.cantidadDisponible}
            unidad={unidad}
          />
        )}
        {puedeMovimiento && activo && Number(medicamento.cantidadDisponible) > 0 && (
          <DialogoEliminarCantidad
            medicamentoId={id}
            nombre={medicamento.nombre}
            cantidadDisponible={medicamento.cantidadDisponible}
            unidad={unidad}
          />
        )}
        {puedeDesactivar && (
          <DialogoCambiarEstadoInventario
            medicamentoId={id}
            nombre={medicamento.nombre}
            activar={!activo}
          />
        )}
      </div>
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Cantidad disponible" valor={medicamento.cantidadDisponible} />
          <Dato etiqueta="Unidad" valor={unidad} />
          <Dato etiqueta="Fecha de caducidad" valor={<EstadoCaducidad fecha={medicamento.fechaCaducidad} />} />
          <Dato etiqueta="Estado" valor={<Badge>{medicamento.estado === "ACTIVO" ? "Activo" : "Inactivo"}</Badge>} />
          <Dato etiqueta="Observaciones" valor={medicamento.observaciones ?? "—"} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Entregas a trabajadores</CardTitle>
        </CardHeader>
        <CardContent>
          {medicamento.entregas.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Este medicamento todavía no registra entregas a trabajadores.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="pr-3">Trabajador</th>
                    <th className="pr-3">Cédula</th>
                    <th className="pr-3">Empresa</th>
                    <th className="pr-3">Concepto</th>
                    <th className="pr-3">Responsable</th>
                    <th className="text-right">Cantidad entregada</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {medicamento.entregas.map((entrega) => (
                    <tr key={entrega.id}>
                      <td className="py-3 pr-3 tabular-nums">{formatearFechaCivil(entrega.diaAtencion)}</td>
                      <td className="pr-3 font-medium">{entrega.trabajador}</td>
                      <td className="pr-3 tabular-nums">{entrega.cedula}</td>
                      <td className="pr-3">{entrega.empresa}</td>
                      <td className="pr-3">
                        <Link className="font-medium text-primary hover:underline" href={`/registro-diario/${entrega.registroDiarioId}`}>
                          {entrega.concepto}
                        </Link>
                      </td>
                      <td className="pr-3">{entrega.responsable}</td>
                      <td className="text-right font-semibold tabular-nums">
                        {entrega.cantidadEntregada} {entrega.unidad.toLocaleLowerCase("es")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Historial de movimientos</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Fecha y hora</th><th>Movimiento</th><th>Cantidad</th><th>Anterior</th><th>Posterior</th><th>Destinatario</th><th>Concepto</th><th>Motivo</th><th>Responsable</th></tr>
              </thead>
              <tbody className="divide-y">
                {medicamento.movimientos.map((movimiento) => (
                  <tr key={movimiento.id}>
                    <td className="py-2">{movimiento.creadoEn.slice(0, 10)}</td>
                    <td>{etiquetaMovimiento(movimiento.tipoMovimiento)}</td>
                    <td>{movimiento.cantidad}</td>
                    <td>{movimiento.cantidadAnterior}</td>
                    <td>{movimiento.cantidadPosterior}</td>
                    <td>{movimiento.destinatario ?? "—"}</td>
                    <td>{movimiento.concepto}</td>
                    <td>{movimiento.motivo}</td>
                    <td>{movimiento.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return <div><p className="text-xs font-medium uppercase text-muted-foreground">{etiqueta}</p><div className="mt-1 font-medium">{valor}</div></div>;
}

const FORMATEADOR_FECHA_CIVIL = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatearFechaCivil(fecha: string): string {
  return FORMATEADOR_FECHA_CIVIL.format(new Date(`${fecha}T00:00:00.000Z`));
}
