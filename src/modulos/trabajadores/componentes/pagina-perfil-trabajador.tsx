import Link from "next/link";
import { notFound } from "next/navigation";
import { FileHeart, FileText, Link2, Pencil, Plus } from "lucide-react";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { Avatar, AvatarFallback } from "@/componentes/ui/avatar";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { buttonVariants } from "@/componentes/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/componentes/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/componentes/ui/card";
import { EstadoTrabajador } from "@/modulos/trabajadores/componentes/estado-trabajador";
import { SEXOS, TIPOS_DOCUMENTO } from "@/modulos/trabajadores/constantes";
import { consultarTrabajadorPorId } from "@/modulos/trabajadores/consultas/trabajadores.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import { GestionAlergias } from "@/modulos/evaluaciones-medicas/componentes/gestion-alergias";
import { listarAlergias } from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { listarCitasDeTrabajador } from "@/modulos/citas/consultas/citas.consulta";
import { consultarHistorialClinicoTrabajador } from "@/modulos/trabajadores/consultas/historial-clinico.consulta";
import { HistorialClinicoColapsable } from "./historial-clinico-colapsable";
import { PanelCitasColapsable } from "./panel-citas-colapsable";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";

interface Props {
  params: Promise<{ id: string }>;
}

function texto(valor: string | null) {
  return valor || "No registrado";
}
function Dato({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm font-medium">{valor}</dd>
    </div>
  );
}

