import { z } from "zod";
import { OPCIONES_TAMANO_PAGINA_DEPARTAMENTOS, TAMANO_PAGINA_DEPARTAMENTOS } from "@/modulos/departamentos/constantes";

export const departamentoSchema = z.object({
  empresaId: z.uuid("Seleccione una empresa válida."),
  nombre: z.string().trim().min(2, "Ingrese el nombre del departamento.").max(100, "No puede superar 100 caracteres."),
  descripcion: z.string().trim().max(300, "No puede superar 300 caracteres.").transform((valor) => valor || undefined).optional(),
});

export const filtrosDepartamentosSchema = z.object({
  busqueda: z.string().trim().max(100).optional().catch(undefined),
  empresaId: z.uuid().optional().catch(undefined),
  pagina: z.coerce.number().int().positive().catch(1),
  tamanoPagina: z.coerce
    .number()
    .refine(
      (valor) => OPCIONES_TAMANO_PAGINA_DEPARTAMENTOS.includes(valor as (typeof OPCIONES_TAMANO_PAGINA_DEPARTAMENTOS)[number]),
      "Seleccione una cantidad válida.",
    )
    .catch(TAMANO_PAGINA_DEPARTAMENTOS),
});

export type EntradaDepartamento = z.input<typeof departamentoSchema>;
export type DatosDepartamento = z.output<typeof departamentoSchema>;
