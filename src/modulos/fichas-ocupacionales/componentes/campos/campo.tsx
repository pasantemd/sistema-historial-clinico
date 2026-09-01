import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Label } from "@/componentes/ui/label";
import { CampoError } from "@/componentes/formularios/campo-error";

export function Campo({
  etiqueta,
  error,
  children,
  className = "",
  htmlFor,
  required,
}: {
  etiqueta: string;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={htmlFor}><EtiquetaCampo etiqueta={etiqueta} required={required} /></Label>
      {children}
      <CampoError mensaje={error} />
    </div>
  );
}

export function CampoGrupo({ etiqueta, error, children, className = "" }: { etiqueta: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={`space-y-2 ${className}`}>
      <legend className="text-sm font-medium">{etiqueta}</legend>
      {children}
      <CampoError mensaje={error} />
    </fieldset>
  );
}

export function FilaCheckbox({
  registro,
  etiqueta,
}: {
  registro: UseFormRegisterReturn;
  etiqueta: string;
}) {
  return (
    <label className="flex min-h-9 items-center gap-2 rounded-md px-1 text-sm transition-colors hover:bg-muted/50">
      <input type="checkbox" className="size-4 rounded border-input accent-primary" {...registro} />
      {etiqueta}
    </label>
  );
}
