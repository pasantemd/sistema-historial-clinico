import { z } from "zod";

const textoObligatorio = (campo: string) =>
  z
    .string()
    .trim()
    .min(1, `${campo} es obligatorio.`)
    .max(160, `${campo} no debe superar 160 caracteres.`);

export const datosProfesionalSchema = z.object({
  nombreCompleto: textoObligatorio("Nombre completo"),
  cedula: textoObligatorio("Cédula").max(32, "Cédula no debe superar 32 caracteres."),
  codigoProfesional: textoObligatorio("Código profesional").max(
    64,
    "Código profesional no debe superar 64 caracteres.",
  ),
  profesion: textoObligatorio("Profesión"),
  correo: z
    .string()
    .trim()
    .email("Ingrese un correo electrónico válido.")
    .max(160, "Correo no debe superar 160 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type EntradaDatosProfesional = z.input<typeof datosProfesionalSchema>;
export type DatosProfesional = z.output<typeof datosProfesionalSchema>;
