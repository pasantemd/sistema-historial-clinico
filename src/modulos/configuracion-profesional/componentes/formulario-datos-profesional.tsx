"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { actualizarDatosProfesionalAccion } from "@/modulos/configuracion-profesional/acciones/profesional.acciones";
import type { DatosProfesionalFormulario } from "@/modulos/configuracion-profesional/tipos";
import {
  datosProfesionalSchema,
  type DatosProfesional,
  type EntradaDatosProfesional,
} from "@/modulos/configuracion-profesional/validaciones/profesional.schema";
import { Badge } from "@/componentes/ui/badge";
import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { CampoError } from "@/componentes/formularios/campo-error";

interface Props {
  valoresIniciales: DatosProfesionalFormulario;
}

function CampoTexto({
  id,
  etiqueta,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      <CampoError id={`${id}-error`} mensaje={error} />
    </div>
  );
}

export function FormularioDatosProfesional({ valoresIniciales }: Props) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [pendiente, iniciarTransicion] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EntradaDatosProfesional, unknown, DatosProfesional>({
    resolver: zodResolver(datosProfesionalSchema),
    defaultValues: valoresIniciales,
  });

  const enviar = handleSubmit((datos) => {
    setMensaje(undefined);
    setErrorGeneral(undefined);

    iniciarTransicion(async () => {
      const resultado = await actualizarDatosProfesionalAccion(datos);

      if (!resultado.exito) {
        setErrorGeneral(resultado.mensaje);
        for (const [campo, mensajes] of Object.entries(resultado.erroresCampos ?? {})) {
          setError(campo as keyof EntradaDatosProfesional, { message: mensajes[0] });
        }
        return;
      }

      reset(datos);
      setMensaje(resultado.mensaje);
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope className="size-5 text-primary" aria-hidden />
          Datos del médico / profesional
        </CardTitle>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant={valoresIniciales.estado === "ACTIVO" ? "success" : "secondary"}>
            {valoresIniciales.estado === "ACTIVO" ? "Activo" : "Inactivo"}
          </Badge>
          {valoresIniciales.roles.length > 0 ? (
            valoresIniciales.roles.map((rol) => (
              <Badge key={rol} variant="outline">
                {rol}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">Sin rol asignado</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={enviar}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CampoTexto id="nombreCompleto" etiqueta="Nombre completo *" error={errors.nombreCompleto?.message}>
              <Input
                id="nombreCompleto"
                autoComplete="name"
                aria-invalid={Boolean(errors.nombreCompleto)}
                aria-describedby={errors.nombreCompleto ? "nombreCompleto-error" : undefined}
                {...register("nombreCompleto")}
              />
            </CampoTexto>

            <CampoTexto id="cedula" etiqueta="Cédula *" error={errors.cedula?.message}>
              <Input
                id="cedula"
                autoComplete="off"
                aria-invalid={Boolean(errors.cedula)}
                aria-describedby={errors.cedula ? "cedula-error" : undefined}
                {...register("cedula")}
              />
            </CampoTexto>

            <CampoTexto
              id="codigoProfesional"
              etiqueta="Código profesional *"
              error={errors.codigoProfesional?.message}
            >
              <Input
                id="codigoProfesional"
                autoComplete="off"
                aria-invalid={Boolean(errors.codigoProfesional)}
                aria-describedby={errors.codigoProfesional ? "codigoProfesional-error" : undefined}
                {...register("codigoProfesional")}
              />
            </CampoTexto>

            <CampoTexto id="profesion" etiqueta="Profesión *" error={errors.profesion?.message}>
              <Input
                id="profesion"
                autoComplete="organization-title"
                aria-invalid={Boolean(errors.profesion)}
                aria-describedby={errors.profesion ? "profesion-error" : undefined}
                {...register("profesion")}
              />
            </CampoTexto>

            <CampoTexto id="correo" etiqueta="Correo" error={errors.correo?.message}>
              <Input
                id="correo"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.correo)}
                aria-describedby={errors.correo ? "correo-error" : undefined}
                {...register("correo")}
              />
            </CampoTexto>
          </div>

          {mensaje && (
            <p role="status" className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success">
              {mensaje}
            </p>
          )}
          {errorGeneral && (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {errorGeneral}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pendiente}>
              <Save aria-hidden />
              {pendiente ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
