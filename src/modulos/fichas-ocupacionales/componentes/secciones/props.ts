import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";

import type { EntradaFicha } from "@/modulos/fichas-ocupacionales/validaciones/ficha.schema";

export interface PropsSeccion {
  register: UseFormRegister<EntradaFicha>;
  errors: FieldErrors<EntradaFicha>;
  control: Control<EntradaFicha>;
  watch: UseFormWatch<EntradaFicha>;
}

export function obtenerError(errors: FieldErrors<EntradaFicha>, ruta: string): string | undefined {
  const partes = ruta.split(".");
  let actual: unknown = errors;
  for (const parte of partes) {
    if (actual == null || typeof actual !== "object") return undefined;
    actual = (actual as Record<string, unknown>)[parte];
  }
  return (actual as { message?: string } | undefined)?.message;
}

export interface PropsTabla {
  register: UseFormRegister<EntradaFicha>;
  errors: FieldErrors<EntradaFicha>;
  control: Control<EntradaFicha>;
}