function Iniciales(nombre: string): string {
  const partes = nombre.split(" ");
  return partes.length >= 2
    ? `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase()
    : nombre.charAt(0).toUpperCase();
}

export default async function PerfilTrabajadorPage({ params }: Props) {
  const usuario = await requerirPermiso("trabajador.ver");
  const { id } = await params;
  const trabajador = await consultarTrabajadorPorId(usuario.id, id);
  if (!trabajador) notFound();
  const puedeEditar = tienePermiso(usuario, "trabajador.editar");
  const puedeCrearVinculo = tienePermiso(usuario, "vinculo-laboral.crear");
  const puedeVerFichas = tienePermiso(usuario, PERMISOS_FICHA.ver);
  const puedeCrearFichas = tienePermiso(usuario, PERMISOS_FICHA.crear);
  const puedeVerAlergias = tienePermiso(usuario, "alergia.ver");
  const puedeVerEvaluaciones = tienePermiso(usuario, "evaluacion-medica.ver");
  const puedeCrearEvaluaciones = tienePermiso(
    usuario,
    "evaluacion-medica.crear",
  );
  const puedeVerRegistroDiario = tienePermiso(usuario, "registro-diario.ver");
  const puedeCrearRegistroDiario = tienePermiso(
    usuario,
    "registro-diario.crear",
  );
  const puedeVerRecetas = tienePermiso(usuario, "receta.ver");
  const puedeVerDocumentos = tienePermiso(usuario, "documento-clinico.ver");
  const puedeCrearCitas = tienePermiso(usuario, "cita.crear");
  const puedeCrearRecetas = tienePermiso(usuario, "receta.crear");
  const puedeVerCitas = tienePermiso(usuario, "cita.ver");
  const tieneVinculos = trabajador.vinculos.length > 0;
  const tipoDocumento =
    TIPOS_DOCUMENTO.find((item) => item.valor === trabajador.tipoDocumento)
      ?.etiqueta ?? trabajador.tipoDocumento;
  const alergias = puedeVerAlergias
    ? (await listarAlergias(usuario.id, id)).map(
        ({
          id: alergiaId,
          tipo,
          sustancia,
          descripcion,
          severidad,
          activa,
        }) => ({
          id: alergiaId,
          tipo,
          sustancia,
          descripcion,
          severidad,
          activa,
        }),
      )
    : [];
  const historialClinico = await consultarHistorialClinicoTrabajador(usuario.id, id, {
    registroDiario: puedeVerRegistroDiario,
    evaluaciones: puedeVerEvaluaciones,
    fichas: puedeVerFichas,
    recetas: puedeVerRecetas,
    documentos: puedeVerDocumentos,
  });
  if (historialClinico.length > 0) {
    await registrarAuditoriaSegura({
      usuarioId: usuario.id,
      accion: "HISTORIAL_CLINICO_CONSULTADO",
      modulo: "HISTORIAL_CLINICO",
      entidad: "Trabajador",
      entidadId: id,
      resultado: "EXITOSO",
    });
  }
  const citas = puedeVerCitas ? await listarCitasDeTrabajador(usuario.id, id) : [];
  const alergiaCritica = alergias.find(
    (a) => a.severidad === "GRAVE" && a.activa,
  );

  return (
    <div className="space-y-8">
      <BotonRegresar rutaRespaldo="/trabajadores" />
      <Migas />

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-5">
            <Avatar size="lg" className="ring-4 ring-primary/10">
              <AvatarFallback className="text-xl">
                {Iniciales(`${trabajador.apellidos} ${trabajador.nombres}`)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {trabajador.apellidos} {trabajador.nombres}
              </h1>
              <p className="text-sm text-muted-foreground">
                {tipoDocumento}: {trabajador.numeroDocumento}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <EstadoTrabajador estado={trabajador.estadoLaboral} />
                {alergiaCritica && (
                  <Badge variant="destructive" className="gap-1">
                    <span
                      className="size-1.5 rounded-full bg-current animate-pulse"
                      aria-hidden
                    />
                    Alergia grave
                  </Badge>
                )}
                {trabajador.vinculos
                  .filter((v) => v.activa)
                  .map((v) => (
                    <Badge key={v.id} variant="outline" className="text-xs">
                      {v.empresa} · {v.departamento ?? "Sin dpto"}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {puedeEditar && (
              <Link
                href={`/trabajadores/${id}/editar`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Pencil aria-hidden /> Editar
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="default" size="sm">
                    <span className="sr-only md:not-sr-only">Acciones</span>
                    <span className="md:hidden">···</span>
                  </Button>
                }
              >
                <span className="hidden md:inline">Acciones rápidas</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {puedeCrearVinculo && (
                  <DropdownMenuItem
                    render={
                      <Link href={`/trabajadores/${id}/vinculos/nuevo`} />
                    }
                  >
                    <Link2 className="size-4" aria-hidden /> Cambiar empresa
                  </DropdownMenuItem>
                )}
                {puedeCrearFichas && (
                  <DropdownMenuItem
                    render={<Link href={`/trabajadores/${id}/fichas/nueva`} />}
                  >
                    <Plus className="size-4" aria-hidden /> Nueva ficha
                    ocupacional
                  </DropdownMenuItem>
                )}
                {puedeVerFichas && (
                  <DropdownMenuItem
                    render={<Link href={`/trabajadores/${id}/fichas`} />}
                  >
                    <FileText className="size-4" aria-hidden /> Ver fichas
                    ocupacionales
                  </DropdownMenuItem>
                )}
                {puedeCrearEvaluaciones && (
                  <DropdownMenuItem
                    render={
                      <Link
                        href={`/trabajadores/${id}/evaluaciones-medicas/nueva`}
                      />
                    }
                  >
                    <Plus className="size-4" aria-hidden /> Nueva evaluación
                  </DropdownMenuItem>
                )}
                {puedeVerEvaluaciones && (
                  <DropdownMenuItem
                    render={
                      <Link href={`/trabajadores/${id}/evaluaciones-medicas`} />
                    }
                  >
                    <FileHeart className="size-4" aria-hidden /> Ver
                    evaluaciones
                  </DropdownMenuItem>
                )}
                {puedeCrearRegistroDiario && (
                  <DropdownMenuItem
                    render={
                      <Link
                        href={`/registro-diario/nuevo?trabajadorId=${id}`}
                      />
                    }
                  >
                    <Plus className="size-4" aria-hidden /> Registro diario
                  </DropdownMenuItem>
                )}
                {puedeCrearCitas && (
                  <DropdownMenuItem
                    render={<Link href={`/citas/nueva?trabajadorId=${id}`} />}
                  >
                    <Plus className="size-4" aria-hidden /> Agendar cita
                  </DropdownMenuItem>
                )}
                {puedeCrearRecetas && (
                  <DropdownMenuItem
                    render={<Link href={`/trabajadores/${id}/recetas/nueva`} />}
                  >
                    <Plus className="size-4" aria-hidden /> Nueva receta
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Dato
                etiqueta="Nombre completo"
                valor={`${trabajador.apellidos} ${trabajador.nombres}`}
              />
              <Dato etiqueta="Cédula" valor={trabajador.numeroDocumento} />
              <Dato etiqueta="Tipo de documento" valor={tipoDocumento} />
              <Dato
                etiqueta="Fecha de nacimiento"
                valor={formatearFecha(trabajador.fechaNacimiento)}
              />
              <Dato
                etiqueta="Sexo"
                valor={texto(
                  SEXOS.find((item) => item.valor === trabajador.sexo)
                    ?.etiqueta ?? trabajador.sexo,
                )}
              />
              <Dato etiqueta="Teléfono" valor={texto(trabajador.telefono)} />
              <Dato etiqueta="Correo" valor={texto(trabajador.correo)} />
              <Dato etiqueta="Dirección" valor={texto(trabajador.direccion)} />
            </dl>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Datos laborales</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Dato etiqueta="Empresa" valor={texto(trabajador.empresa)} />
              <Dato
                etiqueta="Departamento"
                valor={texto(trabajador.departamento)}
              />
              <Dato
                etiqueta="Puesto laboral"
                valor={texto(trabajador.puestoLaboral)}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {tieneVinculos && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Historial de empresas</CardTitle>
          </CardHeader>
          <CardContent>
            {trabajador.vinculos.filter((v) => !v.activa).length > 0 ? (
              <div className="divide-y text-sm">
                {trabajador.vinculos
                  .filter((v) => !v.activa)
                  .map((vinculo) => (
                    <div
                      key={vinculo.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-medium">{vinculo.empresa}</p>
                        <p className="text-sm text-muted-foreground">
                          {vinculo.departamento ?? "Sin departamento"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatearFecha(vinculo.fechaIngreso)}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin historial de empresas anteriores.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {puedeVerAlergias && (
        <Card>
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Alergias</CardTitle>
          </CardHeader>
          <CardContent>
            <GestionAlergias
              trabajadorId={id}
              alergias={alergias}
              puedeCrear={tienePermiso(usuario, "alergia.crear")}
              puedeEditar={tienePermiso(usuario, "alergia.editar")}
            />
          </CardContent>
        </Card>
      )}

      {puedeVerCitas && (
        <Card>
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Citas médicas</CardTitle>
          </CardHeader>
          <CardContent>
            <PanelCitasColapsable citas={citas} />
          </CardContent>
        </Card>
      )}

      {(puedeVerRegistroDiario ||
        puedeVerEvaluaciones ||
        puedeVerFichas ||
        puedeVerRecetas ||
        puedeVerDocumentos) && (
        <Card>
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Historial clínico por fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <HistorialClinicoColapsable grupos={historialClinico} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
