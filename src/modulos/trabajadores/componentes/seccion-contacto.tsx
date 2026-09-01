"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";
import type { EntradaTrabajador } from "@/modulos/trabajadores/validaciones/trabajador.schema";
import { Campo, CardSection } from "./seccion-datos-personales";

export function SeccionContacto({ register, errors }: { register: UseFormRegister<EntradaTrabajador>; errors: FieldErrors<EntradaTrabajador> }) {
  return (
    <CardSection titulo="Contacto">
      <Campo etiqueta="Teléfono" id="telefono" error={errors.telefono?.message}>
        <Input id="telefono" className="min-h-11" autoComplete="tel" aria-invalid={Boolean(errors.telefono)} {...register("telefono")} />
      </Campo>
      <Campo etiqueta="Correo" id="correo" error={errors.correo?.message}>
        <Input id="correo" className="min-h-11" type="email" autoComplete="email" aria-invalid={Boolean(errors.correo)} {...register("correo")} />
      </Campo>
      <div className="space-y-2 sm:col-span-2">
        <Campo etiqueta="Dirección" id="direccion" error={errors.direccion?.message}>
          <Textarea id="direccion" aria-invalid={Boolean(errors.direccion)} {...register("direccion")} />
        </Campo>
      </div>
    </CardSection>
  );
}
