"use client";

import type { ReactNode } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { CampoError } from "@/componentes/formularios/campo-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { SEXOS, TIPOS_DOCUMENTO } from "@/modulos/trabajadores/constantes";
import type { EntradaTrabajador } from "@/modulos/trabajadores/validaciones/trabajador.schema";

const selector = "min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50";

export function SeccionDatosPersonales({ register, errors }: { register: UseFormRegister<EntradaTrabajador>; errors: FieldErrors<EntradaTrabajador> }) {
  return (
    <CardSection titulo="Datos personales">
      <Campo etiqueta="Tipo de documento" id="tipoDocumento" required error={errors.tipoDocumento?.message}>
        <select id="tipoDocumento" className={selector} aria-invalid={Boolean(errors.tipoDocumento)} {...register("tipoDocumento")}>
          {TIPOS_DOCUMENTO.map((item) => (
            <option key={item.valor} value={item.valor}>{item.etiqueta}</option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Número de documento" id="numeroDocumento" required error={errors.numeroDocumento?.message}>
        <Input id="numeroDocumento" className="min-h-11" autoComplete="off" aria-invalid={Boolean(errors.numeroDocumento)} {...register("numeroDocumento")} />
      </Campo>
      <Campo etiqueta="Nombres" id="nombres" required error={errors.nombres?.message}>
        <Input id="nombres" className="min-h-11" autoComplete="given-name" aria-invalid={Boolean(errors.nombres)} {...register("nombres")} />
      </Campo>
      <Campo etiqueta="Apellidos" id="apellidos" required error={errors.apellidos?.message}>
        <Input id="apellidos" className="min-h-11" autoComplete="family-name" aria-invalid={Boolean(errors.apellidos)} {...register("apellidos")} />
      </Campo>
      <Campo etiqueta="Fecha de nacimiento" id="fechaNacimiento" required error={errors.fechaNacimiento?.message}>
        <Input id="fechaNacimiento" className="min-h-11" type="date" aria-invalid={Boolean(errors.fechaNacimiento)} {...register("fechaNacimiento")} />
      </Campo>
      <Campo etiqueta="Sexo" id="sexo" error={errors.sexo?.message}>
        <select id="sexo" className={selector} aria-invalid={Boolean(errors.sexo)} {...register("sexo")}>
          {SEXOS.map((item) => (
            <option key={item.valor} value={item.valor}>{item.etiqueta}</option>
          ))}
        </select>
      </Campo>
    </CardSection>
  );
}

export function CardSection({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{titulo}</CardTitle></CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function Campo({ etiqueta, id, error, required: req, children }: { etiqueta: string; id: string; error?: string; required?: boolean; children: ReactNode }) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        <EtiquetaCampo etiqueta={etiqueta} required={req} />
      </Label>
      {children}
      <CampoError id={errorId} mensaje={error} />
    </div>
  );
}
