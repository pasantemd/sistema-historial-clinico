import { z } from "zod";

export const iniciarSesionSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, "Ingrese su correo electrónico.")
    .email("Ingrese un correo electrónico válido.")
    .transform((correo) => correo.toLowerCase()),
  contrasena: z.string().min(1, "Ingrese su contraseña."),
});

export type EntradaInicioSesion = z.input<typeof iniciarSesionSchema>;
export type DatosInicioSesion = z.output<typeof iniciarSesionSchema>;
